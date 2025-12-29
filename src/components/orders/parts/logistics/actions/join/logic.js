import { db } from '../../../../../../lib/firebase';
import { doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { DB } from '../../../../../../constants/collections';
import { SCHEMA } from '../../../../../../constants/schema';

/**
 * LÓGICA DE FILTRADO (VER)
 * Filtra qué pedidos son compatibles con el pedido base.
 */
export const getJoinCandidates = (baseOrder, allOrders) => {
    if (!baseOrder || !allOrders) return [];

    const S = SCHEMA.ORDERS;
    const L = SCHEMA.LOGISTICS;
    const C = S.CLIENT;
    const I = S.ITEM;

    // NORMALIZAMOS: Pasamos a mayúsculas para que 'acopio' sea igual a 'ACOPIO'
    const baseProvider = baseOrder[S.ITEMS]?.[0]?.[I.PROVIDER];
    const baseCity = (baseOrder[C.ROOT]?.[C.CITY_DELIVERY] || baseOrder[C.ROOT]?.[C.CITY])?.toUpperCase();
    const baseStrategy = baseOrder[S.STRATEGY]?.toUpperCase(); // <--- NORMALIZADO

    return allOrders.filter(o => {
        const isSelf = o.id === baseOrder.id;
        const hasGroup = !!o.logistics?.groupId;

        // Comparación de Proveedor
        const matchProvider = o[S.ITEMS]?.[0]?.[I.PROVIDER] === baseProvider;

        // Comparación de Ciudad (Normalizada)
        const currentCity = (o[C.ROOT]?.[C.CITY_DELIVERY] || o[C.ROOT]?.[C.CITY])?.toUpperCase();
        const matchCity = currentCity === baseCity;

        // Comparación de Estrategia (Normalizada) - ESTO ARREGLA TU PROBLEMA
        const matchStrategy = o[S.STRATEGY]?.toUpperCase() === baseStrategy;

        const isPending = o.logistics?.status === L.STATUS.PENDING;

        return !isSelf && !hasGroup && matchProvider && matchCity && matchStrategy && isPending;
    });
};

/**
 * LÓGICA DE EJECUCIÓN (HACER)
 * Impacta la base de datos para unir los pedidos seleccionados.
 */
export const executeJoin = async (orders, masterAddress, notify) => {
    if (!orders || orders.length < 2) return false;

    const batch = writeBatch(db);
    const newGroupId = `group_manual_${Date.now()}`;
    const S = SCHEMA.ORDERS;
    const L = SCHEMA.LOGISTICS;

    try {
        orders.forEach(order => {
            const orderRef = doc(db, DB.ORDERS, order.id);
            batch.update(orderRef, {
                'logistics.groupId': newGroupId,
                'logistics.master_address': masterAddress,
                'logistics.status': L.STATUS.PENDING,
                [S.STATUS]: 'Listo para Despacho',
                updatedAt: serverTimestamp()
            });
        });

        await batch.commit();
        notify?.('Pedidos unificados correctamente.', 'success');
        return true;
    } catch (error) {
        console.error("Join Error:", error);
        notify?.('Error al unificar pedidos.', 'error');
        return false;
    }
};