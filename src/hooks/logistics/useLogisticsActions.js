import { db } from '../../../lib/firebase';
import { doc, runTransaction, serverTimestamp, collection } from 'firebase/firestore';
import { DB } from '../../../constants/collections';

export const useLogisticsActions = (notify) => {

    const splitOrderItem = async (originalOrder, itemIndex) => {
        const itemToMove = originalOrder.items[itemIndex];
        const newOrderId = `${originalOrder.id}_split_${Date.now()}`;
        const logisticsId = originalOrder.logisticsId || originalOrder.id_visual;

        try {
            await runTransaction(db, async (transaction) => {
                const originalDocRef = doc(db, DB.ORDERS, originalOrder.id);
                const newDocRef = doc(db, DB.ORDERS, newOrderId);

                // 1. Quitamos el ítem del pedido original
                const updatedItems = originalOrder.items.filter((_, index) => index !== itemIndex);

                transaction.update(originalDocRef, {
                    items: updatedItems,
                    updatedAt: serverTimestamp()
                });

                // 2. Creamos el nuevo pedido "Hijo" con ese único ítem
                transaction.set(newDocRef, {
                    ...originalOrder,
                    id: newOrderId,
                    id_logistico: `${logisticsId}-REV`, // Identificador para logística
                    items: [itemToMove],
                    parent_order_id: originalOrder.id,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    // Reiniciamos estado logístico del nuevo ítem si es necesario
                    logistics: {
                        status: 'pago-pendiente',
                        payment: null
                    }
                });
            });

            notify?.('Producto desvinculado con éxito.', 'success');
            return true;
        } catch (error) {
            console.error("Error en Split:", error);
            notify?.('No se pudo separar el producto.', 'error');
            return false;
        }
    };

    return { splitOrderItem };
};