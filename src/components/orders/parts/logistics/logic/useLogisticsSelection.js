import { useState, useCallback } from 'react';
import { SCHEMA } from '../../../../../constants/schema';

export const useLogisticsSelection = () => {
    const [selectedOrders, setSelectedOrders] = useState([]);
    const S = SCHEMA.ORDERS;
    const C = S.CLIENT;

    const toggle = useCallback((order) => {
        setSelectedOrders(prev => {
            const exists = prev.find(o => o.id === order.id);
            if (exists) return prev.filter(o => o.id !== order.id);

            if (prev.length > 0) {
                const first = prev[0];

                // TRIPLE VALIDACIÓN ESTRICTA
                const mismoProveedor = order[S.ITEMS]?.[0]?.[S.ITEM.PROVIDER] === first[S.ITEMS]?.[0]?.[S.ITEM.PROVIDER];
                const mismaCiudad = order[C.ROOT]?.[C.CITY] === first[C.ROOT]?.[C.CITY];
                const mismoTipoEnvio = order[S.STRATEGY]?.toUpperCase() === first[S.STRATEGY]?.toUpperCase();

                if (!mismoProveedor || !mismaCiudad || !mismoTipoEnvio) {
                    alert("Incompatible: Los pedidos deben coincidir en PROVEEDOR, CIUDAD y TIPO DE ENVÍO (Acopio o Directo).");
                    return prev;
                }
            }
            return [...prev, order];
        });
    }, [S, C]);

    const isCompatible = useCallback((order) => {
        if (!order) return false;
        if (selectedOrders.length === 0) return true;

        const first = selectedOrders[0];

        // Triple check para la interfaz visual
        return (
            order[S.ITEMS]?.[0]?.[S.ITEM.PROVIDER] === first[S.ITEMS]?.[0]?.[S.ITEM.PROVIDER] &&
            order[C.ROOT]?.[C.CITY] === first[C.ROOT]?.[C.CITY] &&
            order[S.STRATEGY]?.toUpperCase() === first[S.STRATEGY]?.toUpperCase()
        );
    }, [selectedOrders, S, C]);

    const clear = useCallback(() => setSelectedOrders([]), []);

    return { selectedOrders, toggle, isCompatible, clear };
};