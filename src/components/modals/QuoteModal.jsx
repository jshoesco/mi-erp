import React, { useState, useMemo } from 'react';
import Modal from '../Modal';
import Button from '../Button';
import { Input, NumberInput, Select } from '../Inputs';
import ImageUploader from '../ImageUploader';
import Icon from '../Icon';
import SmartSelect from '../SmartSelect'; // Ahora es el Todoterreno
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
    const [client, setClient] = useState({ nombre: '', telefono: '', ciudad_entrega: '' });
    const [product, setProduct] = useState({ sku: '', modelo: '', marca: '', costo: '', precio: '', genero: 'Unisex', imagen: '' });

    // --- PREPARAR DATOS PARA LISTAS ---
    
    // 1. Clientes (Convertir objeto historial a array)
    const clientList = useMemo(() => Object.values(clientHistory || {}), [clientHistory]);

    // --- MANEJADORES ---
    
    // Selección de Cliente (Funciona igual para Teléfono o Nombre gracias a SmartSelect)
    const handleClientSelect = (e) => {
        // SmartSelect nos devuelve el objeto completo en e.target.object
        const c = e.target.object; 
        if (c) {
            setClient({
                nombre: c.nombre,
                telefono: c.telefono,
                ciudad_entrega: c.ciudad_entrega
            });
        } else {
            // Si escribió algo nuevo
             setClient(prev => ({ ...prev, [e.target.name]: e.target.value }));
        }
    };

    // Selección de Producto
    const handleProductSelect = (e) => {
        const p = e.target.object;
        if (p) {
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
        onSave({ cliente: client, producto: product, fecha: new Date().toISOString(), estado: 'Pendiente' });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Cotizar / Buscar Producto">
            <div className="space-y-6">
                
                {/* 1. DATOS CLIENTE */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                    <h4 className="text-xs font-bold text-gray-500 uppercase flex gap-2"><Icon name="User" size={14}/> Cliente Interesado</h4>
                    <div className="grid grid-cols-2 gap-3">
                        
                        {/* BUSCADOR DE TELÉFONO (Usando SmartSelect) */}
                        <SmartSelect 
                            label="Teléfono"
                            placeholder="Buscar..."
                            options={clientList}
                            value={client.telefono}
                            onChange={(e) => {
                                // Truco: Pasamos el evento a nuestro manejador genérico, indicando qué campo es
                                e.target.name = 'telefono'; 
                                handleClientSelect(e);
                            }}
                            // Buscamos por teléfono y por nombre
                            searchFields={['telefono', 'nombre']} 
                            displayProp="telefono"
                            valueProp="telefono"
                            // Diseño personalizado para la lista de teléfonos
                            renderItem={(c, isSelected) => (
                                <div className={`px-4 py-2 text-sm ${isSelected ? 'text-brand-red' : 'text-gray-700'}`}>
                                    <div className="font-mono font-bold">{c.telefono}</div>
                                    <div className="text-xs text-gray-500">{c.nombre}</div>
                                </div>
                            )}
                        />
                        
                        {/* BUSCADOR DE NOMBRE (Usando SmartSelect) */}
                        <SmartSelect 
                            label="Nombre"
                            placeholder="Escribe nombre..."
                            options={clientList}
                            value={client.nombre}
                            onChange={(e) => {
                                e.target.name = 'nombre';
                                handleClientSelect(e);
                            }}
                            searchFields={['nombre', 'telefono']}
                            displayProp="nombre"
                            valueProp="nombre"
                            // Diseño simple para nombres
                            renderItem={(c, isSelected) => (
                                <div className={`px-4 py-2 text-sm ${isSelected ? 'text-brand-red' : 'text-gray-700'}`}>
                                    <div className="font-bold">{c.nombre}</div>
                                    <div className="text-xs text-gray-400">{c.ciudad_entrega}</div>
                                </div>
                            )}
                        />
                    </div>
                    
                    {/* CIUDAD (Lista simple) */}
                    <SmartSelect 
                        label="Ciudad Destino" 
                        value={client.ciudad_entrega} 
                        onChange={e => setClient({...client, ciudad_entrega: e.target.value})} 
                        options={shippingOptions} 
                        displayProp="ciudad" 
                        valueProp="ciudad" 
                        placeholder="Ciudad..." 
                    />
                </div>

                {/* 2. DATOS PRODUCTO */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold text-gray-500 uppercase flex gap-2"><Icon name="Search" size={14}/> ¿Qué busca?</h4>
                        {!product.isExisting && <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Producto Nuevo</span>}
                    </div>

                    {/* BUSCADOR DE PRODUCTOS (Modo Rico) */}
                    <SmartSelect
                        placeholder="Buscar SKU, Marca o Modelo..."
                        options={productsList}
                        value={product.modelo} // Mostramos el modelo si se selecciona
                        onChange={handleProductSelect}
                        searchFields={['sku', 'modelo', 'marca']} // Busca en todo
                        displayProp="modelo"
                        valueProp="id"
                        // DISEÑO PERSONALIZADO (El que pediste)
                        renderItem={(p, isSelected) => (
                            <div className={`flex items-center gap-3 p-2 border-b border-gray-50 last:border-0 ${isSelected ? 'bg-red-50' : ''}`}>
                                <SafeImg src={p.imagen} className="w-10 h-10 rounded bg-gray-100 object-cover" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-gray-800 truncate">{p.modelo}</div>
                                    <div className="text-xs text-gray-500 flex gap-1">
                                        <span>{p.marca}</span> • <span className="font-mono">{p.sku}</span>
                                    </div>
                                </div>
                                <div className="text-xs font-bold text-brand-red">{formatCurrency(p.precio)}</div>
                            </div>
                        )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="h-40">
                            <ImageUploader image={product.imagen} onFileSelect={handleFile} loading={uploading} onClear={() => setProduct({...product, imagen: ''})} />
                        </div>
                        <div className="space-y-2">
                            <Input label="Modelo" value={product.modelo} onChange={e => setProduct({...product, modelo: e.target.value})} placeholder="Ej: Nike Air..." />
                            <div className="grid grid-cols-2 gap-2">
                                <Input label="Marca" value={product.marca} onChange={e => setProduct({...product, marca: e.target.value})} />
<SmartSelect 
    label="Género" 
    value={product.genero} 
    onChange={e => setProduct({...product, genero: e.target.value})} 
    options={['Unisex', 'Hombre', 'Mujer', 'Niños']} 
    placeholder="Seleccionar..." 
/>
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