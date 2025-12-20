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

const InventoryView = () => {
    const { products, loading, providers, config, shipping, updateProduct, deleteProduct, notify, confirmAction } = useData();

    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({});
    const [uploading, setUploading] = useState(false);
    const [suggestions, setSuggestions] = useState({ brands: [], models: [] });
    const [selectedIds, setSelectedIds] = useState(new Set()); // Para el checkbox
    const [filterText, setFilterText] = useState('');
    const [similarProducts, setSimilarProducts] = useState([]);
    const [currentTab, setCurrentTab] = useState('active'); // PESTAÑA RESTAURADA
    
    const [replaceModalOpen, setReplaceModalOpen] = useState(false);
    const [replaceId, setReplaceId] = useState(null);

    const [sortConfig, setSortConfig] = useState({ key: 'fecha', direction: 'desc' });
    const [showConfig, setShowConfig] = useState(false);
    const [columns, setColumns] = useState(() => {
        const saved = localStorage.getItem('inventory_columns');
        return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
    });

    useEffect(() => {
        localStorage.setItem('inventory_columns', JSON.stringify(columns));
    }, [columns]);

    const maxShipping = useMemo(() => { 
        if (!shipping?.length) return 0; 
        return Math.max(...shipping.map(s => Number(s.tarifa) || 0)); 
    }, [shipping]);

    useEffect(() => { 
        const brands = [...new Set(products.map(p => p.marca))].filter(Boolean); 
        setSuggestions(prev => ({ ...prev, brands })); 
    }, [products]);

    useEffect(() => { 
        if (form.marca) { 
            const models = [...new Set(products.filter(p => p.marca === form.marca).map(p => p.modelo))].filter(Boolean); 
            setSuggestions(prev => ({ ...prev, models })); 
        } 
    }, [form.marca, products]);
    
    useEffect(() => { 
        if (form.modelo && !form.id) { 
            const matches = products.filter(p => p.modelo && p.modelo.toLowerCase() === form.modelo.toLowerCase() && p.status !== 'Reemplazado'); 
            setSimilarProducts(matches); 
        } else { 
            setSimilarProducts([]); 
        } 
    }, [form.modelo, products, form.id]);

    const getProvName = (id) => providers.find(p => p.id === id)?.nombre || 'Desconocido';

    const openModal = (item = null) => { 
        setReplaceId(null); 
        if (item) { setForm({ ...item }); } 
        else { setForm({ sku: '', nombre: '', modelo: '', marca: '', precio: 0, costo: 0, ganancia: 0, imagen: '', genero: 'Unisex', proveedor_uid: '', compartido: false, fecha: new Date().toISOString().slice(0, 10), status: 'Activo' }); } 
        setModalOpen(true); 
    };

    const handleFile = async (file) => { 
        if (!file || !config?.length) return notify("Falta configuración nube", "error"); 
        setUploading(true); 
        try { 
            const dateStr = (form.fecha || new Date().toISOString().slice(0, 10)).replace(/-/g, '').slice(2); 
            const clean = (s) => (s || '').toString().trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'X'; 
            const publicId = `${dateStr}-${clean(form.sku)}-${clean(form.marca)}-${clean(form.modelo)}-${clean(form.nombre)}`; 
            if (form.public_id) await deleteFromCloudinary(form.public_id, config[0]); 
            const result = await uploadToCloudinary(file, config[0], publicId); 
            setForm(prev => ({ ...prev, imagen: result.secure_url, public_id: result.public_id })); 
        } catch (e) { notify("Error subida: " + e.message, "error"); } 
        setUploading(false); 
    };

    const handleMoneyChange = (field, val) => { 
        const num = Number(val) || 0; 
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

    const handleSave = async () => { 
        const payload = { ...form, precio: Number(form.precio) || 0, costo: Number(form.costo) || 0, ganancia: Number(form.ganancia) || 0 }; 
        try { 
            if (form.id) { await updateDoc(doc(db, 'productos', form.id), payload); } 
            else { await addDoc(collection(db, 'productos'), { ...payload, created_at: new Date().toISOString() }); } 
            setModalOpen(false); notify("Producto guardado"); 
        } catch (e) { notify("Error: " + e.message, "error"); } 
    };

    const filteredProducts = useMemo(() => { 
        return products.filter(p => {
            const matchesSearch = p.nombre?.toLowerCase().includes(filterText.toLowerCase()) || p.sku?.toLowerCase().includes(filterText.toLowerCase());
            const isArchived = p.status === 'archivado' || p.status === 'Reemplazado';
            const matchesTab = currentTab === 'active' ? !isArchived : isArchived;
            return matchesSearch && matchesTab;
        });
    }, [products, filterText, currentTab]);

    const renderCell = (product, field) => {
        let value = product[field];
        if (field === 'proveedor') value = getProvName(product.proveedor_uid);
        if (field === 'imagen') return <div className="w-fit"><SafeImg src={value} className="w-12 h-12 rounded-lg object-contain" /></div>;
        if (field === 'precio' || field === 'costo') return <span className="font-mono font-bold">${Number(value || 0).toLocaleString()}</span>;
        if (field === 'status') return <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wide ${value === 'archivado' ? 'bg-gray-100 text-gray-500' : 'bg-emerald-50 text-emerald-600'}`}>{value || 'Activo'}</span>;
        return <span className="text-sm font-medium text-gray-700">{value || '-'}</span>;
    };

    if (loading) return <div className="p-10 flex justify-center"><Spinner /></div>;
    
    return (
        <div className="flex flex-col h-full space-y-4 relative">
            {showConfig && <ColumnConfigModal currentColumns={columns} onSave={setColumns} onClose={() => setShowConfig(false)} />}

            {/* PESTAÑAS Y BOTÓN NUEVO - RESTAURADO */}
            <div className="flex justify-between items-center">
                <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
                    <button onClick={() => setCurrentTab('active')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${currentTab === 'active' ? 'bg-white text-brand-dark shadow-sm' : 'text-gray-400'}`}>Inventario Activo</button>
                    <button onClick={() => setCurrentTab('archived')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${currentTab === 'archived' ? 'bg-white text-brand-red shadow-sm' : 'text-gray-400'}`}><Icon name="Archive" size={14} /> Archivados</button>
                </div>
                <Button onClick={() => openModal()} className="bg-brand-red text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-brand-red/20">
                    <Icon name="Plus" size={20} /><span>Nuevo Producto</span>
                </Button>
            </div>

            {/* BARRA DE BÚSQUEDA Y COLUMNAS */}
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100 min-h-[80px]">
                <div className="flex items-center gap-4 flex-1">
                    <div className="relative w-full max-w-md">
                        <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" placeholder="Buscar..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={filterText} onChange={(e) => setFilterText(e.target.value)} />
                    </div>
                </div>
                <Button onClick={() => setShowConfig(true)} className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-gray-900/20"><Icon name="Settings" size={18} /><span>Columnas</span></Button>
            </div>

            {/* TABLA */}
            <div className="flex-1 min-h-0 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-4 w-10 bg-gray-50"><input type="checkbox" className="w-4 h-4 rounded border-gray-300 accent-brand-red" /></th>
                                {columns.map(col => <th key={col.id} className="p-4 text-xs font-black text-gray-400 uppercase bg-gray-50">{col.header}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredProducts.map(p => (
                                <tr key={p.id} onClick={() => openModal(p)} className="hover:bg-brand-red/5 cursor-pointer">
                                    <td className="p-4" onClick={(e) => e.stopPropagation()}><input type="checkbox" className="w-4 h-4 rounded border-gray-300 accent-brand-red" /></td>
                                    {columns.map(col => <td key={`${p.id}-${col.id}`} className="p-4">{renderCell(p, col.field)}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* FORMULARIO VIEJO EXACTO */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={form.id ? "Editar Producto" : "Nuevo Producto"}>
                <div className="space-y-5">
                    <ImageUploader image={form.imagen} onFileSelect={handleFile} loading={uploading} onClear={() => setForm({ ...form, imagen: '' })} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input type="date" label="Fecha" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} />
                        <SmartSelect label="Proveedor" value={form.proveedor_uid} onChange={e => setForm({...form, proveedor_uid: e.target.value})} options={providers} displayProp="nombre" valueProp="id" placeholder="Buscar Proveedor..." />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="SKU" value={form.sku} readOnly className="bg-gray-100 font-mono font-bold text-gray-700 cursor-not-allowed" />
                        <SmartSelect label="Género" value={form.genero} onChange={e => setForm({ ...form, genero: e.target.value })} options={['Unisex', 'Hombre', 'Mujer', 'Niños']} placeholder="Seleccionar..." />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SmartSelect label="Marca" value={form.marca} onChange={e => setForm({ ...form, marca: e.target.value })} options={suggestions.brands} placeholder="Marca..." onCreate={(val) => setForm({...form, marca: val})} />
                        <SmartSelect label="Modelo" value={form.modelo} onChange={e => setForm({ ...form, modelo: e.target.value })} options={suggestions.models} placeholder="Modelo..." onCreate={(val) => setForm({...form, modelo: val})} />
                    </div>
                    <Input label="Nombre Genérico" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <NumberInput label="Costo Base" value={form.costo} onChange={e => handleMoneyChange('costo', e.target.value)} />
                            <NumberInput label="Precio Venta" value={form.precio} onChange={e => handleMoneyChange('precio', e.target.value)} />
                            <NumberInput label="Ganancia Real" value={form.ganancia} onChange={e => handleMoneyChange('ganancia', e.target.value)} className="font-bold text-emerald-600 bg-emerald-50 border-emerald-200" />
                        </div>
                    </div>
                    <div className="pt-2 flex justify-end gap-3 border-t border-gray-100">
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={uploading}>Guardar Producto</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default InventoryView;