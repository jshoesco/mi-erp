import { db } from '../../../../../../lib/firebase';
import { doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { DB } from '../../../../../../constants/collections';
import { SCHEMA } from '../../../../../../constants/schema';

export const useShippingAction = (notify) => {
    const registerShipping = async (shippingData) => {
        const batch = writeBatch(db);
        const S = SCHEMA.ORDERS;

        try {
            shippingData.orders.forEach(order => {
                const orderRef = doc(db, DB.ORDERS, order.id);
                batch.update(orderRef, {
                    'logistics.status': 'enviado',
                    'logistics.guide_number': shippingData.guideNumber,
                    'logistics.carrier': shippingData.carrier,
                    [S.STATUS]: 'Enviado',
                    updatedAt: serverTimestamp()
                });
            });
            await batch.commit();
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    };
    return { registerShipping };
};