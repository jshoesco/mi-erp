import React, { createContext, useContext } from 'react';
import useCollection from '../hooks/useCollection';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
    // Aquí cargamos TODOS los datos una sola vez
    const { data: orders, loading: loadingOrders } = useCollection('pedidos');
    const { data: products, loading: loadingProducts } = useCollection('productos');
    const { data: shipping } = useCollection('tarifas_envios');
    const { data: providers } = useCollection('proveedores');
    const { data: finanzas, loading: loadingFinanzas } = useCollection('finanzas');
    
    // Configuraciones
    const { data: financeConfigData } = useCollection('config_finanzas');
    const { data: anomalyConfigData } = useCollection('config_novedades');
    const { data: generalConfig } = useCollection('config_general');
    const { data: lines } = useCollection('config_lineas');

    // Preparamos datos útiles para que estén listos
    const financeConfig = financeConfigData[0] || { methods: [] };
    const cloudConfig = generalConfig[0] || {};
    
    const loading = loadingOrders || loadingProducts || loadingFinanzas;

    // Empaquetamos todo para enviarlo a las vistas
    const value = {
        orders,
        products,
        shipping,
        providers,
        finanzas,
        lines,
        financeConfig,
        cloudConfig,
        anomalyConfigData,
        loading
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

// Este es el gancho que usaremos en las vistas para pedir los datos
export const useData = () => useContext(DataContext);   