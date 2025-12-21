import React, { useState, useMemo, useEffect } from 'react';
import useCollection from '../hooks/useCollection';
import { useUI } from '../context/UIContext';
import { db, doc, writeBatch, collection, addDoc, updateDoc, deleteDoc, getDoc } from '../lib/firebase';
import { formatCurrency, uploadToCloudinary } from '../lib/utils';
import Button from '../components/ui/Button';
import Icon, { Spinner } from '../components/ui/Icon';
import Modal from '../components/ui/Modal';
import { Input, NumberInput } from '../components/ui/Input';
import { Select } from '../components/ui/Select'; // <--- NUEVO
import Dropzone from '../components/ui/Dropzone'; // <--- NUEVO
import BulkActions from '../components/BulkActions';

const FinanzasView = () => {
    const { data: orders } = useCollection('pedidos');
    const { data: finanzas } = useCollection('finanzas');
    const { data: config } = useCollection('config_finanzas');
    const { data: generalConfig } = useCollection('config_general');
    const { notify, confirmAction } = useUI();

    const [modalOpen, setModalOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [filterType, setFilterType] = useState('Todos');
    const [selectedIds, setSelectedIds] = useState([]);
    const [globalSearch, setGlobalSearch] = useState('');

    const [form, setForm] = useState({ tipo: 'Gasto', categoria: '', metodo: '', monto: '', concepto: '', transaction_id: '', imagen: '' });
    const [finConfig, setFinConfig] = useState({ ingresos: [], gastos: [], methods: [] });
    const [cloudConfig, setCloudConfig] = useState({});

    useEffect(() => { if (config.length) setFinConfig(config[0]); }, [config]);
    useEffect(() => { if (generalConfig.length) setCloudConfig(generalConfig[0]); }, [generalConfig]);
    useEffect(() => { if (!editingId) setForm(f => ({ ...f, categoria: '' })); }, [form.tipo, editingId]);

    // --- FILTRADO ---
    const filteredFinanzas = useMemo(() => {
        let res = finanzas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        if (filterType !== 'Todos') res = res.filter(f => f.tipo === filterType);

        if (globalSearch) {
            const lower = globalSearch.toLowerCase();
            res = res.filter(f =>
                (f.concepto || '').toLowerCase().includes(lower) ||
                (f.categoria || '').toLowerCase().includes(lower) ||
                (f.metodo || '').toLowerCase().includes(lower) ||
                (f.monto || '').toString().includes(lower)
            );
        }
        return res;
    }, [finanzas, filterType, globalSearch]);

    // --- ACCIONES ---
    const toggleSelectAll = () => { selectedIds.length === filteredFinanzas.length ? setSelectedIds([]) : setSelectedIds(filteredFinanzas.map(f => f.id)); };
    const toggleSelectRow = (id) => { selectedIds.includes(id) ? setSelectedIds(p => p.filter(x => x !== id)) : setSelectedIds(p => [...p, id]); };

    const handleFile = async (files) => {
        if (!files || files.length === 0) return;
        const file = files[0];
        if (!cloudConfig.cloud_name) return notify("Falta config Cloudinary", "error");
        setUploading(true);
        try {
            const res = await uploadToCloudinary(file, cloudConfig, `TX-${Date.now()}`, 'pagos');
            setForm(prev => ({ ...prev, imagen: res.secure_url }));
        } catch (e) { notify(e.message, "error"); }
        setUploading(false);
    };

    const openEditModal = (item) => { setEditingId(item.id); setForm(item); setModalOpen(true); };

    const handleSave = async () => {
        if (!form.monto || !form.metodo || !form.categoria) return notify("Completa los campos obligatorios", "error");

        try {
            const payload = { ...form, monto: Number(form.monto), fecha: form.fecha || new Date().toISOString() };
            if (editingId) {
                await updateDoc(doc(db, 'finanzas', editingId), payload);
                notify("Movimiento actualizado");
            } else {
                await addDoc(collection(db, 'finanzas'), payload);
                notify("Movimiento registrado");
            }
            setModalOpen(false);
            setForm({ tipo: 'Gasto', categoria: '', metodo: '', monto: '', concepto: '', transaction_id: '', imagen: '' });
            setEditingId(null);
        } catch (e) { notify(e.message, "error"); }
    };

    const handleDelete = async () => {
        if (!window.confirm(`¿Eliminar ${selectedIds.length} movimientos?`)) return;
        const batch = writeBatch(db);
        selectedIds.forEach(id => batch.delete(doc(db, 'finanzas', id)));
        await batch.commit();
        setSelectedIds([]);
        notify("Eliminados correctamente");
    };

    // Helper Labels
    const Label = ({ children }) => <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] ml-1 block mb-2">{children}</label>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 pb-24">
            {/* HEADER & FILTROS */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-full md:w-auto flex gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
                    {['Todos', 'Ingreso', 'Gasto'].map(t => (
                        <button key={t} onClick={() => setFilterType(t)} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${filterType === t ? 'bg-brand-dark text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>
                            {t}
                        </button>
                    ))}
                </div>
                <div className="flex-1 w-full md:max-w-md relative">
                    <Input placeholder="BUSCAR MOVIMIENTOS..." value={globalSearch} onChange={e => setGlobalSearch(e.target.value)} className="pl-10 uppercase" />
                    <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                <Button onClick={() => { setEditingId(null); setForm(f => ({ ...f, fecha: new Date().toISOString().slice(0, 10) })); setModalOpen(true); }} className="bg-brand-red text-white h-12 px-6 uppercase text-[10px]">
                    Registrar Movimiento
                </Button>
            </div>

            {/* TABLA */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                            <th className="p-4 w-10"><input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.length === filteredFinanzas.length && filteredFinanzas.length > 0} className="rounded border-gray-300 text-brand-red focus:ring-brand-red" /></th>
                            <th className="p-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha</th>
                            <th className="p-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Concepto</th>
                            <th className="p-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Categoría</th>
                            <th className="p-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Método</th>
                            <th className="p-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Monto</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredFinanzas.map(item => (
                            <tr key={item.id} className={`group hover:bg-gray-50 transition-colors cursor-pointer ${selectedIds.includes(item.id) ? 'bg-red-50/30' : ''}`} onClick={() => toggleSelectRow(item.id)}>
                                <td className="p-4"><input type="checkbox" checked={selectedIds.includes(item.id)} readOnly className="rounded border-gray-300 text-brand-red" /></td>
                                <td className="p-4 text-xs font-bold text-gray-500">{item.fecha?.slice(0, 10)}</td>
                                <td className="p-4">
                                    <div className="font-bold text-gray-800 text-xs uppercase">{item.concepto || 'Sin concepto'}</div>
                                    {item.imagen && <a href={item.imagen} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-[9px] text-indigo-500 hover:underline flex items-center gap-1 mt-0.5"><Icon name="Image" size={10} /> Ver Comprobante</a>}
                                </td>
                                <td className="p-4"><span className="px-2 py-1 rounded-md bg-gray-100 text-[10px] font-bold text-gray-500 uppercase">{item.categoria}</span></td>
                                <td className="p-4 text-[10px] font-bold text-gray-500 uppercase">{item.metodo}</td>
                                <td className={`p-4 text-right font-black text-sm ${item.tipo === 'Ingreso' ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {item.tipo === 'Ingreso' ? '+' : '-'} {formatCurrency(item.monto)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredFinanzas.length === 0 && <div className="p-10 text-center text-gray-400 text-xs uppercase font-bold tracking-widest">No hay movimientos registrados</div>}
            </div>

            {/* BULK ACTIONS */}
            <BulkActions
                selectedCount={selectedIds.length}
                onDelete={handleDelete}
                actions={[]}
            />

            {/* MODAL FORMULARIO */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Editar Movimiento" : "Nuevo Movimiento"}>
                <div className="space-y-5">
                    {/* TIPO */}
                    <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                        {['Ingreso', 'Gasto'].map(t => (
                            <button key={t} onClick={() => setForm(f => ({ ...f, tipo: t, categoria: '' }))} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${form.tipo === t ? (t === 'Ingreso' ? 'bg-emerald-500 text-white shadow-md' : 'bg-red-500 text-white shadow-md') : 'text-gray-400 hover:text-gray-600'}`}>
                                {t}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input type="date" label="Fecha" value={form.fecha || new Date().toISOString().slice(0, 10)} onChange={e => setForm({ ...form, fecha: e.target.value })} />
                        <NumberInput label="Monto" value={form.monto} onChange={e => setForm({ ...form, monto: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Categoría</Label>
                            <Select
                                options={form.tipo === 'Ingreso' ? (finConfig.ingresos || []) : (finConfig.gastos || [])}
                                value={form.categoria}
                                onChange={e => setForm({ ...form, categoria: e.target.value })}
                                placeholder="Seleccionar..."
                            />
                        </div>
                        <div>
                            <Label>Método de Pago</Label>
                            <Select
                                options={(finConfig.methods || []).map(m => m.name)}
                                value={form.metodo}
                                onChange={e => setForm({ ...form, metodo: e.target.value })}
                                placeholder="Seleccionar..."
                            />
                        </div>
                    </div>

                    <Input label="Concepto / Detalle" value={form.concepto} onChange={e => setForm({ ...form, concepto: e.target.value })} placeholder="Ej: Pago de Nómina..." />

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                        <Input label="ID Transacción (Opcional)" value={form.transaction_id} onChange={e => setForm({ ...form, transaction_id: e.target.value })} />
                        <Dropzone
                            label="Comprobante"
                            value={form.imagen}
                            onChange={handleFile}
                            loading={uploading}
                        />
                    </div>

                    <Button onClick={handleSave} className="w-full h-12 uppercase text-[10px] font-black tracking-widest bg-brand-dark">
                        Guardar Movimiento
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

export default FinanzasView;