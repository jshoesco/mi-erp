import { useState, useEffect, useCallback, useRef } from 'react';
import { db, auth, doc, getDoc, setDoc, onAuthStateChanged } from '../lib/firebase';

export const useTableConfig = (initialConfig, data) => {
    const [columns, setColumns] = useState(initialConfig);
    const [availableKeys, setAvailableKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Usamos un Ref para evitar disparar efectos innecesarios por cambios en initialConfig
    const initialConfigRef = useRef(initialConfig);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const docRef = doc(db, "userPreferences", user.uid);
                    const docSnap = await getDoc(docRef);
                    
                    if (docSnap.exists()) {
                        const cloudData = docSnap.data().inventoryColumns;
                        // SOLO actualizamos si la data es distinta para romper el bucle
                        if (JSON.stringify(cloudData) !== JSON.stringify(columns)) {
                            setColumns(cloudData);
                        }
                    }
                } catch (error) {
                    console.error("Error Firebase:", error);
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []); // Array vacío: Solo se ejecuta al montar el componente

    useEffect(() => {
        if (data && data.length > 0) {
            const keys = Object.keys(data[0]).filter(k => k !== 'id');
            // Comparación simple para evitar re-renders infinitos de llaves disponibles
            if (JSON.stringify(keys) !== JSON.stringify(availableKeys)) {
                setAvailableKeys(keys);
            }
        }
    }, [data]);

    // useCallback es VITAL aquí para que el componente que use este hook no se vuelva loco
    const saveConfig = useCallback(async (newConfig) => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            const docRef = doc(db, "userPreferences", user.uid);
            await setDoc(docRef, { inventoryColumns: newConfig }, { merge: true });
            setColumns(newConfig);
        } catch (error) {
            console.error("Error al guardar:", error);
        }
    }, []);

    return { columns, setColumns: saveConfig, availableKeys, loading };
};