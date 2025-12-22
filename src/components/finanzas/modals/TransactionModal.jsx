import React, { useState, useEffect } from 'react';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import { Input, NumberInput } from '../../ui/Input';
import { Select } from '../../ui/Select';
import Dropzone from '../../ui/Dropzone';
import { db } from '../../../lib/firebase';
import { doc, addDoc, updateDoc, collection } from 'firebase/firestore';

const TransactionModal = ({ isOpen, onClose, editingItem, finConfig, notify }) => {
    const [form, setForm] = useState({
        tipo: 'GASTO',
        monto: '',
        categoria: '',
        metodo: '',
        descripcion: '',
        imagen: '',
        fecha: new Date().toISOString().slice(0, 10)
    });

    useEffect(() => {
        if (isOpen) {
            setForm(editingItem ? {
                ...editingItem,
                fecha: editingItem.fecha?.toDate ? editingItem.fecha.toDate().toISOString().slice(0, 10) : editingItem.fecha
            } : {
                tipo: 'GASTO', monto: '', categoria: '', metodo: '', descripcion: '', imagen: '',
                fecha: new Date().toISOString().slice(0, 10)
            });
        }
    }, [isOpen, editingItem]);

    const handleSave = async () => {
        if (!form.monto || !form.categoria || !form.metodo) return notify("Faltan campos", "error");
        try {
            const payload = {
                ...form,
                monto: Number(form.monto),
                fecha: new Date(form.fecha)
            };
            editingItem
                ? await updateDoc(doc(db, 'finanzas', editingItem.id), payload)
                : await addDoc(collection(db, 'finanzas'), payload);
            notify("Operación guardada");
            onClose();
        } catch (e) { notify(e.message, "error"); }
    };

    const categories = form.tipo === 'INGRESO' ? (finConfig?.ingresos || []) : (finConfig?.gastos || []);
    const methods = finConfig?.methods?.map(m => m.name) || [];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editingItem ? "EDITAR MOVIMIENTO" : "NUEVO MOVIMIENTO"}>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
                    {['INGRESO', 'GASTO'].map(t => (
                        <button key={t} onClick={() => setForm({ ...form, tipo: t, categoria: '' })}
                            className={`py-2 text-[10px] font-black rounded-lg transition-all ${form.tipo === t ? 'bg-white shadow text-brand-dark' : 'text-gray-400'}`}>
                            {t}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <NumberInput label="Monto ($)" value={form.monto} onChange={e => setForm({ ...form, monto: e.target.value })} />
                    <Select label="Categoría" options={categories} value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Select label="Método de Pago" options={methods} value={form.metodo} onChange={e => setForm({ ...form, metodo: e.target.value })} />
                    <Input label="Fecha" type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} />
                </div>

                <Input label="Descripción / Concepto" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} />

                <div className="pt-2">
                    <Dropzone value={form.imagen} onChange={url => setForm({ ...form, imagen: url })} label="Comprobante (Imagen)" />
                </div>

                <Button onClick={handleSave} className="w-full bg-brand-dark text-white h-12 mt-4 font-black uppercase tracking-widest">
                    Guardar Transacción
                </Button>
            </div>
        </Modal>
    );
};

export default TransactionModal;