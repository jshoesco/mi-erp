import { useState, useCallback } from 'react';

export const useLogisticsSelection = () => {
    const [selectedOrders, setSelectedOrders] = useState([]);

    const toggle = useCallback((order) => {
        setSelectedOrders(prev => {
            const exists = prev.find(o => o.id === order.id);
            if (exists) return prev.filter(o => o.id !== order.id);

            if (prev.length > 0) {
                const first = prev[0];
                const isCompatible =
                    order.items?.[0]?.provider === first.items?.[0]?.provider &&
                    order.cliente?.ciudad === first.cliente?.ciudad &&
                    order.envio?.tipo?.toUpperCase() === 'DIRECTO';

                if (!isCompatible) {
                    alert("Solo puedes vincular pedidos DIRECTOS con misma CIUDAD y PROVEEDOR.");
                    return prev;
                }
            }
            return [...prev, order];
        });
    }, []);

    const isCompatible = useCallback((order) => {
        if (!order) return false;
        if (selectedOrders.length === 0) return order.envio?.tipo?.toUpperCase() === 'DIRECTO';
        const first = selectedOrders[0];
        return order.items?.[0]?.provider === first.items?.[0]?.provider &&
            order.cliente?.ciudad === first.cliente?.ciudad &&
            order.envio?.tipo?.toUpperCase() === 'DIRECTO';
    }, [selectedOrders]);

    const clear = useCallback(() => setSelectedOrders([]), []);

    return { selectedOrders, toggle, isCompatible, clear };
};