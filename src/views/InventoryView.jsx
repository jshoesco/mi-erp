import React, { useState, useMemo, useEffect } from 'react';
import SafeImg from '../components/SafeImg';
import { useData } from '../context/DataContext';
import { db, doc, collection, addDoc, updateDoc, deleteDoc } from '../lib/firebase';
import { formatCurrency, uploadToCloudinary, deleteFromCloudinary } from '../lib/utils';
import Button from '../components/Button';
import Icon, { Spinner } from '../components/Icon';
import Modal from '../components/Modal';
import { Input, NumberInput } from '../components/Inputs';
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

// --- HELPERS DE FORMATEO (MILES) ---
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
    const { products, loading, providers, config, shipping, updateProduct, deleteProduct, notify, confirmAction } = useData();

    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({});
    const [uploading, setUploading] = useState(false);
    const [suggestions, setSuggestions] = useState({ brands: [], models: [] });
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [filterText, setFilterText] = useState('');
    const [currentTab, setCurrentTab] = useState('active');
    const [showConfig, setShowConfig] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({ linea: '', proveedor: '', minPrice: '', maxPrice: '', daysAgo: '' });

    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', action: null, type: 'danger' });

    const [columns, setColumns] = useState(() => {
        const saved = localStorage.getItem('inventory_columns');
        return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
    });

    useEffect(() => {
        localStorage.setItem('inventory_columns', JSON.stringify(columns));
    }, [columns]);

    const getDaysDiff = (dateString) => {
        if (!dateString) return null;
        const created = new Date(dateString);
        const now = new Date();
        created.setHours(0,0,0,0);
        now.setHours(0,0,0,0);
        return Math.floor((now - created) / (1000 * 60 * 60 * 24));
    };

    // --- FILTRADO INTELIGENTE DE OPCIONES (NUEVO) ---
    // Esta lógica filtra las opciones de los SELECT basándose en los productos que ya están filtrados por los OTROS campos.
    
    const availableOptions = useMemo(() => {
        // Primero filtramos productos ignorando el filtro actual para no quedarnos sin opciones al seleccionar una
        const getFilteredFor = (excludeField) => products.filter(p => {
            const isArchived = p.status === 'archivado' || p.status === 'Reemplazado';
            if (currentTab === 'active' ? isArchived : !isArchived) return false;
            
            if (excludeField !== 'linea' && filters.linea && (p.linea || p.line) !== filters.linea) return false;
            if (excludeField !== 'proveedor' && filters.proveedor && p.proveedor_uid !== filters.proveedor) return false;
            if (excludeField !== 'daysAgo' && filters.daysAgo !== '' && getDaysDiff(p.fecha) !== Number(filters.daysAgo)) return false;
            return true;
        });

        const linesForSelect = [...new Set(getFilteredFor('linea').map(p => p.linea || p.line))].filter(Boolean);
        const provsForSelect = [...new Set(getFilteredFor('proveedor').map(p => p.proveedor_uid))].filter(Boolean);
        
        const uniqueDaysMap = new Map();
        getFilteredFor('daysAgo').forEach(p => {
            if (!p.fecha) return;
            const days = getDaysDiff(p.fecha);
            if (days !== null && !uniqueDaysMap.has(days)) {
                let label = days === 0 ? 'Hoy' : days === 1 ? 'Ayer' : `Hace ${days} días`;
                uniqueDaysMap.set(days, label);
            }
        });

        return {
            lineas: linesForSelect,
            proveedores: providers.filter(pr => provsForSelect.includes(pr.id)),
            fechas: Array.from(uniqueDaysMap.entries()).sort((a, b) => a[0] - b[0]).map(([v, l]) => ({ value: v.toString(), label: l }))
        };
    }, [products, filters, currentTab, providers]);

    // FILTRADO DE TABLA
    const filteredProducts = useMemo(() => { 
        return products.filter(p => {
            const matchesSearch = p.nombre?.toLowerCase().includes(filterText.toLowerCase()) || p.sku?.toLowerCase().includes(filterText.toLowerCase());
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

    const isAllSelected = filteredProducts.length > 0 && selectedIds.size === filteredProducts.length;

    const handleSelectAll = (e) => {
        if (e.target.checked) setSelectedIds(new Set(filteredProducts.map(p => p.id)));
        else setSelectedIds(new Set());
    };

    const handleSelectOne = (id) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id); else next.add(id);
        setSelectedIds(next);
    };

    const requestStatusChange = (newStatus) => {
        setConfirmModal({
            isOpen: true,
            title: newStatus === 'archivado' ? '¿Archivar productos?' : '¿Restaurar productos?',
            message: `Moverás ${selectedIds.size} productos.`,
            type: 'warning',
            action: async () => {
                const updates = Array.from(selectedIds).map(id => updateProduct(id, { status: newStatus }));
                await Promise.all(updates);
                setSelectedIds(new Set());
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const requestDelete = () => {
        setConfirmModal({
            isOpen: true,
            title: '¿Eliminar permanentemente?',
            message: `Vas a borrar ${selectedIds.size} productos.`,
            type: 'danger',
            action: async () => {
                const deletions = Array.from(selectedIds).map(async (id) => {
                    const product = products.find(p => p.id === id);
                    if (product?.public_id && config?.length) await deleteFromCloudinary(product.public_id, config[0]);
                    return deleteProduct(id);
                });
                await Promise.all(deletions);
                setSelectedIds(new Set());
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleMoneyChange = (field, val) => { 
        const num = parseInputNumber(val); 
        const maxShipping = shipping?.length ? Math.max(...shipping.map(s => Number(s.tarifa) || 0)) : 0;
        const baseCost = field === 'costo' ? num : (Number(form.costo) || 0); 
        const totalCost = baseCost + maxShipping; 
        const currentPrice = field === 'precio' ? num : (Number(form.precio) || 0); 
        setForm(prev => { 
            const next = { ...prev, [field]: num }; 
            if (field === 'costo') next.ganancia = currentPrice - totalCost; 
            else if (field === 'precio') next.ganancia = num - totalCost; 
            else if (field === 'ganancia') next.precio = totalCost + num; 
            return next; 
        }); 
    };

    const renderCell = (product, field) => {
        let value = product[field];
        if (field === 'proveedor') value = providers.find(p => p.id === product.proveedor_uid)?.nombre || '-';
        if (field === 'imagen') return <div className="w-fit"><SafeImg src={value} className="w-12 h-12 rounded-lg object-contain" /></div>;
        if (field === 'precio' || field === 'costo') return <span className="font-mono font-bold">${Number(value || 0).toLocaleString()}</span>;
        if (field === 'status') return <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wide ${value === 'archivado' ? 'bg-gray-100 text-gray-500' : 'bg-emerald-50 text-emerald-600'}`}>{value || 'Activo'}</span>;
        return <span className="text-sm font-medium text-gray-700">{value || '-'}</span>;
    };

    if (loading) return <div className="p-10 flex justify-center"><Spinner /></div>;
    
    return (
        <div className="flex flex-col h-full space-y-4 relative">
            <ConfirmModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })} onConfirm={confirmModal.action} title={confirmModal.title} message={confirmModal.message} type={confirmModal.type} />
            {showConfig && <ColumnConfigModal currentColumns={columns} onSave={setColumns} onClose={() => setShowConfig(false)} />}

            {/* HEADER SUPERIOR */}
            <div className="flex justify-between items-center">
                <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
                    <button onClick={() => { setCurrentTab('active'); setSelectedIds(new Set()); }} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${currentTab === 'active' ? 'bg-white text-brand-dark shadow-sm' : 'text-gray-400'}`}>Inventario Activo</button>
                    <button onClick={() => { setCurrentTab('archived'); setSelectedIds(new Set()); }} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${currentTab === 'archived' ? 'bg-white text-brand-red shadow-sm' : 'text-gray-400'}`}><Icon name="Archive" size={14} /> Archivados</button>
                </div>
                <Button onClick={() => setModalOpen(true)} className="bg-brand-red text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg">
                    <Icon name="Plus" size={20} /><span>Nuevo Producto</span>
                </Button>
            </div>

            {/* HERRAMIENTAS Y FILTROS */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex justify-between items-center p-4">
                    {selectedIds.size > 0 ? (
                        <div className="flex items-center gap-4 w-full animate-fade-in-up">
                            <div className="px-4 py-2 bg-brand-dark text-white rounded-xl text-sm font-bold flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">{selectedIds.size}</span> Seleccionados</div>
                            {currentTab === 'active' ? <button onClick={() => requestStatusChange('archivado')} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all"><Icon name="Archive" size={18} /> Archivar</button> : <button onClick={() => requestStatusChange('activo')} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-sm border border-emerald-100 hover:bg-emerald-100 transition-all"><Icon name="RefreshCw" size={18} /> Restaurar</button>}
                            <button onClick={requestDelete} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold text-sm border border-red-100 ml-auto hover:bg-red-100 transition-all"><Icon name="Trash2" size={18} /> Eliminar</button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4 flex-1">
                            <div className="relative w-full max-w-md">
                                <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input type="text" placeholder="Buscar..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={filterText} onChange={(e) => setFilterText(e.target.value)} />
                            </div>
                            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-sm ${showFilters ? 'bg-brand-red text-white' : 'bg-white text-gray-600 border-gray-200'}`}><Icon name="Filter" size={18} /><span>Filtros</span></button>
                        </div>
                    )}
                    {selectedIds.size === 0 && <Button onClick={() => setShowConfig(true)} className="bg-gray-900 text-white px-4 py-2 rounded-xl ml-2"><Icon name="Settings" size={18} /><span>Columnas</span></Button>}
                </div>

                {showFilters && !selectedIds.size && (
                    <div className="p-4 border-t border-gray-100 bg-gray-50/50 grid grid-cols-1 md:grid-cols-5 gap-4 animate-fade-in">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase">Línea</label>
                            <select value={filters.linea} onChange={(e) => setFilters({...filters, linea: e.target.value})} className="w-full p-2 rounded-lg border border-gray-200 text-sm bg-white outline-none">
                                <option value="">Todas</option>
                                {availableOptions.lineas.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase">Proveedor</label>
                            <select value={filters.proveedor} onChange={(e) => setFilters({...filters, proveedor: e.target.value})} className="w-full p-2 rounded-lg border border-gray-200 text-sm bg-white outline-none">
                                <option value="">Todos</option>
                                {availableOptions.proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase">Precio Min</label>
                            <input type="text" value={formatInputNumber(filters.minPrice)} onChange={(e) => setFilters({...filters, minPrice: e.target.value})} className="w-full p-2 rounded-lg border border-gray-200 text-sm outline-none" placeholder="0" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase">Precio Max</label>
                            <input type="text" value={formatInputNumber(filters.maxPrice)} onChange={(e) => setFilters({...filters, maxPrice: e.target.value})} className="w-full p-2 rounded-lg border border-gray-200 text-sm outline-none" placeholder="Max" />
                        </div>
                        <div className="space-y-1 relative">
                            <label className="text-[10px] font-black text-gray-400 uppercase">Publicado</label>
                            <select value={filters.daysAgo} onChange={(e) => setFilters({...filters, daysAgo: e.target.value})} className="w-full p-2 rounded-lg border border-gray-200 text-sm bg-white outline-none">
                                <option value="">Cualquier fecha</option>
                                {availableOptions.fechas.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                            {Object.values(filters).some(v => v !== '') && <button onClick={() => setFilters({linea:'', proveedor:'', minPrice:'', maxPrice:'', daysAgo:''})} className="absolute -top-6 right-0 text-[10px] text-brand-red font-bold">LIMPIAR</button>}
                        </div>
                    </div>
                )}
            </div>

            {/* TABLA */}
            <div className="flex-1 min-h-0 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-4 w-10 bg-gray-50"><input type="checkbox" className="w-4 h-4 rounded border-gray-300 accent-brand-red cursor-pointer" checked={isAllSelected} onChange={handleSelectAll} /></th>
                                {columns.map(col => <th key={col.id} className="p-4 text-xs font-black text-gray-400 uppercase bg-gray-50">{col.header}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredProducts.map(p => (
                                <tr key={p.id} onClick={() => { setForm(p); setModalOpen(true); }} className={`transition-colors cursor-pointer ${selectedIds.has(p.id) ? 'bg-red-50' : 'hover:bg-brand-red/5'}`}>
                                    <td className="p-4" onClick={(e) => e.stopPropagation()}><input type="checkbox" className="w-4 h-4 rounded border-gray-300 accent-brand-red cursor-pointer" checked={selectedIds.has(p.id)} onChange={() => handleSelectOne(p.id)} /></td>
                                    {columns.map(col => <td key={`${p.id}-${col.id}`} className="p-4">{renderCell(p, col.field)}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={form.id ? "Editar Producto" : "Nuevo Producto"}>
                <div className="space-y-5">
                    <ImageUploader image={form.imagen} onFileSelect={async (f) => { setUploading(true); const r = await uploadToCloudinary(f, config?.[0]); setForm(prev => ({...prev, imagen: r.secure_url, public_id: r.public_id})); setUploading(false); }} loading={uploading} onClear={() => setForm({ ...form, imagen: '' })} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input type="date" label="Fecha" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} />
                        <SmartSelect label="Proveedor" value={form.proveedor_uid} options={providers} displayProp="nombre" valueProp="id" onChange={e => { const p = providers.find(x => x.id === e.target.value); if(p && !form.id) setForm(prev => ({...prev, proveedor_uid: p.id, sku: `${p.id_custom}${Math.floor(1000+Math.random()*9000)}`})); else setForm(prev => ({...prev, proveedor_uid: e.target.value})); }} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="SKU" value={form.sku} readOnly className="bg-gray-100 font-mono font-bold" />
                        <SmartSelect label="Género" value={form.genero} options={['Unisex', 'Hombre', 'Mujer', 'Niños']} onChange={e => setForm({...form, genero: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input label="Costo" value={formatInputNumber(form.costo)} onChange={e => handleMoneyChange('costo', e.target.value)} />
                        <Input label="Precio" value={formatInputNumber(form.precio)} onChange={e => handleMoneyChange('precio', e.target.value)} />
                        <Input label="Ganancia" value={formatInputNumber(form.ganancia)} readOnly className="bg-emerald-50 text-emerald-600 font-bold" />
                    </div>
                    <div className="pt-2 flex justify-end gap-3"><Button onClick={() => setModalOpen(false)}>Cancelar</Button><Button onClick={async () => { if(form.id) await updateDoc(doc(db, 'productos', form.id), form); else await addDoc(collection(db, 'productos'), {...form, created_at: new Date().toISOString()}); setModalOpen(false); notify("Guardado"); }} className="bg-brand-red text-white">Guardar</Button></div>
                </div>
            </Modal>
        </div>
    );
};

export default InventoryView;