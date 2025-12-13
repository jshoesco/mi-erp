import React, { useState, useMemo, useEffect } from 'react';
import SafeImg from '../components/SafeImg';
import useCollection from '../hooks/useCollection';
import { useUI } from '../context/UIContext';
import { db, doc, writeBatch, collection, addDoc, updateDoc, deleteDoc } from '../lib/firebase';
import { formatCurrency, uploadToCloudinary, deleteFromCloudinary } from '../lib/utils';
import Button from '../components/Button';
import Icon, { Spinner } from '../components/Icon';
import Modal from '../components/Modal';
import { Input, NumberInput } from '../components/Inputs';
import SmartSelect from '../components/SmartSelect';
import ImageUploader from '../components/ImageUploader';
import BulkActions from '../components/BulkActions';

const InventoryView = () => {
    const { data: products, loading } = useCollection('productos');
    const { data: providers } = useCollection('proveedores');
    const { data: config } = useCollection('config_general');
    const { data: shipping } = useCollection('tarifas_envios');
    const { notify, confirmAction } = useUI();

    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({});
    const [uploading, setUploading] = useState(false);
    const [suggestions, setSuggestions] = useState({ brands: [], models: [] });
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [filterText, setFilterText] = useState('');
    const [similarProducts, setSimilarProducts] = useState([]);
    
    // Modales de Reemplazo
    const [replaceModalOpen, setReplaceModalOpen] = useState(false);
    const [replaceId, setReplaceId] = useState(null);
    const [visualCompare, setVisualCompare] = useState(null);   // Única comparación activa

    // Estado para el ordenamiento
    const [sortConfig, setSortConfig] = useState({ key: 'fecha', direction: 'desc' });

    const maxShipping = useMemo(() => { 
        if (!shipping.length) return 0; 
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
    
    // Detección de duplicados
    useEffect(() => { 
        if (form.modelo && !form.id) { 
            const matches = products.filter(p => p.modelo && p.modelo.toLowerCase() === form.modelo.toLowerCase() && p.status !== 'Reemplazado'); 
            setSimilarProducts(matches); 
        } else { 
            setSimilarProducts([]); 
        } 
    }, [form.modelo, products, form.id]);

    const getProvName = (id) => providers.find(p => p.id === id)?.nombre || 'Desconocido';

    // --- CÁLCULO DE DÍAS (NUEVO) ---
    const getDaysAgo = (dateStr) => {
        if (!dateStr) return '';
        const diff = new Date() - new Date(dateStr);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days === 0) return '(Hoy)';
        if (days === 1) return '(Ayer)';
        return `(Hace ${days} días)`;
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const openModal = (item = null) => { 
        setReplaceId(null); 
        if (item) { setForm({ ...item }); } 
        else { setForm({ sku: '', nombre: '', modelo: '', marca: '', precio: 0, costo: 0, ganancia: 0, imagen: '', genero: 'Unisex', proveedor_uid: '', compartido: false, fecha: new Date().toISOString().slice(0, 10), status: 'Activo' }); } 
        setModalOpen(true); 
    };

    const handleReplaceSelect = (prod) => { setReplaceId(prod.id); setReplaceModalOpen(false); setVisualCompare(null); notify(`Sustituyendo a: ${prod.modelo} (${prod.sku})`); };
    
    const handleFile = async (file) => { 
        if (!file || !config.length) return notify("Falta configuración nube", "error"); 
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

    const handleProviderChange = (e) => { 
        const provId = e.target.value; 
        const provData = providers.find(p => p.id === provId); 
        if (!form.id && provData) { 
            const random = Math.floor(1000 + Math.random() * 9000); 
            setForm(prev => ({ ...prev, proveedor_uid: provId, sku: `${provData.id_custom}${random}` })); 
        } else { 
            setForm(prev => ({ ...prev, proveedor_uid: provId })); 
        } 
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
        const payload = { sku: form.sku || '', nombre: form.nombre || '', modelo: form.modelo || '', marca: form.marca || '', precio: Number(form.precio) || 0, costo: Number(form.costo) || 0, ganancia: Number(form.ganancia) || 0, imagen: form.imagen || '', genero: form.genero || 'Unisex', proveedor_uid: form.proveedor_uid || '', compartido: !!form.compartido, fecha: form.fecha || new Date().toISOString().slice(0, 10), public_id: form.public_id || '', status: 'Activo' }; 
        try { 
            if (form.id) { 
                await updateDoc(doc(db, 'productos', form.id), payload); 
            } else { 
                await addDoc(collection(db, 'productos'), { ...payload, created_at: new Date().toISOString() }); 
                if (replaceId) { await updateDoc(doc(db, 'productos', replaceId), { status: 'Reemplazado' }); } 
            } 
            setModalOpen(false); notify("Producto guardado"); 
        } catch (e) { notify("Error: " + e.message, "error"); } 
    };

    const handleDelete = async (product) => { 
        confirmAction({ 
            title: "Eliminar Producto", 
            message: "Esta acción es irreversible. ¿Estás seguro?", 
            onConfirm: async () => { 
                if (product.public_id && config.length) await deleteFromCloudinary(product.public_id, config[0]); 
                await deleteDoc(doc(db, 'productos', product.id)); 
                notify("Eliminado"); 
            } 
        }); 
    };

    const handleBulkImport = async (data) => { 
        const batch = writeBatch(db); 
        data.forEach(item => { 
            const docRef = doc(collection(db, 'productos')); 
            batch.set(docRef, { ...item, created_at: new Date().toISOString(), precio: Number(item.precio), costo: Number(item.costo), ganancia: Number(item.ganancia) }); 
        }); 
        await batch.commit(); notify(`${data.length} importados`); 
    };

    const toggleSelectAll = () => { if (selectedProducts.length === filteredProducts.length) setSelectedProducts([]); else setSelectedProducts(filteredProducts.map(p => p.id)); };
    const toggleSelect = (id) => { if (selectedProducts.includes(id)) setSelectedProducts(prev => prev.filter(p => p !== id)); else setSelectedProducts(prev => [...prev, id]); };
    
    const handleBulkDelete = () => { 
        confirmAction({ 
            title: `Eliminar ${selectedProducts.length} Productos`, 
            message: "Irreversible. ¿Seguro?", 
            onConfirm: async () => { 
                const batch = writeBatch(db); 
                selectedProducts.forEach(id => { const ref = doc(db, 'productos', id); batch.delete(ref); }); 
                await batch.commit(); setSelectedProducts([]); notify("Eliminados"); 
            } 
        }); 
    };

    const filteredProducts = useMemo(() => { 
        let result = products;
        if (filterText) {
            const lowerFilter = filterText.toLowerCase(); 
            result = result.filter(p => (p.marca && p.marca.toLowerCase().includes(lowerFilter)) || (p.modelo && p.modelo.toLowerCase().includes(lowerFilter)) || (p.genero && p.genero.toLowerCase().includes(lowerFilter)) || (p.sku && p.sku.toLowerCase().includes(lowerFilter)) || (p.precio && p.precio.toString().includes(lowerFilter)) || (p.nombre && p.nombre.toLowerCase().includes(lowerFilter))); 
        }
        if (sortConfig.key) {
            result = [...result].sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];
                if (sortConfig.key === 'fecha') {
                    aValue = new Date(aValue || 0).getTime();
                    bValue = new Date(bValue || 0).getTime();
                }
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [products, filterText, sortConfig]);

    if (loading) return <div className="p-10 flex justify-center"><Spinner /></div>;
    
    return (
        <div className="h-full flex flex-col fade-in pb-20 md:pb-0">
            {/* HEADER DE ACCIONES */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex-1 w-full md:w-auto relative">
                    <div className="absolute left-3 top-2.5 text-gray-400"><Icon name="Search" size={18}/></div>
                    <input className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none transition-all placeholder:text-gray-400" placeholder="Buscar producto, SKU, marca..." value={filterText} onChange={(e) => setFilterText(e.target.value)} />
                </div>
                <div className="flex gap-2 items-center w-full md:w-auto justify-end">
                    {selectedProducts.length > 0 ? (
                        <Button variant="danger" onClick={handleBulkDelete} icon="Trash2" className="h-10 px-4">Eliminar ({selectedProducts.length})</Button>
                    ) : (
                        <>
                            <BulkActions type="Inventario" data={products} onImport={handleBulkImport} sampleData={[{ sku: 'TEST1', nombre: 'Ej', marca: 'M', modelo: 'M', costo: 100, precio: 200, genero: 'Unisex' }]} />
                            <Button onClick={() => openModal()} icon="Plus" className="bg-brand-red hover:bg-red-700 text-white shadow-lg shadow-red-500/30 h-10">Nuevo</Button>
                        </>
                    )}
                </div>
            </div>

            {/* TABLA DE INVENTARIO */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
                <div className="overflow-auto flex-1">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs sticky top-0 shadow-sm z-10">
                            <tr>
                                <th className="p-4 w-10 text-center"><input type="checkbox" checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0} onChange={toggleSelectAll} className="w-4 h-4 cursor-pointer accent-brand-red" /></th>
                                <th className="p-4">Img</th>
                                <th onClick={() => handleSort('fecha')} className="p-4 cursor-pointer hover:bg-gray-100 transition-colors select-none"><div className="flex items-center gap-1">Fecha {sortConfig.key === 'fecha' && (<Icon name={sortConfig.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'} size={14} />)}</div></th>
                                <th onClick={() => handleSort('sku')} className="p-4 cursor-pointer hover:bg-gray-100 transition-colors select-none">SKU</th>
                                <th className="p-4">Detalle</th>
                                <th className="p-4">Género</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Costo</th>
                                <th onClick={() => handleSort('precio')} className="p-4 text-right cursor-pointer hover:bg-gray-100 transition-colors select-none">Precio</th>
                                <th className="p-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredProducts.map(p => (
                                <tr key={p.id} className={`hover:bg-gray-50 group cursor-pointer transition-colors ${selectedProducts.includes(p.id) ? 'bg-red-50' : ''}`} onClick={() => openModal(p)}>
                                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedProducts.includes(p.id)} onChange={() => toggleSelect(p.id)} className="w-4 h-4 cursor-pointer accent-brand-red" /></td>
                                    <td className="p-4"><div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden border border-gray-200"><SafeImg src={p.imagen || 'https://via.placeholder.com/40'} className="w-full h-full object-contain" alt={p.modelo} /></div></td>
                                    <td className="p-4 text-xs text-gray-500 whitespace-nowrap font-mono">{p.fecha || '-'}</td>
                                    <td className="p-4 font-mono font-bold text-gray-600 group-hover:text-brand-red transition-colors">{p.sku}</td>
                                    <td className="p-4"><div className="font-bold text-gray-800">{p.marca} {p.modelo}</div><div className="text-xs text-gray-500">{p.nombre}</div></td>
                                    <td className="p-4"><span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">{p.genero}</span></td>
                                    <td className="p-4"><span className={`text-[10px] px-2 py-1 rounded-full font-bold border ${p.status === 'Reemplazado' ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>{p.status || 'Activo'}</span>{p.compartido && <span className="ml-1 text-[10px] px-1 bg-blue-100 text-blue-600 rounded border border-blue-200" title="Compartido">📢</span>}</td>
                                    <td className="p-4 text-right text-gray-400 font-mono text-xs">{formatCurrency(p.costo)}</td>
                                    <td className="p-4 text-right font-bold text-gray-800">{formatCurrency(p.precio)}</td>
                                    <td className="p-4 text-right"><button onClick={(e) => { e.stopPropagation(); handleDelete(p); }} className="text-gray-300 hover:text-brand-red p-2 rounded-lg hover:bg-red-50 transition-colors"><Icon name="Trash2" size={18} /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredProducts.length === 0 && <div className="flex flex-col items-center justify-center p-12 text-gray-400"><Icon name="Package" size={48} className="mb-2 opacity-50"/><p>No se encontraron productos.</p></div>}
                </div>
            </div>
            
            {/* MODAL EDITAR/CREAR */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={form.id ? "Editar Producto" : "Nuevo Producto"}>
                <div className="space-y-5">
                    <ImageUploader image={form.imagen} onFileSelect={handleFile} loading={uploading} onClear={() => setForm({ ...form, imagen: '' })} />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input type="date" label="Fecha" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} />
                        <SmartSelect label="Proveedor" value={form.proveedor_uid} onChange={handleProviderChange} options={providers} displayProp="nombre" valueProp="id" placeholder="Buscar Proveedor..." />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="SKU" value={form.sku} readOnly className="bg-gray-100 font-mono font-bold text-gray-700 cursor-not-allowed" />
                        <SmartSelect label="Género" value={form.genero} onChange={e => setForm({ ...form, genero: e.target.value })} options={['Unisex', 'Hombre', 'Mujer', 'Niños']} placeholder="Seleccionar..." />
                    </div>

                    {/* ALERTA DE DUPLICADOS */}
                    {similarProducts.length > 0 && !form.id && (
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col gap-3">
                            <div className="flex justify-between items-center text-amber-800">
                                <span className="font-bold flex items-center gap-2"><Icon name="AlertTriangle" size={18}/> {similarProducts.length} productos similares encontrados</span>
                                <Button onClick={() => setReplaceModalOpen(true)} className="bg-amber-600 text-white border-none hover:bg-amber-700 text-xs h-8">Ver Candidatos</Button>
                            </div>
                            <div className="text-xs text-amber-700">Revisa si ya existe antes de crearlo. Puedes reemplazar el antiguo.</div>
                        </div>
                    )}
                    {replaceId && (<div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-xs text-blue-800 text-center font-bold flex items-center justify-center gap-2"><Icon name="RefreshCw"/> Sustituyendo producto existente. Se marcará como "Reemplazado".</div>)}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SmartSelect label="Marca" value={form.marca} onChange={e => setForm({ ...form, marca: e.target.value })} options={suggestions.brands} placeholder="Marca..." onCreate={(val) => setForm({...form, marca: val})} />
                        <SmartSelect label="Modelo" value={form.modelo} onChange={e => setForm({ ...form, modelo: e.target.value })} options={suggestions.models} placeholder="Modelo..." onCreate={(val) => setForm({...form, modelo: val})} />
                    </div>
                    <Input label="Nombre Genérico" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
                    
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                        <div className="flex justify-between text-xs text-gray-500 px-1 font-mono">
                            <span>Base: {formatCurrency(form.costo)}</span>
                            <span>+ Envío Máx: {formatCurrency(maxShipping)}</span>
                            <span className="font-bold text-brand-dark">= Ref: {formatCurrency((Number(form.costo) || 0) + maxShipping)}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <NumberInput label="Costo Base" value={form.costo} onChange={e => handleMoneyChange('costo', e.target.value)} />
                            <NumberInput label="Precio Venta" value={form.precio} onChange={e => handleMoneyChange('precio', e.target.value)} />
                            <NumberInput label="Ganancia Real" value={form.ganancia} onChange={e => handleMoneyChange('ganancia', e.target.value)} className="font-bold text-emerald-600 bg-emerald-50 border-emerald-200" />
                        </div>
                    </div>

                    {form.id && (
                        <div className={`flex items-center gap-3 p-4 rounded-xl border ${form.compartido ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                            <input type="checkbox" id="shareStatus" checked={form.compartido} onChange={(e) => setForm({ ...form, compartido: e.target.checked })} className="w-5 h-5 accent-emerald-600 cursor-pointer" />
                            <label htmlFor="shareStatus" className="text-sm font-medium cursor-pointer select-none flex-1">
                                {form.compartido ? <span className="text-emerald-700 font-bold">✅ Ya Compartido (Oculto en cola)</span> : <span className="text-amber-800 font-bold">⏳ Pendiente de Compartir</span>}
                            </label>
                        </div>
                    )}
                    
                    <div className="pt-2 flex justify-end gap-3 border-t border-gray-100">
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={uploading}>Guardar Producto</Button>
                    </div>
                </div>
            </Modal>
            
            {/* MODAL DE SELECCIÓN DE REEMPLAZO (CON FICHA DEL NUEVO ARRIBA) */}
            <Modal isOpen={replaceModalOpen} onClose={() => setReplaceModalOpen(false)} title="Comparar Productos">
                <div className="space-y-4">
                    {/* --- FICHA DEL NUEVO INGRESO (IMAGEN AUMENTADA) --- */}
                    <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex flex-col md:flex-row gap-6 items-center shadow-sm sticky top-0 z-10">
                        <div className="h-48 w-48 bg-white rounded-xl border border-emerald-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                             <SafeImg src={form.imagen || 'https://via.placeholder.com/192?text=Sin+Img'} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <div className="text-xs font-bold text-emerald-700 uppercase mb-2 flex items-center justify-center md:justify-start gap-1"><Icon name="ArrowUpCircle" size={14}/> Nuevo Ingreso</div>
                            <h3 className="font-black text-slate-800 text-2xl mb-1">{form.marca || 'Sin Marca'} {form.modelo || 'Sin Modelo'}</h3>
                            <div className="text-sm text-gray-500 font-medium mb-3">{form.genero || 'Unisex'}</div>
                            <div className="inline-block bg-white border border-emerald-100 px-4 py-2 rounded-lg text-emerald-800 font-bold shadow-sm">
                                Costo: {formatCurrency(form.costo)}
                            </div>
                        </div>
                    </div>

                    <p className="text-sm text-gray-500 px-1 font-bold border-t border-gray-100 pt-4">Toca cualquier tarjeta antigua para ver la comparación detallada:</p>
                    
                    {/* LISTA GRID DE CANDIDATOS ANTIGUOS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto p-1 scrollbar-thin">
                        {similarProducts.map(p => (
                            <div 
                                key={p.id} 
                                onClick={() => setVisualCompare(p)} // CLIC EN TODA LA TARJETA ABRE COMPARACIÓN VISUAL
                                className="border border-gray-200 rounded-xl bg-white hover:shadow-xl hover:border-indigo-300 transition-all cursor-pointer overflow-hidden flex flex-col group relative"
                            >
                                <div className="h-40 bg-gray-100 flex items-center justify-center p-2 relative group-hover:bg-gray-50 transition-colors">
                                    <SafeImg src={p.imagen} className="w-full h-full object-contain mix-blend-multiply" />
                                    <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-[10px] font-bold shadow-sm">{p.sku}</div>
                                </div>
                                
                                <div className="p-3 flex-1 flex flex-col gap-1">
                                    <h4 className="font-bold text-gray-800 text-sm group-hover:text-indigo-600 transition-colors">{p.marca} {p.modelo}</h4>
                                    <div className="flex justify-between items-center text-xs mt-1 border-t border-gray-50 pt-2">
                                        <div className="text-gray-500">Prov: <span className="font-bold text-gray-700">{getProvName(p.proveedor_uid)}</span></div>
                                        <div className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-bold text-[10px]">{p.genero}</div>
                                    </div>
                                    <div className="text-center mt-2">
                                        <span className="bg-gray-50 text-gray-600 px-3 py-1 rounded border border-gray-200 text-xs font-mono">
                                            Costo: <b>{formatCurrency(p.costo)}</b>
                                        </span>
                                    </div>
                                </div>

                                <div className="border-t border-gray-200 p-2 bg-gray-50">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation(); 
                                            handleReplaceSelect(p);
                                        }} 
                                        className={`w-full py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${replaceId === p.id ? 'bg-brand-red text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-brand-red hover:text-white hover:border-brand-red'}`}
                                    >
                                        <Icon name="Check" size={14}/> {replaceId === p.id ? 'Seleccionado para Reemplazo' : 'Elegir para Reemplazo'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>

            {/* OVERLAY: COMPARACIÓN VISUAL DEFINITIVA (SÓLO FOTOS E INFO CLAVE) */}
            {visualCompare && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col animate-fade-in" onClick={() => setVisualCompare(null)}>
                    {/* Header */}
                    <div className="bg-black/50 p-4 flex justify-between items-center text-white backdrop-blur-md absolute top-0 w-full z-10">
                        <h3 className="font-bold text-lg flex items-center gap-2"><Icon name="Eye"/> Comparación Directa</h3>
                        <button onClick={() => setVisualCompare(null)} className="p-2 bg-white/10 rounded-full hover:bg-white/20"><Icon name="X" size={24}/></button>
                    </div>

                    {/* Contenedor Dual */}
                    <div className="flex-1 flex flex-col md:flex-row h-full pt-16 pb-20 overflow-hidden">
                        
                        {/* IZQUIERDA: VIEJO */}
                        <div className="flex-1 flex flex-col items-center justify-center p-4 border-b md:border-b-0 md:border-r border-white/10 bg-neutral-900 relative">
                            <div className="absolute top-4 left-4 bg-red-500/20 text-red-300 border border-red-500/40 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Existente</div>
                            
                            {/* Imagen forzada a misma altura */}
                            <div className="w-full flex-1 flex items-center justify-center mb-4">
                                <SafeImg src={visualCompare.imagen} className="h-64 md:h-96 w-full object-contain bg-white/5 rounded-xl p-2" />
                            </div>

                            {/* Datos Clave */}
                            <div className="bg-white/10 rounded-xl p-4 w-full max-w-sm backdrop-blur-sm border border-white/5">
                                <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                                    <div><span className="text-[10px] text-gray-500 uppercase block">Proveedor</span> <span className="font-bold text-white">{getProvName(visualCompare.proveedor_uid)}</span></div>
                                    <div><span className="text-[10px] text-gray-500 uppercase block">Género</span> <span className="font-bold text-white">{visualCompare.genero}</span></div>
                                    
                                    {/* AQUÍ SE AGREGÓ LA FECHA DE REGISTRO CON CÁLCULO DE DÍAS */}
                                    <div className="col-span-2 md:col-span-1">
                                        <span className="text-[10px] text-gray-500 uppercase block">Fecha Registro</span>
                                        <span className="font-bold text-white mr-1">{visualCompare.fecha || 'N/A'}</span>
                                        <span className="text-[10px] text-amber-400 font-bold">{getDaysAgo(visualCompare.fecha)}</span>
                                    </div>

                                    <div className="border-t border-white/10 pt-2 mt-2 flex justify-between items-center col-span-2 md:col-span-1">
                                        <span className="text-[10px] text-gray-500 uppercase">Costo</span>
                                        <span className="font-mono font-bold text-red-300 text-lg">{formatCurrency(visualCompare.costo)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* DERECHA: NUEVO */}
                        <div className="flex-1 flex flex-col items-center justify-center p-4 bg-neutral-800 relative">
                            <div className="absolute top-4 right-4 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Nuevo Ingreso</div>
                            
                            {/* Imagen forzada a misma altura (Simetría) */}
                            <div className="w-full flex-1 flex items-center justify-center mb-4">
                                <SafeImg src={form.imagen} className="h-64 md:h-96 w-full object-contain bg-white/5 rounded-xl p-2" />
                            </div>

                            {/* Datos Clave */}
                            <div className="bg-white/10 rounded-xl p-4 w-full max-w-sm backdrop-blur-sm border border-white/5">
                                <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                                    <div><span className="text-[10px] text-gray-500 uppercase block">Proveedor</span> <span className="font-bold text-white">{getProvName(form.proveedor_uid)}</span></div>
                                    <div><span className="text-[10px] text-gray-500 uppercase block">Género</span> <span className="font-bold text-white">{form.genero}</span></div>
                                    <div className="col-span-2 border-t border-white/10 pt-2 mt-2 flex justify-between items-center">
                                        <span className="text-[10px] text-gray-500 uppercase">Costo</span>
                                        <span className="font-mono font-bold text-emerald-300 text-lg">{formatCurrency(form.costo)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Flotante */}
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 px-4 z-20">
                        <Button 
                            onClick={(e) => { e.stopPropagation(); handleReplaceSelect(visualCompare); }} 
                            className="bg-brand-red hover:bg-red-600 text-white shadow-xl h-14 px-10 text-lg rounded-full"
                        >
                            <Icon name="Check" size={24}/> Reemplazar con el Nuevo
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryView;