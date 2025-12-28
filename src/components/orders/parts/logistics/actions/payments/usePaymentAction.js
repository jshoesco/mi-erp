import { db } from '../../../../../../lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { DB } from '../../../../../../constants/collections';

export const usePaymentAction = (notify) => {
    const registerPayment = async (orderIds, paymentData) => {
        try {
            const promises = orderIds.map(id =>
                updateDoc(doc(db, DB.ORDERS, id), {
                    'logistics.status': 'por-despachar',
                    'logistics.payment': {
                        amount: paymentData.amount || 0,
                        method: paymentData.method || 'transferencia',
                        date: serverTimestamp(),
                        registeredBy: 'USER_CURRENT' // Luego vinculamos el auth
                    },
                    updatedAt: serverTimestamp()
                })
            );

            await Promise.all(promises);
            notify?.('Pago registrado. Pedidos movidos a Despacho.', 'success');
            return true;
        } catch (error) {
            console.error(error);
            notify?.('Error al registrar el pago', 'error');
            return false;
        }
    };

    return { registerPayment };
};