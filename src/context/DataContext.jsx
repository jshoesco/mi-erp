import React, { createContext, useContext, useMemo } from 'react';
import useCollection from '../hooks/useCollection';
import { db } from '../lib/firebase';
import { doc, deleteDoc, getDoc } from 'firebase/firestore';
import SHA1 from 'crypto-js/sha1';

import { DB } from '../constants/collections'; // USAMOS ESTO

const DataContext = createContext();

export const DataProvider = ({ children }) => {
    // 1. LEER COLECCIONES USANDO EL DICCIONARIO
    const { data: orders, loading: loadingOrders } = useCollection(DB.ORDERS);
    const { data: products, loading: loadingProducts } = useCollection(DB.PRODUCTS);
    const { data: shipping, loading: loadingShipping } = useCollection(DB.SHIPPING);
    const { data: coverage, loading: loadingCoverage } = useCollection(DB.COVERAGE); // NUEVA
    const { data: providers } = useCollection(DB.PROVIDERS);
    const { data: finanzas } = useCollection(DB.FINANCES);
    const { data: quotes } = useCollection(DB.QUOTES);

    // CONFIGURACIONES
    const { data: financeConfigData } = useCollection(DB.CONFIG_FINANCE);
    const { data: anomalyConfigData } = useCollection(DB.CONFIG_ANOMALY);
    const { data: generalConfig } = useCollection(DB.CONFIG_GENERAL);
    const { data: lines } = useCollection(DB.CONFIG_LINES);
    const { data: remitenteData } = useCollection(DB.CONFIG_REMITENTE);

    const financeConfig = useMemo(() => financeConfigData[0] || { methods: [] }, [financeConfigData]);
    const cloudConfig = useMemo(() => generalConfig?.[0] || {}, [generalConfig]);

    const loading = loadingOrders || loadingProducts || loadingCoverage;

    // ... (Mantén tus funciones de Cloudinary igual por ahora) ...

    const deleteProduct = async (id) => {
        try {
            const docRef = doc(db, DB.PRODUCTS, id); // USA CONSTANTE
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && docSnap.data().imagen) {
                await destroyInCloudinary(docSnap.data().imagen);
            }
            await deleteDoc(docRef);
        } catch (error) { throw error; }
    };

    const value = {
        orders, products, shipping, coverage, providers, finanzas, quotes, lines,
        financeConfig, cloudConfig, anomalyConfigData, remitenteData,
        loading, deleteProduct,
        DB // Exportamos el diccionario para que los componentes lo usen
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => useContext(DataContext);