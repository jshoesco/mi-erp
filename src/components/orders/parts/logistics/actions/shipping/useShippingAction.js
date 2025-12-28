import { db } from '../../../../../../lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { DB } from '../../../../../../constants/collections';

export const useShippingAction = (notify) => {
    const assignGuide = async (orderIds, shippingData) => {
        try {
            const promises = orderIds.map(id =>
                updateDoc(doc(db, DB.ORDERS, id), {
                    'logistics.status': 'enviado',
                    'logistics.shipping': {
                        carrier: shippingData.carrier,
                        guideNumber: shippingData.guideNumber,
                        shippedAt: serverTimestamp(),
                    },
                    // Actualizamos también el campo legacy si lo usas en otras partes
                    'envio.guia': shippingData.guideNumber,
                    updatedAt: serverTimestamp()
                })
            );

            await Promise.all(promises);
            notify?.('Guía asignada. Pedidos movidos a "Enviados".', 'success');
            return true;
        } catch (error) {
            console.error(error);
            notify?.('Error al asignar guía', 'error');
            return false;
        }
    };

    return { assignGuide };
};