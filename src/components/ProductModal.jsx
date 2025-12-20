import React, { useState, useEffect, useMemo } from 'react'; // CORREGIDO: useMemo añadido
import Modal from './Modal';
import { Input } from './Inputs';
import Button from './Button';
import Icon from './Icon';
import SmartSelect from './SmartSelect';
import ImageUploader from './ImageUploader';
import { uploadToCloudinary } from '../lib/utils';
import { db, doc, updateDoc, collection, addDoc } from '../lib/firebase';

const formatInputNumber = (val) => {
    if (!val && val !== 0) return '';
    const num = val.toString().replace(/\D/g, "");
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parseInputNumber = (val) => {
    if (!val) return 0;
    return Number(val.toString().replace(/\./g, ""));
};

const ProductModal = ({ 
    isOpen, 
    onClose, 
    product, 
    products, 
    providers, 
    config, 
    shipping, 
    notify, 
    onFormUpdate, 
    onReplaceRequest 
}) => {
    const [form, setForm] = useState({});
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (product) {
            setForm(product);
        } else {
            setForm({
                sku: '', nombre: '', modelo: '', marca: '', precio: 0, costo: 0, 
                ganancia: 0, imagen: '', genero: 'Unisex', proveedor_uid: '', 
                fecha: new Date().toISOString().slice(0, 10), status: 'Activo'
            });
        }
    }, [product, isOpen]);

    const similarProducts = useMemo(() => {
        if (form.id || !form.modelo) return [];
        return products.filter(p => 
            p.modelo?.toLowerCase() === form.modelo.toLowerCase() && 
            p.status !== 'archivado' && 
            p.status !== 'Reemplazado'
        );
    }, [form.modelo, form.id, products]);

    const handleMoneyChange = (field, val) => {
        const num = parseInputNumber(val);
        const maxShip = shipping?.length ? Math.max(...shipping.map(s => Number(s.tarifa) || 0)) : 0;
        
        setForm(prev => {
            const next = { ...prev, [field]: num };
            const cost = field === 'costo' ? num : (Number(prev.costo) || 0);
            if (field === 'precio') next.ganancia = num - (cost + maxShip);
            if (field === 'ganancia') next.precio = (cost + maxShip) + num;
            onFormUpdate?.(next);
            return next;
        });
    };

    const handleFile = async (file) => {
    if (!file) return;

    let currentSku = form.sku;
    if (!currentSku) {
        currentSku = `TEMP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const tempState = { ...form, sku: currentSku };
        setForm(tempState);
        onFormUpdate?.(tempState);
    }

    const localPreview = URL.createObjectURL(file);
    setForm(prev => ({ ...prev, imagen: localPreview }));

    if (!config?.[0]) {
        notify?.("Configuración de nube no disponible", "error");
        return;
    }

    setUploading(true);
    try {
        const r = await uploadToCloudinary(file, config[0], currentSku);
        
        const finalState = { ...form, imagen: r.secure_url, public_id: r.public_id, sku: currentSku };
        setForm(finalState);
        onFormUpdate?.(finalState);
    } catch (e) {
        notify?.("Error al subir", "error");
    } finally {
        setUploading(false);
    }
};

    const handleSave = async () => {
        try {
            if (form.id) {
                await updateDoc(doc(db, 'productos', form.id), form);
            } else {
                await addDoc(collection(db, 'productos'), { ...form, created_at: new Date().toISOString() });
            }
            onClose();
            notify?.("Guardado");
        } catch (e) {
            notify?.("Error", "error");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={form.id ? "Editar Producto" : "Nuevo Producto"}>
            <div className="space-y-5">
                {/* 1. DATOS DE ORIGEN Y FECHA */}
                <div className="grid grid-cols-2 gap-4">
                    <Input 
                        type="date" 
                        label="Fecha de Ingreso" 
                        value={form.fecha || ''} 
                        onChange={e => {
                            const next = { ...form, fecha: e.target.value };
                            setForm(next);
                            onFormUpdate?.(next);
                        }} 
                    />
                    <div className="relative space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Proveedor</label>
                        <div className="relative">
                            <SmartSelect 
                                value={form.proveedor_uid} 
                                options={providers} 
                                displayProp="nombre" 
                                valueProp="id" 
                                onChange={e => {
                                    const p = providers.find(x => x.id === e.target.value);
                                    if(p && !form.id) {
                                        const sku = `${p.id_custom}${Math.floor(1000+Math.random()*9000)}`;
                                        const next = { ...form, proveedor_uid: p.id, sku };
                                        setForm(next);
                                        onFormUpdate?.(next);
                                    } else {
                                        const next = { ...form, proveedor_uid: e.target.value };
                                        setForm(next);
                                        onFormUpdate?.(next);
                                    }
                                }} 
                            />
                            {form.sku && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black bg-red-50 text-brand-red px-2 py-0.5 rounded border border-red-100">
                                    SKU: {form.sku}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. ESPECIFICACIONES DEL PRODUCTO */}
                <div className="grid grid-cols-2 gap-4">
                    <SmartSelect 
                        label="Marca" 
                        value={form.marca} 
                        options={[...new Set(products.map(x => x.marca))].filter(Boolean)} 
                        onChange={e => {
                            const next = {...form, marca: e.target.value};
                            setForm(next);
                            onFormUpdate?.(next);
                        }} 
                        onCreate={v => {
                            const next = {...form, marca: v};
                            setForm(next);
                            onFormUpdate?.(next);
                        }} 
                    />
                    <SmartSelect 
                        label="Modelo" 
                        value={form.modelo} 
                        options={[...new Set(products.filter(x => x.marca === form.marca).map(x => x.modelo))].filter(Boolean)} 
                        onChange={e => {
                            const next = {...form, modelo: e.target.value};
                            setForm(next);
                            onFormUpdate?.(next);
                        }} 
                        onCreate={v => {
                            const next = {...form, modelo: v};
                            setForm(next);
                            onFormUpdate?.(next);
                        }} 
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input 
                        label="Nombre / Referencia" 
                        value={form.nombre || ''} 
                        onChange={e => {
                            const next = { ...form, nombre: e.target.value };
                            setForm(next);
                            onFormUpdate?.(next);
                        }} 
                    />
                    <SmartSelect 
                        label="Género" 
                        value={form.genero || 'Unisex'} 
                        options={['Unisex', 'Hombre', 'Mujer', 'Niños']} 
                        onChange={e => {
                            const next = {...form, genero: e.target.value};
                            setForm(next);
                            onFormUpdate?.(next);
                        }} 
                    />
                </div>

                {/* 3. FINANZAS */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-3 gap-4">
                    <Input label="Costo" value={formatInputNumber(form.costo)} onChange={e => handleMoneyChange('costo', e.target.value)} />
                    <Input label="Precio Venta" value={formatInputNumber(form.precio)} onChange={e => handleMoneyChange('precio', e.target.value)} />
                    <Input label="Ganancia Est." value={formatInputNumber(form.ganancia)} readOnly className="bg-emerald-50 text-emerald-600 font-bold" />
                </div>

                {/* 4. IMAGEN (POSICIÓN ESTRATÉGICA AL FINAL) */}
                <div className="pt-2 border-t border-gray-100">
                    <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block tracking-widest">Multimedia del Producto</label>
                    <ImageUploader 
                        image={form.imagen} 
                        onFileSelect={handleFile} 
                        loading={uploading} 
                        onClear={() => {
                            const cleared = { ...form, imagen: '', public_id: '' };
                            setForm(cleared);
                            onFormUpdate?.(cleared);
                        }} 
                    />
                </div>

                {/* ALERTAS Y ACCIONES */}
                {similarProducts.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex justify-between items-center animate-pulse shadow-sm">
                        <span className="text-xs font-bold text-amber-800 flex items-center gap-2">
                            <Icon name="AlertTriangle" size={16}/> Modelo duplicado detectado
                        </span>
                        <button 
                            onClick={() => onReplaceRequest(similarProducts)} 
                            className="text-[10px] bg-amber-600 text-white px-3 py-1 rounded-lg font-black hover:bg-amber-700 transition-colors shadow-sm"
                        >
                            COMPARAR Y REEMPLAZAR
                        </button>
                    </div>
                )}

                <div className="pt-2 flex justify-end gap-3 border-t border-gray-100">
                    <Button variant="secondary" onClick={onClose} className="px-6">Cancelar</Button>
                    <Button onClick={handleSave} className="bg-brand-red text-white px-8" disabled={uploading}>
                        {uploading ? 'Subiendo...' : 'Confirmar y Guardar'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ProductModal;