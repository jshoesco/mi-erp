import { db } from '../../../../../../lib/firebase';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { DB } from '../../../../../../constants/collections';
import { SCHEMA } from '../../../../../../constants/schema';

export const useOrderSplit = (notify) => {
    const S = SCHEMA.ORDERS;
    const I = S.ITEM;

    const splitOrderItem = async (originalOrder, itemIndex) => {
        const itemToMove = originalOrder[S.ITEMS][itemIndex];
        const newOrderId = `${originalOrder.id}_split_${Date.now()}`;
        const visualId = originalOrder[S.ID_ORDER];

        try {
            await runTransaction(db, async (transaction) => {
                const originalRef = doc(db, DB.ORDERS, originalOrder.id);
                const newRef = doc(db, DB.ORDERS, newOrderId);

                // 1. Quitamos el ítem del pedido original
                const updatedItems = originalOrder[S.ITEMS].filter((_, index) => index !== itemIndex);

                transaction.update(originalRef, {
                    [S.ITEMS]: updatedItems,
                    updatedAt: serverTimestamp()
                });

                // 2. Creamos el nuevo pedido (Hijo)
                // Limpiamos logs de logística para que empiece de cero
                transaction.set(newRef, {
                    ...originalOrder,
                    id: newOrderId,
                    [S.ID_ORDER]: `${visualId}-REV`,
                    [S.ITEMS]: [itemToMove],
                    parent_order_id: originalOrder.id,
                    updatedAt: serverTimestamp(),
                    logistics: {
                        status: 'pago-pendiente',
                        pago_acumulado: 0,
                        groupId: null,
                        guide_number: null
                    }
                });
            });
            notify?.('Producto separado en un nuevo pedido.', 'success');
            return true;
        } catch (error) {
            console.error("Split Error:", error);
            notify?.('No se pudo separar el producto.', 'error');
            return false;
        }
    };

    return { splitOrderItem };
};