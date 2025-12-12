import React, { createContext, useContext } from 'react';
import useCollection from '../hooks/useCollection';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
    const { data: orders, loading: loadingOrders } = useCollection('pedidos');
    const { data: products, loading: loadingProducts } = useCollection('productos');
    const { data: shipping, loading: loadingShipping } = useCollection('tarifas_envios');
    const { data: providers, loading: loadingProviders } = useCollection('proveedores');
    const { data: finanzas, loading: loadingFinanzas } = useCollection('finanzas');
    
    // NUEVO: Agregamos la colección de cotizaciones
    const { data: quotes, loading: loadingQuotes } = useCollection('cotizaciones');

    const { data: financeConfigData } = useCollection('config_finanzas');
    const { data: anomalyConfigData } = useCollection('config_novedades');
    const { data: generalConfig } = useCollection('config_general');
    const { data: lines } = useCollection('config_lineas');

    const financeConfig = financeConfigData[0] || { methods: [] };
    const cloudConfig = generalConfig?.[0] || {};
    
    // Agregamos loadingQuotes al loading global
    const loading = loadingOrders || loadingProducts || loadingFinanzas || loadingQuotes;

    const value = {
        orders,
        products,
        shipping,
        providers,
        finanzas,
        quotes, // <--- EXPORTAMOS AQUÍ
        lines,
        financeConfig,
        cloudConfig,
        anomalyConfigData,
        loading
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => useContext(DataContext);