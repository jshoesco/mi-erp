import { db } from '../../../../../../lib/firebase';
import { collection, doc, writeBatch, serverTimestamp, increment } from 'firebase/firestore';
import { DB } from '../../../../../../constants/collections';
import { SCHEMA } from '../../../../../../constants/schema';

export const usePaymentAction = (notify) => {
    const registerPayments = async (paymentData) => {
        const batch = writeBatch(db);
        const F = SCHEMA.FINANCES;
        const L = SCHEMA.LOGISTICS;

        try {
            const financeRef = doc(collection(db, DB.FINANCES));

            // EL REGISTRO QUE SÍ SIRVE PARA CONTABILIDAD
            batch.set(financeRef, {
                [F.FLOW]: 'SALIDA',
                [F.CATEGORY]: 'PAGO_PROVEEDOR',
                [F.AMOUNT]: paymentData.totalAmount,
                [F.METHOD]: paymentData.method,
                [F.DATE]: serverTimestamp(),
                [F.ORDER_ID]: paymentData.orders.map(o => o.id), // Array de IDs de pedidos
                [F.GROUP_ID]: paymentData.groupId || null,
                reference_id: paymentData.referenceId || null,
                evidence_url: paymentData.evidenceUrl || null,
                description: `Pago a proveedor por ${paymentData.orders.length} pedidos unificados.`,
                createdAt: serverTimestamp()
            });

            // ACTUALIZACIÓN DE ESTADOS
            paymentData.orders.forEach(order => {
                const orderRef = doc(db, DB.ORDERS, order.id);

                // Calculamos si TODO EL GRUPO sumado queda pagado
                const totalDeudaGrupo = paymentData.orders.reduce((acc, o) =>
                    acc + (o.totalCost - (o.alreadyPaid || 0)), 0);

                const montoTotalPagadoAhora = paymentData.totalAmount;

                // REGLA: ¿El pago actual cubre el 100% de lo que debe el lote?
                const grupoPagadoCompletamente = montoTotalPagadoAhora >= totalDeudaGrupo;

                batch.update(orderRef, {
                    'logistics.pago_acumulado': increment(order.payingNow),
                    // Si el grupo no está pago completo, NADIE se mueve de status
                    'logistics.status': grupoPagadoCompletamente ? SCHEMA.LOGISTICS.STATUS.READY : SCHEMA.LOGISTICS.STATUS.PENDING,
                    updatedAt: serverTimestamp()
                });
            });

            await batch.commit();
            notify?.('Pago registrado y pedidos actualizados', 'success');
            return true;
        } catch (error) {
            console.error("Error en pago:", error);
            notify?.('Error al procesar el pago', 'error');
            return false;
        }
    };
    return { registerPayments };
};