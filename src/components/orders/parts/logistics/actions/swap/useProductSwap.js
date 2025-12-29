import { db } from '../../../../../../lib/firebase';
import { doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { DB } from '../../../../../../constants/collections';
import { SCHEMA } from '../../../../../../constants/schema';

export const useProductSwap = (notify) => {
    const S = SCHEMA.ORDERS;
    const I = S.ITEM;
    const L = SCHEMA.LOGISTICS;

    const swapProduct = async (order, itemIndex, newProduct) => {
        const batch = writeBatch(db);
        const orderRef = doc(db, DB.ORDERS, order.id);

        // 1. Clonamos items y extraemos el viejo para el rastro
        const updatedItems = [...order[S.ITEMS]];
        const oldItem = updatedItems[itemIndex];

        // 2. Reemplazamos el producto
        updatedItems[itemIndex] = {
            ...oldItem,
            [I.SKU]: newProduct[SCHEMA.PRODUCTS.SKU],
            [I.MODEL]: newProduct[SCHEMA.PRODUCTS.VERSION],
            [I.COST]: newProduct[SCHEMA.PRODUCTS.COST],
            [I.PRICE]: newProduct[SCHEMA.PRODUCTS.PRICE],
            [I.IMAGE]: newProduct[SCHEMA.PRODUCTS.IMAGE],
            // Dejamos huella del cambio
            swap_history: {
                previous_sku: oldItem[I.SKU],
                previous_cost: oldItem[I.COST],
                date: new Date().toISOString()
            }
        };

        // 3. Recalculamos el costo total del pedido con el nuevo producto
        const nuevoCostoTotal = updatedItems.reduce((acc, item) => acc + (Number(item[I.COST]) || 0), 0);
        const pagoAcumulado = order.logistics?.pago_acumulado || 0;

        // 4. Decidimos el nuevo estado basado en la matemática, no en deseos
        const estaPagado = pagoAcumulado >= nuevoCostoTotal;

        try {
            batch.update(orderRef, {
                [S.ITEMS]: updatedItems,
                [S.TOTAL]: updatedItems.reduce((acc, item) => acc + (Number(item[I.TOTAL]) || 0), 0),
                'logistics.status': estaPagado ? L.STATUS.READY : L.STATUS.PENDING,
                [S.STATUS]: estaPagado ? 'Listo para Despacho' : 'Saldo Pendiente por Cambio',
                updatedAt: serverTimestamp()
            });

            await batch.commit();
            notify?.('Producto cambiado y saldos recalculados', 'success');
            return true;
        } catch (error) {
            console.error(error);
            notify?.('Error al cambiar producto', 'error');
            return false;
        }
    };

    return { swapProduct };
};