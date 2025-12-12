import React, { useState, useMemo } from 'react';
import Modal from '../Modal';
import Button from '../Button';
import { Input, NumberInput, Select } from '../Inputs';
import ImageUploader from '../ImageUploader';
import Icon from '../Icon';
import SmartSelect from '../SmartSelect'; 
import { uploadToCloudinary, formatCurrency } from '../../lib/utils';
import SafeImg from '../SafeImg';

const QuoteModal = ({ 
    isOpen, 
    onClose, 
    productsList, 
    shippingOptions, 
    cloudConfig,
    clientHistory, 
    onSave 
}) => {
    const [uploading, setUploading] = useState(false);
    
    // Estados del formulario
    const [client, setClient] = useState({ nombre: '', telefono: '', ciudad_entrega: '' });
    const [product, setProduct] = useState({ sku: '', modelo: '', marca: '', costo: '', precio: '', genero: 'Unisex', imagen: '' });
    
    // Buscador de producto
    const [searchQuery, setSearchQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    // --- NUEVO: Buscador de Nombres de Cliente ---
    const [showClientSuggestions, setShowClientSuggestions] = useState(false);
    
    // Filtramos clientes por nombre
    const filteredClients = useMemo(() => {
        if (!client.nombre) return [];
        // Convertimos el historial (objeto) a array para filtrar
        return Object.values(clientHistory || {}).filter(c => 
            c.nombre.toLowerCase().includes(client.nombre.toLowerCase())
        );
    }, [clientHistory, client.nombre]);

    // Al seleccionar un cliente de la lista de nombres
    const selectClient = (c) => {
        setClient({
            nombre: c.nombre,
            telefono: c.telefono,
            ciudad_entrega: c.ciudad_entrega
        });
        setShowClientSuggestions(false);
    };

    // --- LÓGICA DE TELÉFONO (Se mantiene) ---
    const handlePhoneChange = (e) => {
        const val = e.target.value;
        const found = clientHistory[val];
        
        if (found) {
            setClient({
                telefono: val,
                nombre: found.nombre || '',
                ciudad_entrega: found.ciudad_entrega || ''
            });
        } else {
            setClient(prev => ({ ...prev, telefono: val }));
        }
    };

    // --- LÓGICA DE PRODUCTOS ---
    const filteredProducts = useMemo(() => {
        if (!searchQuery) return [];
        return productsList.filter(p => 
            (p.modelo && p.modelo.toLowerCase().includes(searchQuery.toLowerCase())) || 
            (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (p.marca && p.marca.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [productsList, searchQuery]);

    const selectProduct = (p) => {
        setProduct({
            sku: p.sku,
            modelo: p.modelo,
            marca: p.marca,
            costo: p.costo,
            precio: p.precio,
            genero: p.genero,
            imagen: p.imagen,
            isExisting: true
        });
        setSearchQuery(''); 
        setShowSuggestions(false);
        setHighlightedIndex(0);
    };

    const handleProductKeyDown = (e) => {
        if (!showSuggestions || filteredProducts.length === 0) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex(prev => Math.min(prev + 1, filteredProducts.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredProducts[highlightedIndex]) selectProduct(filteredProducts[highlightedIndex]);
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    const handleFile = async (file) => {
        if (!cloudConfig.cloud_name) return alert("Falta config Cloudinary");
        setUploading(true);
        try {
            const res = await uploadToCloudinary(file, cloudConfig, `QUOTE-${Date.now()}`);
            setProduct(prev => ({ ...prev, imagen: res.secure_url }));
        } catch (e) { console.error(e); }
        setUploading(false);
    };

    const handleSubmit = () => {
        if (!client.nombre || !product.modelo) return alert("Faltan datos");
        onSave({
            cliente: client,
            producto: product,
            fecha: new Date().toISOString(),
            estado: 'Pendiente'
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Cotizar / Buscar Producto">
            <div className="space-y-6">
                
                {/* 1. DATOS CLIENTE */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                    <h4 className="text-xs font-bold text-gray-500 uppercase flex gap-2"><Icon name="User" size={14}/> Cliente Interesado</h4>
                    <div className="grid grid-cols-2 gap-3">
                        {/* Teléfono */}
                        <div className="flex flex-col gap-1 w-full">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Teléfono</label>
                            <input 
                                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-brand-red focus:ring-2 focus:ring-red-100 outline-none transition-all"
                                list="quote-phones" 
                                value={client.telefono} 
                                onChange={handlePhoneChange}
                                placeholder="Escribe para buscar..."
                            />
                            <datalist id="quote-phones">
                                {Object.values(clientHistory || {}).map((c, i) => (
                                    <option key={i} value={c.telefono}>{c.nombre} - {c.ciudad_entrega}</option>
                                ))}
                            </datalist>
                        </div>
                        
                        {/* Nombre (CON BUSCADOR MEJORADO) */}
                        <div className="relative">
                             <Input 
                                label="Nombre" 
                                value={client.nombre} 
                                onChange={e => { setClient({...client, nombre: e.target.value}); setShowClientSuggestions(true); }}
                                onFocus={() => setShowClientSuggestions(true)}
                                // Cerrar sugerencias con delay para permitir clic
                                onBlur={() => setTimeout(() => setShowClientSuggestions(false), 200)}
                            />
                            {/* Lista de Sugerencias de Nombres (Estilo Flotante) */}
                            {showClientSuggestions && client.nombre && filteredClients.length > 0 && (
                                <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 shadow-xl rounded-lg z-20 max-h-40 overflow-y-auto">
                                    {filteredClients.map((c, i) => (
                                        <div 
                                            key={i} 
                                            onClick={() => selectClient(c)}
                                            className="px-3 py-2 hover:bg-red-50 cursor-pointer text-sm border-b border-gray-50 last:border-0"
                                        >
                                            <div className="font-bold text-gray-800">{c.nombre}</div>
                                            <div className="text-xs text-gray-500">{c.telefono} • {c.ciudad_entrega}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <SmartSelect label="Ciudad Destino" value={client.ciudad_entrega} onChange={e => setClient({...client, ciudad_entrega: e.target.value})} options={shippingOptions} displayProp="ciudad" valueProp="ciudad" placeholder="Ciudad..." />
                </div>

                {/* 2. DATOS PRODUCTO */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold text-gray-500 uppercase flex gap-2"><Icon name="Search" size={14}/> ¿Qué busca?</h4>
                        {!product.isExisting && <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Producto Nuevo / No Registrado</span>}
                    </div>

                    {/* Buscador de Productos (Con mt-1 en lista) */}
                    <div className="relative">
                        <div className="absolute left-3 top-2.5 text-gray-400"><Icon name="Search" size={16}/></div>
                        <input 
                            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-red" 
                            placeholder="Buscar SKU, Marca o Modelo..." 
                            value={searchQuery} 
                            onChange={e => { setSearchQuery(e.target.value); setShowSuggestions(true); setHighlightedIndex(0); }}
                            onFocus={() => setShowSuggestions(true)}
                            onKeyDown={handleProductKeyDown}
                        />
                        
                        {showSuggestions && searchQuery && (
                            <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 shadow-xl rounded-b-xl z-20 max-h-48 overflow-y-auto scrollbar-thin">
                                {filteredProducts.map((p, i) => (
                                    <div 
                                        key={p.id} 
                                        onClick={() => selectProduct(p)} 
                                        className={`flex items-center gap-3 p-2 cursor-pointer transition-colors border-b border-gray-50 last:border-0 ${i === highlightedIndex ? 'bg-red-50' : 'hover:bg-gray-50'}`}
                                        onMouseEnter={() => setHighlightedIndex(i)}
                                    >
                                        <SafeImg src={p.imagen} className="w-10 h-10 rounded bg-gray-100 object-cover" />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-gray-800 truncate">{p.modelo}</div>
                                            <div className="text-xs text-gray-500">{p.marca} • {p.sku}</div>
                                        </div>
                                        <div className="text-xs font-bold text-brand-red">{formatCurrency(p.precio)}</div>
                                    </div>
                                ))}
                                {filteredProducts.length === 0 && (
                                    <div className="p-3 text-center text-xs text-gray-400">No encontrado. Llena los datos manuales.</div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="h-40">
                            <ImageUploader image={product.imagen} onFileSelect={handleFile} loading={uploading} onClear={() => setProduct({...product, imagen: ''})} />
                        </div>
                        <div className="space-y-2">
                            <Input label="Modelo" value={product.modelo} onChange={e => setProduct({...product, modelo: e.target.value})} placeholder="Ej: Nike Air..." />
                            <div className="grid grid-cols-2 gap-2">
                                <Input label="Marca" value={product.marca} onChange={e => setProduct({...product, marca: e.target.value})} />
                                <Select label="Género" value={product.genero} onChange={e => setProduct({...product, genero: e.target.value})}>
                                    <option>Unisex</option><option>Hombre</option><option>Mujer</option>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <NumberInput label="Costo Aprox" value={product.costo} onChange={e => setProduct({...product, costo: e.target.value})} />
                                <NumberInput label="Precio Venta" value={product.precio} onChange={e => setProduct({...product, precio: e.target.value})} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={uploading} className="bg-brand-red text-white shadow-lg">Guardar Cotización</Button>
                </div>
            </div>
        </Modal>
    );
};

export default QuoteModal;