import React, { useState, useEffect } from 'react';
import { useData } from '../../../../../context/DataContext';
import { DB } from '../../../../../constants/collections';
import { db } from '../../../../../lib/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

import CoverageForm from './CoverageForm';
import CoverageTable from './CoverageTable';

const CoverageTab = () => {
    const { coverage } = useData();
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ codigo: '', ciudad: '', paqueteria: '', tarifa: '', isAcopio: false });

    useEffect(() => {
        if (form.ciudad.length >= 3 && !editingId && !form.codigo) {
            setForm(prev => ({ ...prev, codigo: form.ciudad.substring(0, 3).toUpperCase() }));
        }
    }, [form.ciudad, editingId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.ciudad) return;
        setIsSaving(true);
        const data = {
            codigo: form.codigo.toUpperCase().trim(),
            ciudad: form.ciudad.toUpperCase().trim(),
            paqueteria: form.paqueteria.toUpperCase().trim(),
            tarifa: Number(form.tarifa) || 0,
            isAcopio: form.isAcopio,
            updatedAt: new Date().toISOString()
        };
        try {
            if (editingId) { await updateDoc(doc(db, DB.COVERAGE, editingId), data); setEditingId(null); }
            else { await addDoc(collection(db, DB.COVERAGE), data); }
            setForm({ codigo: '', ciudad: '', paqueteria: '', tarifa: '', isAcopio: false });
        } catch (err) { console.error(err); } finally { setIsSaving(false); }
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setForm({ ...item, tarifa: item.tarifa || '' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="space-y-8 pb-20">
            <CoverageForm
                form={form} setForm={setForm}
                onSubmit={handleSubmit} isSaving={isSaving}
                editingId={editingId}
                onCancel={() => { setEditingId(null); setForm({ codigo: '', ciudad: '', paqueteria: '', tarifa: '', isAcopio: false }) }}
            />
            <CoverageTable data={coverage} onEdit={handleEdit} onDelete={async (id) => { if (confirm('¿BORRAR?')) await deleteDoc(doc(db, DB.COVERAGE, id)) }} />
        </div>
    );
};

export default CoverageTab;