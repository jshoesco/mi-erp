import { normalizeText } from '../../../lib/utils';

export const calculateItemDebt = (item) => 
    Math.max(0, ((Number(item.costo) || 0) + (Number(item.costo_envio_asignado) || 0)) - (Number(item.pago_proveedor) || 0));

export const getSalesKanban = (orders, searchText) => {
    const cols = { pendiente: [], despacho: [], enviado: [], completado: [], novedad: [] };
    
    const filtered = orders.filter(o => {
        if (!searchText) return true;
        const term = searchText.toLowerCase();
        const clientName = o.cliente?.nombre?.toLowerCase() || '';
        const visualId = String(o.id_visual || '');
        const city = o.cliente?.ciudad_entrega?.toLowerCase() || '';
        const hasItemMatch = o.items?.some(it => 
            it.modelo?.toLowerCase().includes(term) || it.sku?.toLowerCase().includes(term)
        );
        return clientName.includes(term) || visualId.includes(term) || city.includes(term) || hasItemMatch;
    });

    filtered.forEach(o => {
        const hasAnomaly = o.items?.some(i => i.devolucion && i.devolucion.estado !== 'Resuelto');
        if (hasAnomaly || ['Devuelto', 'Rechazado'].includes(o.estado)) cols.novedad.push(o);
        else if (o.estado === 'Pendiente') cols.pendiente.push(o);
        else if (['En Despacho', 'Parcial'].includes(o.estado)) cols.despacho.push(o);
        else if (o.estado === 'Enviado') cols.enviado.push(o);
        else if (o.estado === 'Completado') cols.completado.push(o);
        else cols.pendiente.push(o);
    });
    return cols;
};

export const getLogisticsKanban = (orders, searchText) => {
    const columns = { pending: [], ready: [], shipped: [], delivered: [] };
    const grouped = {};

    // 1. AGRUPACIÓN TOTAL (Sin filtrar primero para preservar vínculos)
    orders.forEach(order => {
        if (order.estado === 'Devuelto' || order.estado === 'Rechazado') return;
        
        order.items?.forEach((item, idx) => {
            if (item.devolucion) return;
            const provName = item.proveedor_nombre || 'Sin Prov';
            const strategy = order.estrategia || 'Directo';
            const city = order.cliente?.ciudad_entrega || 'Sin Ciudad';
            
            let key;
            if (item.fecha_entrega) key = `DEL_${item.guia?.numero}_${item.fecha_entrega}`;
            else if (item.guia?.numero) key = `SHIP_${item.guia.numero}`;
            else if (item.linked_to_id) key = `LINKED_${item.linked_to_id}`;
            else key = normalizeText(strategy) === 'acopio' ? `GRP_ACOPIO_${provName}_${normalizeText(city)}` : `INDIV_${order.id}_${provName}`; 

            if (!grouped[key]) {
                grouped[key] = { id: key, provName, city, estrategia: strategy, items: [], totalDebt: 0, guideInfo: item.guia, mainClientName: order.cliente?.nombre };
            }
            grouped[key].items.push({ ...item, orderId: order.id, orderVisualId: order.id_visual, clientName: order.cliente?.nombre });
            grouped[key].totalDebt += calculateItemDebt(item);
        });
    });

    // 2. FILTRO SOBRE LOS GRUPOS FORMADOS
    const finalGroups = Object.values(grouped).filter(g => {
        if (!searchText) return true;
        const term = searchText.toLowerCase();
        // El grupo sobrevive si CUALQUIERA de sus integrantes o datos coinciden
        return g.items.some(it => 
            it.clientName?.toLowerCase().includes(term) || 
            String(it.orderVisualId).includes(term) || 
            it.modelo?.toLowerCase().includes(term) || 
            it.sku?.toLowerCase().includes(term)
        ) || g.city.toLowerCase().includes(term) || g.provName.toLowerCase().includes(term);
    });

    // 3. ASIGNACIÓN A COLUMNAS SEGÚN ESTADO DE TODO EL GRUPO
    finalGroups.forEach(g => {
        g.clients = Object.entries(
            g.items.reduce((acc, it) => {
                if (!acc[it.orderVisualId]) acc[it.orderVisualId] = { name: it.clientName, items: [] };
                acc[it.orderVisualId].items.push(it);
                return acc;
            }, {})
        ).map(([id, data]) => ({ visualId: id, ...data }));

        if (g.guideInfo?.numero && g.items[0]?.fecha_entrega) columns.delivered.push(g);
        else if (g.guideInfo?.numero) columns.shipped.push(g);
        else if (g.totalDebt > 0.1) columns.pending.push(g); // Deuda mayor a cero mueve todo el grupo
        else columns.ready.push(g);
    });
    return columns;
};