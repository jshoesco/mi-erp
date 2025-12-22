import { useState, useMemo } from 'react';
import { db, collection, addDoc, updateDoc, doc, deleteDoc } from '../../../lib/firebase';
import useCollection from '../../../hooks/useCollection';
import { useSelection } from '../../../hooks/useSelection';
import { useUI } from '../../../context/UIContext';
import { useTableConfig } from '../../../hooks/useTableConfig';

export const useInventory = () => {
    // 1. Sincronización real con Firebase (3 colecciones)
    const { data: rawProducts, loading } = useCollection('productos');
    const { data: providers = [] } = useCollection('proveedores');
    const { data: lines = [] } = useCollection('config_lineas');

    const { notify, confirmAction } = useUI();
    const [showArchived, setShowArchived] = useState(false);
    const [modals, setModals] = useState({ product: { open: false, data: null }, columns: { open: false } });

    // Filtro de productos
    const products = useMemo(() =>
        rawProducts?.filter(p => showArchived ? p.archivado : !p.archivado) || []
        , [rawProducts, showArchived]);

    // 2. Configuración Maestra de Columnas (Recuperando Etiquetas)
    const masterColumns = [
        { key: 'sku', label: 'SKU', visible: true },
        { key: 'nombre', label: 'PRODUCTO', visible: true },
        { key: 'precio', label: 'PRECIO', visible: true },
        { key: 'existencias', label: 'STOCK', visible: true },
        { key: 'proveedor', label: 'PROVEEDOR', visible: true },
        { key: 'linea', label: 'LÍNEA', visible: false },
        { key: 'costo', label: 'COSTO', visible: false }
    ];

    const { columns, setColumns, availableKeys, reorderColumns } = useTableConfig(masterColumns, products);
    const { selectedIds, toggleSelect, toggleAll, clearSelection } = useSelection(products);

    const ui = {
        openProduct: (data = null) => setModals(m => ({ ...m, product: { open: true, data } })),
        closeProduct: () => setModals(m => ({ ...m, product: { open: false, data: null } })),
        openColumns: () => setModals(m => ({ ...m, columns: { open: true } })),
        closeColumns: () => setModals(m => ({ ...m, columns: { open: false } }))
    };

    const handleSave = async (formData) => {
        try {
            const { id, ...payload } = formData;
            if (id) {
                await updateDoc(doc(db, 'productos', id), { ...payload, updated_at: new Date().toISOString() });
            } else {
                await addDoc(collection(db, 'productos'), { ...payload, created_at: new Date().toISOString(), archivado: false });
            }
            ui.closeProduct();
            notify("Guardado con éxito");
        } catch (e) { notify(e.message, "error"); }
    };

    return {
        products, loading, modals, ui, handleSave, selectedIds, toggleSelect, toggleAll,
        clearSelection, showArchived, setShowArchived,
        columns: columns || masterColumns,
        setColumns,
        availableKeys: masterColumns, // Forzamos la etiqueta manual para evitar "Columna 1, 2..."
        reorderColumns,
        providers,
        lines,
        notify
    };
};