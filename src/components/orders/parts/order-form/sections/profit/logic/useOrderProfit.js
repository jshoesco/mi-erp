import { useMemo } from 'react';
import { SCHEMA } from '../../../../../../../constants/schema';

export const useOrderProfit = (formData) => {
    const S = SCHEMA.ORDERS;
    const I = S.ITEM;

    const totals = useMemo(() => {
        // 1. Extraemos usando estrictamente el SCHEMA
        const items = formData?.[S.ITEMS] || [];
        const envio = Number(formData?.[S.SHIPPING_COST] || 0);

        // 2. Ingresos Brutos (Venta Total) basado en SCHEMA
        const subtotal = items.reduce((acc, item) => {
            const qty = Math.max(0, Number(item[I.QTY] || 0));
            const price = Number(item[I.PRICE] || 0);
            return acc + (qty * price);
        }, 0);

        // 3. Costos de Mercancía (COGS) basado en SCHEMA
        const costoTotal = items.reduce((acc, item) => {
            const qty = Math.max(0, Number(item[I.QTY] || 0));
            const cost = Number(item[I.COST] || 0);
            return acc + (qty * cost);
        }, 0);

        // 4. Utilidad Real (Venta - Costos - Envío)
        const profit = subtotal - costoTotal - envio;

        // 5. Margen en %
        const margen = subtotal > 0 ? (profit / subtotal) * 100 : 0;

        return {
            subtotal,
            envio,
            costoTotal,
            profit,
            margen,
            total: subtotal 
        };
    }, [formData?.[S.ITEMS], formData?.[S.SHIPPING_COST], S, I]);

    return totals;
};