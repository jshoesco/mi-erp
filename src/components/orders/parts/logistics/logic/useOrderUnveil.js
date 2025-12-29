import { SCHEMA } from '../../../../../constants/schema';
import { useOrdersActions } from '../../../logic/useOrdersActions';

export const useOrderUnveil = (notify) => {
    const { updateOrderLogistics } = useOrdersActions();
    const L = SCHEMA.LOGISTICS;
    const S = SCHEMA.ORDERS;

    const unveilOrder = async (order) => {
        if (!window.confirm('¿Desvincular este pedido del lote?')) return;

        // Lógica de negocio encapsulada: El estado depende del pago previo
        const pagoAcumulado = order.logistics?.pago_acumulado || 0;
        const costoTotal = order[S.TOTAL] || 0;
        const yaEstaPagado = pagoAcumulado >= costoTotal;

        try {
            await updateOrderLogistics(order.id, {
                groupId: null,
                status: yaEstaPagado ? L.STATUS.READY : L.STATUS.PENDING,
                master_address: null
            });
            notify?.('Pedido liberado con éxito', 'success');
            return true;
        } catch (error) {
            notify?.('Error al liberar pedido', 'error');
            return false;
        }
    };

    const unveilGroup = async (group) => {
        const strategy = group.orders?.[0]?.[S.STRATEGY]?.toUpperCase() || 'PEDIDO';
        if (!window.confirm(`¿Separar estos pedidos? Se mantendrán como ${strategy}.`)) return;

        try {
            await Promise.all(group.orders.map(o => {
                const yaPagado = (o.logistics?.pago_acumulado || 0) >= (o[S.TOTAL] || 0);
                return updateOrderLogistics(o.id, {
                    groupId: null,
                    forceSplit: true,
                    status: yaPagado ? L.STATUS.READY : L.STATUS.PENDING
                });
            }));
            notify?.('Lote disuelto correctamente', 'success');
            return true;
        } catch (error) {
            notify?.('Error al disolver lote', 'error');
            return false;
        }
    };

    return { unveilOrder, unveilGroup };
};