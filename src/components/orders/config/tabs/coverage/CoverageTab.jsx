import React, { useState, useEffect } from 'react';
import { useData } from '../../../../../context/DataContext';
import { DB } from '../../../../../constants/collections';
import { Button } from '../../../../ui/display/Button';
import { Input } from '../../../../ui/forms/Input';
import Icon from '../../../../ui/display/Icon';
import { db } from '../../../../../lib/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const CoverageTab = () => {
    const { coverage } = useData();
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [form, setForm] = useState({
        codigo: '', ciudad: '', paqueteria: '', tarifa: '', isAcopio: false
    });

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
            if (editingId) {
                await updateDoc(doc(db, DB.COVERAGE, editingId), data);
                setEditingId(null);
            } else {
                await addDoc(collection(db, DB.COVERAGE), data);
            }
            setForm({ codigo: '', ciudad: '', paqueteria: '', tarifa: '', isAcopio: false });
        } catch (error) { console.error(error); }
        finally { setIsSaving(false); }
    };

    return (
        <div className="space-y-8 pb-20">
            {/* FORMULARIO SUPERIOR */}
            <section className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-3"><Input label="ID" value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value })} /></div>
                        <div className="col-span-9"><Input label="CIUDAD" value={form.ciudad} onChange={e => setForm({ ...form, ciudad: e.target.value })} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="PAQUETERÍA" value={form.paqueteria} onChange={e => setForm({ ...form, paqueteria: e.target.value })} />
                        <Input label="TARIFA $" type="number" value={form.tarifa} onChange={e => setForm({ ...form, tarifa: e.target.value })} />
                    </div>
                    <div className="flex items-center justify-between px-5 py-3 bg-white rounded-2xl border border-slate-100">
                        <span className="text-[10px] font-black uppercase text-slate-700 italic">Habilitar como centro de acopio</span>
                        <input type="checkbox" checked={form.isAcopio} onChange={e => setForm({ ...form, isAcopio: e.target.checked })} className="w-6 h-6 accent-slate-900 cursor-pointer" />
                    </div>
                    <Button loading={isSaving} className="w-full h-14 uppercase tracking-widest text-[11px]">
                        {editingId ? 'ACTUALIZAR DESTINO' : 'REGISTRAR DESTINO'}
                    </Button>
                    {editingId && (
                        <button type="button" onClick={() => { setEditingId(null); setForm({ codigo: '', ciudad: '', paqueteria: '', tarifa: '', isAcopio: false }) }} className="w-full text-[9px] font-black text-red-500 uppercase">Cancelar Edición</button>
                    )}
                </form>
            </section>

            {/* TABLA PURA */}
            <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Ciudad</th>
                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Tipo</th>
                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Tarifa</th>
                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {coverage?.map(item => (
                            <tr key={item.id} className="group hover:bg-slate-50/50 transition-all">
                                <td className="px-6 py-4">
                                    <span className="bg-slate-900 text-white text-[9px] font-black px-2 py-1 rounded-md">{item.codigo}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-black uppercase text-slate-800">{item.ciudad}</span>
                                        <span className="text-[8px] font-bold text-slate-400 uppercase">{item.paqueteria || 'GENERAL'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {item.isAcopio ? (
                                        <span className="bg-blue-600 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase">Acopio</span>
                                    ) : (
                                        <span className="bg-slate-100 text-slate-400 text-[8px] font-black px-2 py-1 rounded-full uppercase">Entrega</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-[11px] font-black text-slate-900 text-right">
                                    ${item.tarifa?.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-1">
                                        <button onClick={() => { setEditingId(item.id); setForm({ ...item, tarifa: item.tarifa || '' }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="p-2 text-slate-300 hover:text-blue-600 transition-colors"><Icon name="edit" size={14} /></button>
                                        <button onClick={async () => { if (confirm('¿BORRAR?')) await deleteDoc(doc(db, DB.COVERAGE, item.id)) }} className="p-2 text-slate-300 hover:text-red-600 transition-colors"><Icon name="trash" size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CoverageTab;