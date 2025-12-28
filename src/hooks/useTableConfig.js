import { useState, useEffect, useMemo } from 'react';
import { db, doc, setDoc } from '../lib/firebase';
import { useUI } from '../context/UIContext';

export const useTableConfig = ({ masterColumns, data, remoteColumns, dbParams }) => {
    const { notify } = useUI();
    const [columns, setColumns] = useState(masterColumns);

    // LÓGICA CENTRALIZADA: Generación dinámica de llaves
    const availableKeys = useMemo(() => {
        if (!data || data.length === 0) return masterColumns;

        const dataKeys = Object.keys(data[0]);
        const allKeys = new Set([...masterColumns.map(c => c.key), ...dataKeys]);

        return Array.from(allKeys).map(key => {
            const master = masterColumns.find(c => c.key === key);
            return {
                key,
                label: master ? master.label : key.toUpperCase().replace(/_/g, ' ')
            };
        });
    }, [data, masterColumns]);

    // Sincronización con Firebase
    useEffect(() => {
        if (remoteColumns && remoteColumns.length > 0) {
            setColumns(remoteColumns);
        } else {
            setColumns(masterColumns);
        }
    }, [remoteColumns]);

    // Función de guardado genérica
    const saveConfig = async (newColumns) => {
        try {
            if (!dbParams?.collection || !dbParams?.id) return false;

            const docRef = doc(db, dbParams.collection, dbParams.id);
            await setDoc(docRef, { columns: newColumns }, { merge: true });

            setColumns(newColumns);
            notify("Configuración guardada");
            return true;
        } catch (e) {
            console.error("Error al guardar:", e);
            notify("Error al guardar configuración", "error");
            return false;
        }
    };

    return {
        columns,
        setColumns,
        availableKeys,
        saveConfig
    };
};