/**
 * Calcula la deuda pendiente con el proveedor para un ítem específico.
 * Lógica: (Costo Producto + Envío Asignado) - Pagos realizados
 */
export const calculateItemDebt = (item) => {
    const costo = Number(item.costo) || 0;
    const envio = Number(item.costo_envio_asignado) || 0;
    const pagado = Number(item.pago_proveedor) || 0;

    return Math.max(0, (costo + envio) - pagado);
};