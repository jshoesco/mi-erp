import { useState } from 'react';
import { db, collection, addDoc, updateDoc, doc, deleteDoc } from '../../../lib/firebase';
import useCollection from '../../../hooks/useCollection';

export const useInventory = () => {
    const { data, loading } = useCollection('productos');
    const products = data || [];
    const [selectedIds, setSelectedIds] = useState([]);
    const [modals, setModals] = useState({ product: { open: false, data: null } });

    const ui = {
        openProduct: (data = null) => setModals({ product: { open: true, data } }),
        closeProduct: () => setModals({ product: { open: false, data: null } }),
        toggleSelect: (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]),
        toggleSelectAll: (all) => setSelectedIds(selectedIds.length === all.length ? [] : all.map(p => p.id))
    };

    const handleSave = async (formData) => {
        try {
            const { id, ...payload } = formData;
            if (id) await updateDoc(doc(db, 'productos', id), { ...payload, updated_at: new Date().toISOString() });
            else await addDoc(collection(db, 'productos'), { ...payload, created_at: new Date().toISOString() });
            ui.closeProduct();
        } catch (e) { console.error("Error Firebase:", e); }
    };

    const columns = [
        { id: 'img', header: 'Foto', field: 'imagen' },
        { id: 'prod', header: 'Producto', field: 'nombre' },
        { id: 'price', header: 'Precio', field: 'precio' },
        { id: 'stock', header: 'Stock', field: 'stock_actual' }
    ];

    return { products, loading, modals, ui, columns, selectedIds, handleSave };
};