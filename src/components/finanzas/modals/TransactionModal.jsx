import React, { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { doc, addDoc, updateDoc, collection } from 'firebase/firestore';
import { useData } from '../../../context/DataContext';
import { useUI } from '../../../context/UIContext';

// --- IMPORTACIONES GENÉRICAS (SISTEMA BLINDADO) ---
import ModalLayout from '../../ui/layout/ModalLayout';
import { Input, NumberInput } from '../../ui/forms/Controls';
import { Select } from '../../ui/forms/Select';
import { Button } from '../../ui/display/Button';
import { TextLabel } from '../../ui/display/Typography';
import Dropzone from '../../ui/Dropzone';

const TransactionModal = ({ isOpen, onClose, editingItem }) => {
    const { financeConfig } = useData();
    const { notify } = useUI();
    const [loading, setLoading] = useState(false);

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
                // Manejo de fecha de Firestore vs String
                fecha: editingItem.fecha?.seconds
                    ? new Date(editingItem.fecha.seconds * 1000).toISOString().slice(0, 10)
                    : editingItem.fecha
            } : {
                tipo: 'GASTO', monto: '', categoria: '', metodo: '', descripcion: '', imagen: '',
                fecha: new Date().toISOString().slice(0, 10)
            });
        }
    }, [isOpen, editingItem]);

    const handleSave = async () => {
        if (!form.monto || !form.categoria || !form.metodo) return notify("Completa los campos obligatorios", "error");

        setLoading(true);
        try {
            const payload = {
                ...form,
                monto: Number(form.monto),
                fecha: new Date(form.fecha).toISOString() // Guardamos como ISO para consistencia
            };

            if (editingItem) {
                await updateDoc(doc(db, 'finanzas', editingItem.id), payload);
            } else {
                await addDoc(collection(db, 'finanzas'), payload);
            }

            notify("Transacción registrada correctamente");
            onClose();
        } catch (e) {
            notify(e.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const categories = form.tipo === 'INGRESO' ? (financeConfig?.ingresos || []) : (financeConfig?.gastos || []);
    const methods = financeConfig?.methods?.map(m => m.name) || [];

    return (
        <ModalLayout
            isOpen={isOpen}
            onClose={onClose}
            title={editingItem ? "Editar Movimiento" : "Nuevo Movimiento Financiero"}
            size="max-w-xl"
            actions={
                <Button onClick={handleSave} loading={loading} variant="brand" className="w-full h-14">
                    Guardar Transacción
                </Button>
            }
        >
            <div className="space-y-8 animate-fade-in">
                {/* SELECTOR DE TIPO (CÁPSULA) */}
                <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] border border-slate-200 shadow-inner">
                    {['INGRESO', 'GASTO'].map(t => (
                        <button
                            key={t}
                            onClick={() => setForm({ ...form, tipo: t, categoria: '' })}
                            className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${form.tipo === t
                                    ? 'bg-white shadow-lg text-slate-900 scale-[1.02]'
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {/* CAMPOS PRINCIPALES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                    <NumberInput
                        label="Monto de la Operación"
                        value={form.monto}
                        onChange={e => setForm({ ...form, monto: e.target.value })}
                    />
                    <Input
                        label="Fecha"
                        type="date"
                        value={form.fecha}
                        onChange={e => setForm({ ...form, fecha: e.target.value })}
                    />
                    <Select
                        label="Categoría"
                        options={categories}
                        value={form.categoria}
                        onChange={e => setForm({ ...form, categoria: e.target.value })}
                    />
                    <Select
                        label="Método utilizado"
                        options={methods}
                        value={form.metodo}
                        onChange={e => setForm({ ...form, metodo: e.target.value })}
                    />
                </div>

                {/* DETALLES ADICIONALES */}
                <div className="space-y-6">
                    <Input
                        label="Descripción o Concepto"
                        placeholder="Ej: Pago de arriendo local sur..."
                        value={form.descripcion}
                        onChange={e => setForm({ ...form, descripcion: e.target.value })}
                    />

                    <div className="space-y-3">
                        <TextLabel>Soporte de la operación (Imagen)</TextLabel>
                        <Dropzone
                            value={form.imagen}
                            onChange={url => setForm({ ...form, imagen: url })}
                        />
                    </div>
                </div>
            </div>
        </ModalLayout>
    );
};

export default TransactionModal;