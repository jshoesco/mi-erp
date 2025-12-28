import { useState, useMemo } from 'react';
import {
    db,
    collection,
    addDoc,
    updateDoc,
    doc,
    writeBatch,
    serverTimestamp
} from '../../../lib/firebase';
import useCollection from '../../../hooks/useCollection';
import { useSelection } from '../../../hooks/useSelection';
import { useUI } from '../../../context/UIContext';
import { useTableConfig } from '../../../hooks/useTableConfig';

export const useInventory = () => {
    const { notify } = useUI();

    // 1. LEER EL MAPEO DINÁMICO
    const { data: generalConfig } = useCollection('config_general');

    const mapping = useMemo(() => generalConfig?.[0]?.mapping || {
        coll_products: 'productos',
        coll_providers: 'proveedores',
        coll_lines: 'config_lineas'
    }, [generalConfig]);

    // 2. CONEXIONES DINÁMICAS (Nombres de variables sincronizados con la Vista)
    const { data: rawProducts, loading: loadingProducts } = useCollection(mapping.coll_products);
    const { data: proveedores } = useCollection(mapping.coll_providers);
    const { data: lineas } = useCollection(mapping.coll_lines);

    const [showArchived, setShowArchived] = useState(false);
    const [modals, setModals] = useState({
        product: { open: false, data: null },
        columns: { open: false }
    });

    const masterColumns = [
        { key: 'imagen', label: 'IMG', visible: true },
        { key: 'sku', label: 'SKU', visible: true },
        { key: 'nombre', label: 'PRODUCTO', visible: true },
        { key: 'precio', label: 'PRECIO', visible: true },
        { key: 'existencias', label: 'STOCK', visible: true },
        { key: 'proveedor_nombre', label: 'PROVEEDOR', visible: true }
    ];

    const products = useMemo(() =>
        rawProducts?.filter(p => showArchived ? p.archivado === true : !p.archivado) || []
        , [rawProducts, showArchived]);

    const { columns, setColumns, availableKeys, saveConfig } = useTableConfig({
        masterColumns,
        data: products,
        dbParams: { collection: 'config_tablas', id: 'inventario' }
    });

    const { selectedIds, toggleSelect, toggleAll, clearSelection } = useSelection(products);

    const handleSave = async (formData) => {
        try {
            const cleanData = {
                ...formData,
                nombre: formData.nombre?.toUpperCase().trim(),
                precio: Number(formData.precio || 0),
                updatedAt: serverTimestamp()
            };

            if (formData.id) {
                await updateDoc(doc(db, mapping.coll_products, formData.id), cleanData);
                notify("Producto actualizado");
            } else {
                cleanData.createdAt = serverTimestamp();
                cleanData.archivado = false;
                await addDoc(collection(db, mapping.coll_products), cleanData);
                notify("Producto creado con éxito");
            }
            return true;
        } catch (error) {
            notify("Error al procesar", "error");
            return false;
        }
    };

    const handleBatchAction = async (action) => {
        if (!selectedIds.length || !window.confirm(`¿Ejecutar ${action}?`)) return;
        const batch = writeBatch(db);
        selectedIds.forEach(id => {
            const ref = doc(db, mapping.coll_products, id);
            if (action === 'delete') batch.delete(ref);
            else batch.update(ref, { archivado: !showArchived });
        });
        await batch.commit();
        clearSelection();
        notify("Operación masiva exitosa");
    };

    return {
        products,
        loading: loadingProducts,
        modals,
        selectedIds,
        showArchived,
        columns,
        availableKeys,
        proveedores, // Los proveedores con sus arrays de lineas
        lineas,      // Las lineas maestras de config_lineas
        mapping,
        setShowArchived,
        toggleSelect,
        toggleAll,
        clearSelection,
        handleBatchAction,
        handleSave,
        setColumns,
        saveConfig,
        ui: {
            openProduct: (data = null) => setModals(m => ({ ...m, product: { open: true, data } })),
            closeProduct: () => setModals(m => ({ ...m, product: { open: false, data: null } })),
            openColumns: () => setModals(m => ({ ...m, columns: { open: true } })),
            closeColumns: () => setModals(m => ({ ...m, columns: { open: false } }))
        }
    };
};