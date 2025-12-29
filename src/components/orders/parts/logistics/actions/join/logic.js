import { db } from '../../../../../../lib/firebase';
import { doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { DB } from '../../../../../../constants/collections';
import { SCHEMA } from '../../../../../../constants/schema';

export const getJoinCandidates = (baseOrder, allOrders) => {
    if (!baseOrder || !allOrders) return [];

    const S = SCHEMA.ORDERS;
    const L = SCHEMA.LOGISTICS;
    const C = S.CLIENT;
    const I = S.ITEM;

    // Extraemos y limpiamos espacios para evitar errores de tipeo
    const baseProvider = baseOrder[S.ITEMS]?.[0]?.[I.PROVIDER];
    const baseCity = String(baseOrder[C.ROOT]?.[C.CITY] || '').trim();
    const baseStrategy = String(baseOrder[S.STRATEGY] || '').trim();

    return allOrders.filter(o => {
        const isSelf = o.id === baseOrder.id;
        const hasGroup = !!o.logistics?.groupId;

        // Si el status es undefined, permitimos que pase (isPending = true) 
        // para evitar que el error de datos bloquee la operativa
        const currentStatus = o.logistics?.status;
        const isPending = !currentStatus || currentStatus === L.STATUS.PENDING;

        if (isSelf || hasGroup || !isPending) return false;

        // LEY 1: PROVEEDOR
        const matchProvider = o[S.ITEMS]?.[0]?.[I.PROVIDER] === baseProvider;

        // LEY 2: CIUDAD (Limpiando espacios)
        const currentCity = String(o[C.ROOT]?.[C.CITY] || '').trim();
        const matchCity = currentCity === baseCity;

        // LEY 3: ESTRATEGIA (Limpiando espacios)
        const currentStrategy = String(o[S.STRATEGY] || '').trim();
        const matchStrategy = currentStrategy === baseStrategy;

        return matchProvider && matchCity && matchStrategy;
    });
};

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