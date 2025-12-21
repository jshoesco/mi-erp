import { useState } from 'react';
import { db, collection, addDoc, updateDoc, doc, deleteDoc } from '../../../lib/firebase';
import useCollection from '../../../hooks/useCollection';
import { useSelection } from '../../../hooks/useSelection';
import { useUI } from '../../../context/UIContext';
import { useTableConfig } from '../../../hooks/useTableConfig';

export const useInventory = () => {
    const { data, loading } = useCollection('productos');
    const { notify, confirmAction } = useUI();
    const [showArchived, setShowArchived] = useState(false);
    const [modals, setModals] = useState({ product: { open: false, data: null }, columns: { open: false } });

    const products = data?.filter(p => showArchived ? p.archivado : !p.archivado) || [];
    
    const { columns, setColumns, availableKeys, reorderColumns } = useTableConfig([
        { id: '1', label: 'PRODUCTO', key: 'nombre', visible: true },
        { id: '2', label: 'PRECIO', key: 'precio', visible: true }
    ], products);

    const { selectedIds, toggleSelect, toggleAll, clearSelection } = useSelection(products);

    const ui = {
        openProduct: (data = null) => setModals(prev => ({ ...prev, product: { open: true, data } })),
        closeProduct: () => setModals(prev => ({ ...prev, product: { open: false, data: null } })),
        openColumns: () => setModals(prev => ({ ...prev, columns: { open: true } })),
        closeColumns: () => setModals(prev => ({ ...prev, columns: { open: false } }))
    };

    const handleSave = async (formData) => {
        try {
            const { id, ...payload } = formData;
            if (id) {
                await updateDoc(doc(db, 'productos', id), { ...payload, updated_at: new Date().toISOString() });
            } else {
                await addDoc(collection(db, 'productos'), { ...payload, created_at: new Date().toISOString() });
            }
            ui.closeProduct();
            notify("Guardado");
        } catch (e) { notify("Error", "error"); }
    };

    const handleBulkAction = (action) => {
        confirmAction({
            title: "ACCIÓN MASIVA",
            message: `¿Deseas procesar ${selectedIds.length} ítems?`,
            onConfirm: async () => {
                const batch = selectedIds.map(id => {
                    if (action === 'delete') return deleteDoc(doc(db, 'productos', id));
                    return updateDoc(doc(db, 'productos', id), { archivado: action === 'archive' });
                });
                await Promise.all(batch);
                clearSelection();
                notify("Procesado con éxito");
            }
        });
    };

    const inventoryActions = [
        { label: showArchived ? 'RESTAURAR' : 'ARCHIVAR', onClick: () => handleBulkAction(showArchived ? 'restore' : 'archive'), variant: 'secondary' },
        { label: 'ELIMINAR', onClick: () => handleBulkAction('delete'), variant: 'danger' }
    ];

    return { 
        products, loading, modals, ui, handleSave, selectedIds, toggleSelect, toggleAll, 
        clearSelection, showArchived, setShowArchived, inventoryActions,
        columns, setColumns, availableKeys, reorderColumns 
    };
};