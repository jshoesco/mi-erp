import { useMemo } from 'react';
import { SCHEMA } from '../../../../../../../constants/schema';

export const useOrderProfit = (formData) => {
    const S = SCHEMA.ORDERS;
    const I = S.ITEM;

    return useMemo(() => {
        const items = formData?.[S.ITEMS] || [];

        // Extraemos fletes usando SCHEMA
        const costoEnvioEmpresa = Number(formData?.[S.SHIPPING_COST] || 0);
        const envioCobradoCliente = Number(formData?.[S.PAYMENT_CLIENT] || 0); // O la llave que definas para el pago extra

        // Ingresos por productos
        const subtotalVenta = items.reduce((acc, item) => {
            return acc + (Number(item[I.QTY] || 0) * Number(item[I.PRICE] || 0));
        }, 0);

        // Costos de productos
        const costoTotalMercancia = items.reduce((acc, item) => {
            return acc + (Number(item[I.QTY] || 0) * Number(item[I.COST] || 0));
        }, 0);

        const totalIngresos = subtotalVenta + envioCobradoCliente;
        const totalCostos = costoTotalMercancia + costoEnvioEmpresa;
        const profit = totalIngresos - totalCostos;
        const margen = totalIngresos > 0 ? (profit / totalIngresos) * 100 : 0;

        return {
            totalIngresos,
            totalCostos,
            profit,
            margen,
            esNegativo: profit < 0,
            hasItems: items.length > 0
        };
    }, [formData, S, I]);
};