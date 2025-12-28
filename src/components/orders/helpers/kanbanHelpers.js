import { SCHEMA } from '../../../constants/schema';

/**
 * Organiza los pedidos para el tablero de VENTAS.
 * REAGRUPA pedidos divididos (splits) para vista unificada del cliente.
 */
export const getSalesKanban = (orders = [], searchText = '') => {
    const cols = {
        'Pendiente': [],
        'Listo para Despacho': [],
        'Enviado': [],
        'Entregado': [],
        'Novedad': []
    };

    if (!orders || !Array.isArray(orders)) return cols;

    const unifiedMap = {};

    orders.forEach(order => {
        // Usamos ID_ORDER del Schema (id_visual)
        const key = order[SCHEMA.ORDERS.ID_ORDER] || order.id;
        if (!unifiedMap[key]) {
            unifiedMap[key] = { ...order };
        } else {
            // Unificamos items usando la llave del Schema
            const currentItems = unifiedMap[key][SCHEMA.ORDERS.ITEMS] || [];
            const newItems = order[SCHEMA.ORDERS.ITEMS] || [];
            unifiedMap[key][SCHEMA.ORDERS.ITEMS] = [...currentItems, ...newItems];
        }
    });

    const filtered = Object.values(unifiedMap).filter(o => {
        if (!searchText) return true;
        const search = searchText.toLowerCase();
        const clientRoot = o[SCHEMA.ORDERS.CLIENT.ROOT] || {};
        const clientName = clientRoot[SCHEMA.ORDERS.CLIENT.NAME] || '';
        const idVisual = o[SCHEMA.ORDERS.ID_ORDER]?.toString() || '';
        return clientName.toLowerCase().includes(search) || idVisual.includes(search);
    });

    filtered.forEach(order => {
        const estado = order[SCHEMA.ORDERS.STATUS] || 'Pendiente';
        if (cols[estado]) {
            cols[estado].push(order);
        } else {
            cols['Pendiente'].push(order);
        }
    });

    return cols;
};

/**
 * Organiza los pedidos para el tablero de LOGÍSTICA.
 * RESPETA el campo STRATEGY (estrategia) del Schema para agrupar Acopios.
 */
export const getLogisticsKanban = (orders = [], searchText = '') => {
    const columns = {
        'pago-pendiente': [],
        'por-despachar': [],
        'enviado': [],
        'entregado': []
    };

    if (!orders || !Array.isArray(orders)) return columns;

    const filtered = orders.filter(o => {
        // Filtro de archivados según Schema
        if (o[SCHEMA.ORDERS.ARCHIVED]) return false;
        if (!searchText) return true;
        const search = searchText.toLowerCase();
        const clientRoot = o[SCHEMA.ORDERS.CLIENT.ROOT] || {};
        const clientName = clientRoot[SCHEMA.ORDERS.CLIENT.NAME] || '';
        const idVisual = o[SCHEMA.ORDERS.ID_ORDER]?.toString() || '';
        return clientName.toLowerCase().includes(search) || idVisual.includes(search);
    });

    const groupsMap = {};

    filtered.forEach(order => {
        const items = order[SCHEMA.ORDERS.ITEMS] || [];
        const mainItem = items[0] || {};

        // Atributos desde el SCHEMA
        const provider = mainItem[SCHEMA.ORDERS.ITEM.PROVIDER] || 'SIN PROVEEDOR';
        const clientRoot = order[SCHEMA.ORDERS.CLIENT.ROOT] || {};
        const city = clientRoot[SCHEMA.ORDERS.CLIENT.CITY] || 'SIN CIUDAD';
        const strategy = (order[SCHEMA.ORDERS.STRATEGY] || 'DIRECTO').toUpperCase();

        // Estado logístico
        let status = order.logistics?.status || (order[SCHEMA.ORDERS.STATUS] || '').toLowerCase();
        if (status === 'pendiente') status = 'pago-pendiente';
        if (status === 'listo para despacho') status = 'por-despachar';

        // Asegurar que caiga en una columna válida
        if (!columns[status]) status = 'pago-pendiente';

        let groupId = order.logistics?.groupId;

        if (!groupId) {
            if (strategy === 'ACOPIO' && (status === 'pago-pendiente' || status === 'por-despachar')) {
                groupId = `auto-acopio-${provider}-${city}`.toLowerCase().replace(/\s+/g, '');
            } else {
                groupId = `single-${order.id}`;
            }
        }

        const groupKey = `${groupId}-${status}`.toLowerCase();

        if (!groupsMap[groupKey]) {
            groupsMap[groupKey] = {
                id: groupKey,
                groupId: order.logistics?.groupId || (strategy === 'ACOPIO' ? groupId : null),
                provider,
                city,
                shippingType: strategy,
                status,
                orders: [],
                totalCost: 0,
                totalPaid: 0,
                oldestOrder: order[SCHEMA.ORDERS.DATE] || null
            };
        }

        const orderCost = items.reduce((acc, item) => acc + (Number(item[SCHEMA.ORDERS.ITEM.COST]) || 0), 0);
        const orderPaid = order.logistics?.payment?.amount || 0;

        groupsMap[groupKey].totalCost += orderCost;
        groupsMap[groupKey].totalPaid += orderPaid;
        groupsMap[groupKey].orders.push(order);
    });

    Object.values(groupsMap).forEach(group => {
        if (columns[group.status]) {
            columns[group.status].push(group);
        } else {
            columns['pago-pendiente'].push(group);
        }
    });

    return columns;
};