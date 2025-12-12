import React, { useState, useMemo, useEffect } from 'react';
import SafeImg from '../components/SafeImg';
import useCollection from '../hooks/useCollection';
import { useUI } from '../context/UIContext';
import { db, doc, writeBatch, collection, addDoc, updateDoc, deleteDoc } from '../lib/firebase';
import { formatCurrency, uploadToCloudinary, deleteFromCloudinary } from '../lib/utils';
import Button from '../components/Button';
import Icon, { Spinner } from '../components/Icon';
import Modal from '../components/Modal';
import { Input, NumberInput, Select } from '../components/Inputs';
import SmartSelect from '../components/SmartSelect'; // Ahora usamos el Todoterreno
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
    const [replaceModalOpen, setReplaceModalOpen] = useState(false);
    const [replaceId, setReplaceId] = useState(null);
    const [compareProduct, setCompareProduct] = useState(null);

    // Calcular envío máximo para referencia de precios
    const maxShipping = useMemo(() => { 
        if (!shipping.length) return 0; 
        return Math.max(...shipping.map(s => Number(s.tarifa) || 0)); 
    }, [shipping]);

    // Autocompletar marcas y modelos basados en lo que ya existe
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
    
    // Detección de duplicados para sugerir reemplazo
    useEffect(() => { 
        if (form.modelo && !form.id) { 
            const matches = products.filter(p => p.modelo && p.modelo.toLowerCase() === form.modelo.toLowerCase() && p.status !== 'Reemplazado'); 
            setSimilarProducts(matches); 
        } else { 
            setSimilarProducts([]); 
        } 
    }, [form.modelo, products, form.id]);

    // --- ACCIONES ---
    const openModal = (item = null) => { 
        setReplaceId(null); 
        if (item) { setForm({ ...item }); } 
        else { setForm({ sku: '', nombre: '', modelo: '', marca: '', precio: 0, costo: 0, ganancia: 0, imagen: '', genero: 'Unisex', proveedor_uid: '', compartido: false, fecha: new Date().toISOString().slice(0, 10), status: 'Activo' }); } 
        setModalOpen(true); 
    };

    const handleReplaceSelect = (prod) => { setReplaceId(prod.id); setReplaceModalOpen(false); notify(`Sustituyendo a: ${prod.modelo} (${prod.sku})`); };
    
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
        // SmartSelect devuelve e.target.value con el ID
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
        if (!filterText) return products; 
        const lowerFilter = filterText.toLowerCase(); 
        return products.filter(p => (p.marca && p.marca.toLowerCase().includes(lowerFilter)) || (p.modelo && p.modelo.toLowerCase().includes(lowerFilter)) || (p.genero && p.genero.toLowerCase().includes(lowerFilter)) || (p.sku && p.sku.toLowerCase().includes(lowerFilter)) || (p.precio && p.precio.toString().includes(lowerFilter)) || (p.nombre && p.nombre.toLowerCase().includes(lowerFilter))); 
    }, [products, filterText]);

    if (loading) return <div className="p-10 flex justify-center"><Spinner /></div>;
    
    return (
        <div className="h-full flex flex-col fade-in pb-20 md:pb-0">
            {/* HEADER DE ACCIONES */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex-1 w-full md:w-auto relative">
                    <div className="absolute left-3 top-2.5 text-gray-400"><Icon name="Search" size={18}/></div>
                    <input 
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none transition-all placeholder:text-gray-400" 
                        placeholder="Buscar producto, SKU, marca..." 
                        value={filterText} 
                        onChange={(e) => setFilterText(e.target.value)} 
                    />
                </div>
                <div className="flex gap-2 items-center w-full md:w-auto justify-end">
                    {selectedProducts.length > 0 ? (
                        <Button variant="danger" onClick={handleBulkDelete} icon="Trash2" className="h-10 px-4">
                            Eliminar ({selectedProducts.length})
                        </Button>
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
                                <th className="p-4 w-10 text-center">
                                    <input type="checkbox" checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0} onChange={toggleSelectAll} className="w-4 h-4 cursor-pointer accent-brand-red" />
                                </th>
                                <th className="p-4">Img</th>
                                <th className="p-4">SKU</th>
                                <th className="p-4">Detalle</th>
                                <th className="p-4">Género</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Costo</th>
                                <th className="p-4 text-right">Precio</th>
                                <th className="p-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredProducts.map(p => (
                                <tr key={p.id} className={`hover:bg-gray-50 group cursor-pointer transition-colors ${selectedProducts.includes(p.id) ? 'bg-red-50' : ''}`} onClick={() => openModal(p)}>
                                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                                        <input type="checkbox" checked={selectedProducts.includes(p.id)} onChange={() => toggleSelect(p.id)} className="w-4 h-4 cursor-pointer accent-brand-red" />
                                    </td>
                                    <td className="p-4">
                                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                            <SafeImg src={p.imagen || 'https://via.placeholder.com/40'} className="w-full h-full object-contain" alt={p.modelo} />
                                        </div>
                                    </td>
                                    <td className="p-4 font-mono font-bold text-gray-600 group-hover:text-brand-red transition-colors">{p.sku}</td>
                                    <td className="p-4">
                                        <div className="font-bold text-gray-800">{p.marca} {p.modelo}</div>
                                        <div className="text-xs text-gray-500">{p.nombre}</div>
                                    </td>
                                    <td className="p-4"><span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">{p.genero}</span></td>
                                    <td className="p-4">
                                        <span className={`text-[10px] px-2 py-1 rounded-full font-bold border ${p.status === 'Reemplazado' ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                            {p.status || 'Activo'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right text-gray-400 font-mono text-xs">{formatCurrency(p.costo)}</td>
                                    <td className="p-4 text-right font-bold text-gray-800">{formatCurrency(p.precio)}</td>
                                    <td className="p-4 text-right">
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(p); }} className="text-gray-300 hover:text-brand-red p-2 rounded-lg hover:bg-red-50 transition-colors">
                                            <Icon name="Trash2" size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredProducts.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                            <Icon name="Package" size={48} className="mb-2 opacity-50"/>
                            <p>No se encontraron productos.</p>
                        </div>
                    )}
                </div>
            </div>
            
            {/* MODAL EDITAR/CREAR */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={form.id ? "Editar Producto" : "Nuevo Producto"}>
                <div className="space-y-5">
                    <ImageUploader image={form.imagen} onFileSelect={handleFile} loading={uploading} onClear={() => setForm({ ...form, imagen: '' })} />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input type="date" label="Fecha" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} />
                        
                        {/* --- CAMBIO: SmartSelect para Proveedores --- */}
                        <SmartSelect 
                            label="Proveedor" 
                            value={form.proveedor_uid} 
                            onChange={handleProviderChange} 
                            options={providers} 
                            displayProp="nombre" 
                            valueProp="id" 
                            placeholder="Buscar Proveedor..." 
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="SKU" value={form.sku} readOnly className="bg-gray-100 font-mono font-bold text-gray-700 cursor-not-allowed" />
                        {/* Estandarización: Usamos SmartSelect con lista fija */}
<SmartSelect 
    label="Género" 
    value={form.genero} 
    onChange={e => setForm({ ...form, genero: e.target.value })} 
    options={['Unisex', 'Hombre', 'Mujer', 'Niños']} 
    placeholder="Seleccionar..." 
/>
                    </div>

                    {/* ALERTA DE DUPLICADOS */}
                    {similarProducts.length > 0 && !form.id && (
                        <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-sm flex justify-between items-center text-amber-800">
                            <span className="font-medium flex items-center gap-2"><Icon name="AlertTriangle" size={16}/> Hay {similarProducts.length} productos similares.</span>
                            <button onClick={() => setReplaceModalOpen(true)} className="underline font-bold hover:text-amber-900">Ver / Reemplazar</button>
                        </div>
                    )}
                    {replaceId && (<div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-xs text-blue-800 text-center font-bold">Sustituyendo producto existente. Se marcará como "Reemplazado".</div>)}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* --- CAMBIO: SmartSelect para Marca y Modelo --- */}
                        <SmartSelect 
                            label="Marca" 
                            value={form.marca} 
                            onChange={e => setForm({ ...form, marca: e.target.value })} 
                            options={suggestions.brands} 
                            placeholder="Escribe o selecciona..." 
                            onCreate={(val) => setForm({...form, marca: val})} // Permitir nuevas
                        />
                        <SmartSelect 
                            label="Modelo" 
                            value={form.modelo} 
                            onChange={e => setForm({ ...form, modelo: e.target.value })} 
                            options={suggestions.models} 
                            placeholder="Escribe o selecciona..." 
                            onCreate={(val) => setForm({...form, modelo: val})} // Permitir nuevas
                        />
                    </div>
                    <Input label="Nombre Genérico" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
                    
                    {/* PANEL DE PRECIOS */}
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
            
            {/* MODAL DE REEMPLAZO Y COMPARACIÓN SE MANTIENEN IGUAL... */}
            <Modal isOpen={replaceModalOpen} onClose={() => setReplaceModalOpen(false)} title="Productos Similares">
                <div className="space-y-3">
                    <p className="text-sm text-gray-500">Selecciona un producto antiguo para reemplazarlo con este nuevo ingreso.</p>
                    {similarProducts.map(p => (
                        <div key={p.id} className="relative border rounded-xl hover:bg-gray-50 cursor-pointer bg-white shadow-sm transition-all group">
                            <div className="p-3 flex gap-4 items-center" onClick={() => setCompareProduct(p)}>
                                <div className="relative">
                                    <SafeImg src={p.imagen} className="w-12 h-12 object-cover rounded-lg bg-gray-100" />
                                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md"><Icon name="Search" size={10} className="text-brand-red" /></div>
                                </div>
                                <div className="flex-1 text-sm">
                                    <div className="font-bold text-gray-800">{p.marca} {p.modelo}</div>
                                    <div className="text-xs text-gray-500 mt-1 flex gap-2">
                                        <span className="font-mono text-rose-600">Costo: {formatCurrency(p.costo)}</span>
                                        <span className="text-gray-300">|</span>
                                        <span className="font-mono text-gray-600">Venta: {formatCurrency(p.precio)}</span>
                                    </div>
                                </div>
                                <Button className="h-8 text-xs px-3" variant={replaceId === p.id ? 'success' : 'secondary'} onClick={(e) => { e.stopPropagation(); handleReplaceSelect(p); }}>
                                    {replaceId === p.id ? 'Elegido' : 'Reemplazar'}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </Modal>

            {compareProduct && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-brand-dark/90 backdrop-blur-sm" onClick={() => setCompareProduct(null)}>
                    <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-3xl w-full flex flex-col gap-6" onClick={e => e.stopPropagation()}>
                        <h3 className="font-bold text-xl text-center border-b pb-4">Comparación Visual</h3>
                        <div className="grid grid-cols-2 gap-8">
                            <div className="text-center opacity-60">
                                <span className="text-xs font-bold text-gray-500 uppercase mb-2 block tracking-wider">Registrado (Anterior)</span>
                                <div className="h-64 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200 mb-3">
                                    <SafeImg src={compareProduct.imagen} className="w-full h-full object-contain mix-blend-multiply" />
                                </div>
                                <p className="font-mono font-bold text-gray-800">{compareProduct.sku}</p>
                            </div>
                            <div className="text-center relative">
                                <span className="text-xs font-bold text-emerald-600 uppercase mb-2 block tracking-wider">Nuevo Ingreso</span>
                                <div className="h-64 bg-white rounded-xl flex items-center justify-center border-2 border-emerald-400 shadow-xl mb-3 relative z-10">
                                    <SafeImg src={form.imagen || 'https://via.placeholder.com/150?text=Sin+Imagen'} className="w-full h-full object-contain" />
                                </div>
                                <p className="font-bold text-emerald-600">Nuevo Producto</p>
                            </div>
                        </div>
                        <Button onClick={() => setCompareProduct(null)} className="w-full h-12">Cerrar Comparación</Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryView;