import { db } from '../../../../../lib/firebase';
import { doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { DB } from '../../../../../constants/collections';

export const useOrderJoin = (notify) => {
    const joinOrders = async (orders, masterAddress) => {
        if (!orders || orders.length < 2) {
            notify?.('Selecciona al menos dos pedidos.', 'error');
            return false;
        }

        const batch = writeBatch(db);
        const newGroupId = `group_manual_${Date.now()}`;

        try {
            orders.forEach(order => {
                const orderRef = doc(db, DB.ORDERS, order.id);
                batch.update(orderRef, {
                    'logistics.groupId': newGroupId,
                    'logistics.master_address': masterAddress,
                    'logistics.status': 'pago-pendiente',
                    updatedAt: serverTimestamp()
                });
            });

            await batch.commit();
            notify?.('Pedidos vinculados con éxito.', 'success');
            return true;
        } catch (error) {
            console.error("Join Error:", error);
            notify?.('Error al vincular pedidos.', 'error');
            return false;
        }
    };

    return { joinOrders };
};