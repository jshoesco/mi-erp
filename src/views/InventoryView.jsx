import React, { useState, useMemo, useEffect } from 'react';
import SafeImg from '../components/SafeImg';
import { useData } from '../context/DataContext';
import { db, doc, collection, addDoc, updateDoc, deleteDoc } from '../lib/firebase';
import { uploadToCloudinary, deleteFromCloudinary } from '../lib/utils';
import Button from '../components/Button';
import Icon, { Spinner } from '../components/Icon';
import Modal from '../components/Modal';
import { Input } from '../components/Inputs';
import SmartSelect from '../components/SmartSelect';
import ImageUploader from '../components/ImageUploader';
import ColumnConfigModal from '../components/ColumnConfigModal';
import ConfirmModal from '../components/ConfirmModal';

const DEFAULT_COLUMNS = [
    { id: 'def1', header: 'Producto', field: 'imagen' },
    { id: 'def2', header: 'Nombre / Ref', field: 'nombre' },
    { id: 'def3', header: 'SKU', field: 'sku' },
    { id: 'def4', header: 'Precio Venta', field: 'precio' },
    { id: 'def5', header: 'Estado', field: 'status' },
];

const formatInputNumber = (val) => {
    if (!val && val !== 0) return '';
    const num = val.toString().replace(/\D/g, "");
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parseInputNumber = (val) => {
    if (!val) return 0;
    return Number(val.toString().replace(/\./g, ""));
};

const InventoryView = () => {
    const { products = [], loading, providers = [], config = [], shipping = [], updateProduct, deleteProduct, notify } = useData();

    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({});
    const [uploading, setUploading] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [filterText, setFilterText] = useState('');
    const [currentTab, setCurrentTab] = useState('active');
    const [showConfig, setShowConfig] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({ linea: '', proveedor: '', minPrice: '', maxPrice: '', daysAgo: '' });

    const [replaceModalOpen, setReplaceModalOpen] = useState(false);
    const [replaceId, setReplaceId] = useState(null);
    const [visualCompare, setVisualCompare] = useState(null);
    const [similarProducts, setSimilarProducts] = useState([]);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', action: null, type: 'danger' });

    const [columns, setColumns] = useState(() => {
        const saved = localStorage.getItem('inventory_columns');
        return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
    });

    useEffect(() => { localStorage.setItem('inventory_columns', JSON.stringify(columns)); }, [columns]);

    const getDaysDiff = (dateString) => {
        if (!dateString) return null;
        const created = new Date(dateString);
        const now = new Date();
        created.setHours(0,0,0,0); now.setHours(0,0,0,0);
        return Math.floor((now - created) / 86400000);
    };

    useEffect(() => { 
        if (form?.modelo && !form?.id) { 
            const matches = products.filter(p => p.modelo?.toLowerCase() === form.modelo.toLowerCase() && p.status !== 'archivado' && p.status !== 'Reemplazado'); 
            setSimilarProducts(matches); 
        } else { setSimilarProducts([]); } 
    }, [form.modelo, products, form.id]);

    const availableOptions = useMemo(() => {
        if (!products.length) return { lineas: [], proveedores: [], fechas: [] };
        const getFilteredFor = (excludeField) => products.filter(p => {
            const isArchived = p.status === 'archivado' || p.status === 'Reemplazado';
            if (currentTab === 'active' ? isArchived : !isArchived) return false;
            if (excludeField !== 'linea' && filters.linea && (p.linea || p.line) !== filters.linea) return false;
            if (excludeField !== 'proveedor' && filters.proveedor && p.proveedor_uid !== filters.proveedor) return false;
            if (excludeField !== 'daysAgo' && filters.daysAgo !== '' && getDaysDiff(p.fecha) !== Number(filters.daysAgo)) return false;
            return true;
        });
        return {
            lineas: [...new Set(getFilteredFor('linea').map(p => p.linea || p.line))].filter(Boolean),
            proveedores: providers.filter(pr => [...new Set(getFilteredFor('proveedor').map(p => p.proveedor_uid))].includes(pr.id)),
            fechas: Array.from(getFilteredFor('daysAgo').reduce((map, p) => {
                const days = getDaysDiff(p.fecha);
                if (days !== null && !map.has(days)) map.set(days, days === 0 ? 'Hoy' : days === 1 ? 'Ayer' : `Hace ${days} días`);
                return map;
            }, new Map()).entries()).sort((a, b) => a[0] - b[0]).map(([v, l]) => ({ value: v.toString(), label: l }))
        };
    }, [products, filters, currentTab, providers]);

    const filteredProducts = useMemo(() => { 
        return products.filter(p => {
            const matchesSearch = (p.nombre || '').toLowerCase().includes(filterText.toLowerCase()) || (p.sku || '').toLowerCase().includes(filterText.toLowerCase());
            const isArchived = p.status === 'archivado' || p.status === 'Reemplazado';
            const matchesTab = currentTab === 'active' ? !isArchived : isArchived;
            const matchesLine = !filters.linea || (p.linea || p.line) === filters.linea;
            const matchesProv = !filters.proveedor || p.proveedor_uid === filters.proveedor;
            const matchesMinP = !filters.minPrice || Number(p.precio) >= parseInputNumber(filters.minPrice);
            const matchesMaxP = !filters.maxPrice || Number(p.precio) <= parseInputNumber(filters.maxPrice);
            const matchesDays = filters.daysAgo === '' || getDaysDiff(p.fecha) === Number(filters.daysAgo);
            return matchesSearch && matchesTab && matchesLine && matchesProv && matchesMinP && matchesMaxP && matchesDays;
        });
    }, [products, filterText, currentTab, filters]);

    const handleMoneyChange = (field, val) => { 
        const num = parseInputNumber(val); 
        const maxShip = shipping?.length ? Math.max(...shipping.map(s => Number(s.tarifa) || 0)) : 0;
        setForm(prev => { 
            const next = { ...prev, [field]: num }; 
            const cost = field === 'costo' ? num : (Number(prev.costo) || 0);
            const price = field === 'precio' ? num : (Number(prev.precio) || 0);
            if (field === 'precio') next.ganancia = num - (cost + maxShip);
            if (field === 'ganancia') next.precio = (cost + maxShip) + num;
            return next; 
        }); 
    };

    const handleReplaceSelect = (prod) => { setReplaceId(prod.id); setReplaceModalOpen(false); setVisualCompare(null); notify?.(`Sustituyendo a: ${prod.modelo}`); };

    const handleSave = async () => { 
        try { 
            if (form.id) { await updateDoc(doc(db, 'productos', form.id), form); } 
            else { 
                await addDoc(collection(db, 'productos'), { ...form, created_at: new Date().toISOString() }); 
                if (replaceId) await updateProduct(replaceId, { status: 'Reemplazado' });
            } 
            setModalOpen(false); setReplaceId(null); notify?.("Guardado"); 
        } catch (e) { notify?.("Error al guardar", "error"); } 
    };

    // --- CORRECCIÓN DEFINITIVA DE CARGA Y PREVIEW ---
    const handleFile = async (file) => {
        if (!file) return;
        
        // 1. Mostrar preview instantáneo usando URL local
        const localPreview = URL.createObjectURL(file);
        setForm(prev => ({ ...prev, imagen: localPreview }));

        if (!config?.[0]) {
            notify?.("Error: Configuración de nube no disponible", "error");
            return;
        }

        setUploading(true);
        try {
            const r = await uploadToCloudinary(file, config[0]);
            // 2. Reemplazar URL local por URL real de Cloudinary al terminar
            setForm(prev => ({ ...prev, imagen: r.secure_url, public_id: r.public_id }));
        } catch (e) {
            notify?.("Error al subir a la nube", "error");
        } finally {
            setUploading(false);
            URL.revokeObjectURL(localPreview); // Limpiar memoria
        }
    };

    const renderCell = (p, field) => {
        let v = p[field];
        if (field === 'proveedor') v = providers.find(x => x.id === p.proveedor_uid)?.nombre || '-';
        if (field === 'imagen') return <div className="w-fit"><SafeImg src={v} className="w-12 h-12 rounded-lg object-contain" /></div>;
        if (field === 'precio' || field === 'costo') return <span className="font-mono font-bold">${Number(v || 0).toLocaleString()}</span>;
        if (field === 'status') return <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${v === 'archivado' ? 'bg-gray-100 text-gray-500' : 'bg-emerald-50 text-emerald-600'}`}>{v || 'Activo'}</span>;
        return <span className="text-sm font-medium text-gray-700">{v || '-'}</span>;
    };

    if (loading) return <div className="p-10 flex justify-center"><Spinner /></div>;

    return (
        <div className="flex flex-col h-full space-y-4 relative">
            <ConfirmModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal(p => ({ ...p, isOpen: false }))} onConfirm={confirmModal.action} title={confirmModal.title} message={confirmModal.message} type={confirmModal.type} />
            {showConfig && <ColumnConfigModal currentColumns={columns} onSave={setColumns} onClose={() => setShowConfig(false)} />}

            {/* HEADER */}
            <div className="flex justify-between items-center">
                <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
                    <button onClick={() => { setCurrentTab('active'); setSelectedIds(new Set()); }} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${currentTab === 'active' ? 'bg-white shadow-sm' : 'text-gray-400'}`}>Activo</button>
                    <button onClick={() => { setCurrentTab('archived'); setSelectedIds(new Set()); }} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${currentTab === 'archived' ? 'bg-white shadow-sm text-brand-red' : 'text-gray-400'}`}><Icon name="Archive" size={14} /> Archivados</button>
                </div>
                <Button onClick={() => { setForm({ sku: '', nombre: '', modelo: '', marca: '', precio: 0, costo: 0, ganancia: 0, imagen: '', genero: 'Unisex', proveedor_uid: '', fecha: new Date().toISOString().slice(0, 10), status: 'Activo' }); setModalOpen(true); }} className="bg-brand-red text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg"><Icon name="Plus" size={20} /><span>Nuevo Producto</span></Button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-4 flex gap-4">
                <div className="relative w-full max-w-md">
                    <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Buscar..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={filterText} onChange={(e) => setFilterText(e.target.value)} />
                </div>
                <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-sm ${showFilters ? 'bg-brand-red text-white' : 'bg-white text-gray-600'}`}><Icon name="Filter" size={18} /><span>Filtros</span></button>
                {showFilters && (
                    <div className="flex gap-2 animate-fade-in">
                        <select value={filters.linea} onChange={e => setFilters({...filters, linea: e.target.value})} className="p-2 rounded-lg border text-sm"><option value="">Línea</option>{availableOptions.lineas.map(l => <option key={l} value={l}>{l}</option>)}</select>
                        <select value={filters.proveedor} onChange={e => setFilters({...filters, proveedor: e.target.value})} className="p-2 rounded-lg border text-sm"><option value="">Proveedor</option>{availableOptions.proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select>
                        <select value={filters.daysAgo} onChange={e => setFilters({...filters, daysAgo: e.target.value})} className="p-2 rounded-lg border text-sm"><option value="">Publicado</option>{availableOptions.fechas.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}</select>
                    </div>
                )}
            </div>

            <div className="flex-1 min-h-0 bg-white rounded-2xl border border-gray-200 overflow-hidden overflow-y-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 sticky top-0 z-10 border-b"><tr className="text-[10px] font-black uppercase text-gray-400"><th className="p-4 w-10"></th>{columns.map(c => <th key={c.id} className="p-4">{c.header}</th>)}</tr></thead>
                    <tbody className="divide-y">
                        {filteredProducts.map(p => (
                            <tr key={p.id} onClick={() => { setForm(p); setModalOpen(true); }} className="hover:bg-brand-red/5 cursor-pointer transition-all"><td className="p-4"><input type="checkbox" className="accent-brand-red" /></td>{columns.map(c => <td key={c.id} className="p-4">{renderCell(p, c.field)}</td>)}</tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={form.id ? "Editar" : "Nuevo Producto"}>
                <div className="space-y-5">
                    <ImageUploader image={form.imagen} onFileSelect={handleFile} loading={uploading} onClear={() => setForm({ ...form, imagen: '' })} />
                    
                    {similarProducts.length > 0 && !form.id && (
                        <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex justify-between items-center"><span className="text-xs font-bold text-amber-800 flex items-center gap-2"><Icon name="AlertTriangle" size={16}/> Modelo duplicado</span><button onClick={() => setReplaceModalOpen(true)} className="text-[10px] bg-amber-600 text-white px-3 py-1 rounded-lg font-black">COMPARAR</button></div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <Input type="date" label="Fecha" value={form.fecha || ''} onChange={e => setForm({ ...form, fecha: e.target.value })} />
                        <div className="relative space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Proveedor</label>
                            <div className="relative">
                                <SmartSelect value={form.proveedor_uid} options={providers} displayProp="nombre" valueProp="id" onChange={e => { const p = providers.find(x => x.id === e.target.value); if(p && !form.id) setForm(prev => ({...prev, proveedor_uid: p.id, sku: `${p.id_custom}${Math.floor(1000+Math.random()*9000)}`})); else setForm(prev => ({...prev, proveedor_uid: e.target.value})); }} />
                                {form.sku && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black bg-red-50 text-brand-red px-2 py-0.5 rounded border border-red-100">SKU: {form.sku}</span>}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <SmartSelect label="Marca" value={form.marca} options={[...new Set(products.map(x => x.marca))].filter(Boolean)} onChange={e => setForm({...form, marca: e.target.value})} onCreate={v => setForm({...form, marca: v})} />
                        <SmartSelect label="Modelo" value={form.modelo} options={[...new Set(products.filter(x => x.marca === form.marca).map(x => x.modelo))].filter(Boolean)} onChange={e => setForm({...form, modelo: e.target.value})} onCreate={v => setForm({...form, modelo: v})} />
                    </div>

                    <div className="grid grid-cols-2 gap-4"><Input label="Nombre Genérico" value={form.nombre || ''} onChange={e => setForm({ ...form, nombre: e.target.value })} /><SmartSelect label="Género" value={form.genero || 'Unisex'} options={['Unisex', 'Hombre', 'Mujer', 'Niños']} onChange={e => setForm({...form, genero: e.target.value})} /></div>

                    <div className="bg-gray-50 p-4 rounded-xl border grid grid-cols-3 gap-4">
                        <Input label="Costo" value={formatInputNumber(form.costo)} onChange={e => handleMoneyChange('costo', e.target.value)} />
                        <Input label="Precio" value={formatInputNumber(form.precio)} onChange={e => handleMoneyChange('precio', e.target.value)} />
                        <Input label="Ganancia" value={formatInputNumber(form.ganancia)} readOnly className="bg-emerald-50 text-emerald-600 font-bold" />
                    </div>

                    <div className="pt-2 flex justify-end gap-3 border-t"><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button><Button onClick={handleSave} className="bg-brand-red text-white" disabled={uploading}>Guardar</Button></div>
                </div>
            </Modal>

            {/* MODALES REEMPLAZO */}
            <Modal isOpen={replaceModalOpen} onClose={() => setReplaceModalOpen(false)} title="Comparar existente">
                <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
                    {similarProducts.map(p => (
                        <div key={p.id} className="border p-3 rounded-xl flex flex-col gap-3 hover:border-brand-red cursor-pointer" onClick={() => setVisualCompare(p)}><SafeImg src={p.imagen} className="h-40 object-contain bg-gray-50 rounded-lg" /><div className="text-center font-bold text-sm">{p.marca} {p.modelo}<br/><span className="text-[10px] text-gray-400">{p.sku}</span></div><button onClick={(e) => { e.stopPropagation(); handleReplaceSelect(p); }} className="w-full bg-gray-900 text-white text-[10px] font-bold py-2 rounded-lg uppercase">Sustituir</button></div>
                    ))}
                </div>
            </Modal>

            {visualCompare && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col p-4" onClick={() => setVisualCompare(null)}>
                    <div className="flex-1 flex gap-4 items-center justify-center">
                        <div className="flex-1 bg-neutral-900 h-full rounded-2xl flex flex-col items-center justify-center p-8"><span className="text-red-400 text-xs font-black mb-4 uppercase">Existente</span><SafeImg src={visualCompare.imagen} className="h-3/4 object-contain mb-4" /><h3 className="text-white font-bold">{visualCompare.marca} {visualCompare.modelo}</h3></div>
                        <div className="flex-1 bg-neutral-800 h-full rounded-2xl flex flex-col items-center justify-center p-8"><span className="text-emerald-400 text-xs font-black mb-4 uppercase">Nuevo</span><SafeImg src={form.imagen} className="h-3/4 object-contain mb-4" /><h3 className="text-white font-bold">{form.marca} {form.modelo}</h3></div>
                    </div>
                    <div className="p-8 flex justify-center"><Button onClick={() => handleReplaceSelect(visualCompare)} className="bg-brand-red h-14 px-12 rounded-full text-lg shadow-2xl">REEMPLAZAR</Button></div>
                </div>
            )}
        </div>
    );
};

export default InventoryView;