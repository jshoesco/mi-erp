import { db } from '../../../lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { DB } from '../../../constants/collections';
import { SCHEMA } from '../../../constants/schema';

export const useOrdersActions = () => {
    const saveOrder = async (orderData) => {
        try {
            const S = SCHEMA.ORDERS;
            const C = S.CLIENT;
            const I = S.ITEM;

            // 1. Mapeo de Items según Schema
            const processedItems = (orderData[S.ITEMS] || []).map(item => ({
                [I.SKU]: item[I.SKU] || '',
                [I.MODEL]: item[I.MODEL] || '',
                [I.QTY]: Number(item[I.QTY] || 1),
                [I.PRICE]: Number(item[I.PRICE] || 0),
                [I.COST]: Number(item[I.COST] || 0),
                [I.TOTAL]: Number(item[I.QTY] || 1) * Number(item[I.PRICE] || 0),
                [I.TALLA]: item[I.TALLA] || 'N/A',
                [I.PROVIDER]: item[I.PROVIDER] || 'SIN PROVEEDOR',
                [I.PROVIDER_ID]: item[I.PROVIDER_ID] || '',
                [I.IMAGE]: item[I.IMAGE] || '',
                [I.UNIQUE_ID]: item[I.UNIQUE_ID] || crypto.randomUUID(),
            }));

            // 2. Cálculo del total basado en items
            const totalPedido = processedItems.reduce((acc, item) => acc + (item[I.TOTAL] || 0), 0);

            // 3. Objeto Final (Espejo del Schema)
            const firebaseOrder = {
                [S.ID_ORDER]: orderData[S.ID_ORDER] || Date.now().toString(),
                [S.STRATEGY]: orderData[S.STRATEGY] || 'DIRECTO',
                [S.STATUS]: orderData[S.STATUS] || 'Pendiente',
                [S.DATE]: orderData[S.DATE] || new Date().toISOString().split('T')[0],
                [S.TOTAL]: totalPedido,
                [S.ITEMS]: processedItems,
                [S.SHIPPING_COST]: Number(orderData[S.SHIPPING_COST] || 0),
                [S.CLIENT.ROOT]: {
                    [C.NAME]: orderData[C.ROOT]?.[C.NAME] || '',
                    [C.CITY]: orderData[C.ROOT]?.[C.CITY] || '',
                    [C.ADDRESS]: orderData[C.ROOT]?.[C.ADDRESS] || '',
                    [C.TEL]: orderData[C.ROOT]?.[C.TEL] || '',
                    [C.IS_ACOPIO]: orderData[C.ROOT]?.[C.IS_ACOPIO] || false
                },
                [S.ARCHIVED]: false,
                updatedAt: serverTimestamp()
            };

            if (orderData.id) {
                await updateDoc(doc(db, DB.ORDERS, orderData.id), firebaseOrder);
            } else {
                firebaseOrder.createdAt = serverTimestamp();
                await addDoc(collection(db, DB.ORDERS), firebaseOrder);
            }
            return true;
        } catch (error) {
            console.error("Error al guardar (Schema Strict):", error);
            return false;
        }
    };
    const updateOrderLogistics = async (orderId, logisticsData) => {
        try {
            const orderRef = doc(db, DB.ORDERS, orderId);

            // Si viene 'forceSplit', generamos un ID único que el Helper no pueda agrupar
            const finalGroupId = logisticsData.forceSplit
                ? `independent-acopio-${orderId}`
                : logisticsData.groupId;

            await updateDoc(orderRef, {
                'logistics.groupId': finalGroupId,
                'logistics.master_address': logisticsData.master_address || null,
                'logistics.status': logisticsData.status || 'pago-pendiente',
                updatedAt: serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error("Error en updateOrderLogistics:", error);
            throw error;
        }
    };

    return { saveOrder, updateOrderLogistics };
};