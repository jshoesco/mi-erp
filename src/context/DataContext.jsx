import React, { createContext, useContext } from 'react';
import useCollection from '../hooks/useCollection';
import { db } from '../lib/firebase'; 
import { doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore'; 
import SHA1 from 'crypto-js/sha1'; // Necesitas npm install crypto-js

const DataContext = createContext();

export const DataProvider = ({ children }) => {
    // 1. LEER TODAS LAS COLECCIONES
    const { data: orders, loading: loadingOrders } = useCollection('pedidos');
    const { data: products, loading: loadingProducts } = useCollection('productos');
    const { data: shipping, loading: loadingShipping } = useCollection('tarifas_envios');
    const { data: providers, loading: loadingProviders } = useCollection('proveedores');
    const { data: finanzas, loading: loadingFinanzas } = useCollection('finanzas');
    const { data: quotes, loading: loadingQuotes } = useCollection('cotizaciones');

    // Configs
    const { data: financeConfigData } = useCollection('config_finanzas');
    const { data: anomalyConfigData } = useCollection('config_novedades');
    const { data: generalConfig } = useCollection('config_general'); // <--- AQUÍ ESTÁN TUS CLAVES
    const { data: lines } = useCollection('config_lineas');
    const { data: remitenteData } = useCollection('config_remitente');

    const financeConfig = financeConfigData[0] || { methods: [] };
    const cloudConfig = generalConfig?.[0] || {}; // Objeto con cloud_name, api_key, api_secret
    
    const loading = loadingOrders || loadingProducts || loadingFinanzas || loadingQuotes;

    // --- HELPER: EXTRAER ID DE LA IMAGEN ---
    const getPublicIdFromUrl = (url) => {
        try {
            if (!url.includes('cloudinary')) return null;
            // Ejs: .../upload/v1234/folder/zapato.jpg -> folder/zapato
            // .../upload/v1234/zapato.jpg -> zapato
            const splitUrl = url.split('/');
            const lastSegment = splitUrl.pop(); // zapato.jpg
            const filename = lastSegment.split('.')[0]; // zapato
            const folderOrVersion = splitUrl.pop(); // v1234 o folder

            // Si el segmento anterior NO es una versión (v...), es una carpeta
            if (!folderOrVersion.startsWith('v')) {
                return `${folderOrVersion}/${filename}`;
            }
            return filename;
        } catch (e) {
            console.error("Error ID imagen:", e);
            return null;
        }
    };

    // --- HELPER: BORRAR EN CLOUDINARY (USANDO TUS CONFIGS) ---
    const destroyInCloudinary = async (imageUrl) => {
        // Validamos que tengamos las credenciales cargadas
        if (!cloudConfig.cloud_name || !cloudConfig.api_key || !cloudConfig.api_secret) {
            console.warn("Faltan credenciales de Cloudinary en Configuración General");
            return;
        }

        const publicId = getPublicIdFromUrl(imageUrl);
        if (!publicId) return;

        const timestamp = new Date().getTime();
        // FIRMA: public_id + timestamp + API_SECRET
        const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${cloudConfig.api_secret}`;
        const signature = SHA1(stringToSign).toString();

        const formData = new FormData();
        formData.append("public_id", publicId);
        formData.append("api_key", cloudConfig.api_key);
        formData.append("timestamp", timestamp);
        formData.append("signature", signature);

        try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudConfig.cloud_name}/image/destroy`, {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            console.log("Cloudinary destroy:", data);
        } catch (error) {
            console.error("Error borrando imagen nube:", error);
        }
    };

    // --- CRUD DE PRODUCTOS ---

    const updateProduct = async (id, newData) => {
        try {
            await updateDoc(doc(db, 'productos', id), newData);
        } catch (error) {
            console.error("Error update:", error);
            throw error;
        }
    };

    const deleteProduct = async (id) => {
        try {
            // 1. Obtener datos antes de borrar para ver si tiene imagen
            const docRef = doc(db, 'productos', id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const productData = docSnap.data();
                // 2. Si hay imagen, intentar borrarla de la nube
                if (productData.imagen) {
                    await destroyInCloudinary(productData.imagen);
                }
            }

            // 3. Borrar de Firebase
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Error delete:", error);
            throw error;
        }
    };

    const value = {
        orders,
        products,
        shipping,
        providers,
        finanzas,
        quotes,
        lines,
        financeConfig,
        cloudConfig, // Exportamos la config por si acaso
        anomalyConfigData,
        remitenteData,
        loading,
        updateProduct,
        deleteProduct
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => useContext(DataContext);