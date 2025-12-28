import { db } from '../../../../../lib/firebase';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { DB } from '../../../../../constants/collections';

export const useOrderSplit = (notify) => {
    const splitOrderItem = async (order, itemIndex) => {
        const newDocId = `${order.id}_split_${Date.now()}`;
        const itemToMove = order.items[itemIndex];

        try {
            await runTransaction(db, async (transaction) => {
                const originalRef = doc(db, DB.ORDERS, order.id);
                const newDocRef = doc(db, DB.ORDERS, newDocId);

                const remainingItems = order.items.filter((_, idx) => idx !== itemIndex);

                // Si queda vacío, no lo borramos, pero le advertimos al usuario
                // O mejor: permitimos la creación del hijo y dejamos el padre sin ese ítem
                if (remainingItems.length === 0) {
                    throw new Error("No puedes separar el único producto de este pedido. Si quieres moverlo de grupo, usa la vinculación manual.");
                }

                // 1. Actualizar el padre
                transaction.update(originalRef, {
                    items: remainingItems,
                    updatedAt: serverTimestamp()
                });

                // 2. Crear el hijo
                transaction.set(newDocRef, {
                    ...order,
                    id: newDocId,
                    id_logistico: `${order.id_visual || 'S/N'}-B`,
                    items: [itemToMove],
                    parent_order_id: order.id,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    logistics: {
                        ...order.logistics,
                        status: 'pago-pendiente',
                        groupId: null
                    }
                });
            });

            notify?.('Producto separado correctamente.', 'success');
            return true;
        } catch (error) {
            console.error("Split Error:", error);
            notify?.(error.message || 'Error al separar el producto', 'error');
            return false;
        }
    };

    return { splitOrderItem };
};