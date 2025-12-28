import { useMemo } from 'react';

export const useOrderProfit = (formData) => {
    const totals = useMemo(() => {
        const items = formData?.items || [];
        const envio = Number(formData?.envio_precio || 0);

        // 1. Ingresos Brutos (Venta Total)
        // Usamos Math.max(0, ...) para evitar que cantidades negativas rompan el sistema
        const subtotal = items.reduce((acc, item) => {
            const qty = Math.max(0, Number(item.cantidad || 0));
            const price = Number(item.precio || 0);
            return acc + (qty * price);
        }, 0);

        // 2. Costos de Mercancía (COGS)
        const costoTotal = items.reduce((acc, item) => {
            const qty = Math.max(0, Number(item.cantidad || 0));
            const cost = Number(item.costo || 0);
            return acc + (qty * cost);
        }, 0);

        // 3. Utilidad Real (Venta - Costos - Envío)
        const profit = subtotal - costoTotal - envio;

        // 4. Margen en %
        // Si el subtotal es 0 o negativo, el margen es 0 para evitar errores matemáticos
        const margen = subtotal > 0 ? (profit / subtotal) * 100 : 0;

        return {
            subtotal,
            envio,
            costoTotal,
            profit,
            margen,
            total: subtotal // Este es el valor que el cliente debe pagar
        };
    }, [formData?.items, formData?.envio_precio]);

    return totals;
};