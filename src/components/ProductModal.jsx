import React, { useState, useEffect, useMemo } from 'react';
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
    const str = val.toString();
    const isNegative = str.startsWith('-');
    const num = str.replace(/\D/g, ""); // Quitamos todo lo que no sea número
    const formatted = num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return isNegative ? `-${formatted}` : formatted;
};

const parseInputNumber = (val) => {
    if (!val && val !== 0) return 0;
    const clean = val.toString().replace(/[^\d-]/g, "");
    return Number(clean) || 0;
};

const ProductModal = ({ 
    isOpen, onClose, product, products, providers, 
    config, shipping, notify, onFormUpdate, onReplaceRequest 
}) => {
    const [form, setForm] = useState({});
    const [uploading, setUploading] = useState(false);

    // Solo sincronizamos cuando el modal se ABRE o cambia el producto externo
    useEffect(() => {
        if (isOpen) {
            if (product) {
                setForm(product);
            } else {
                setForm({
                    sku: '', nombre: '', modelo: '', marca: '', precio: 0, costo: 0, 
                    ganancia: 0, imagen: '', genero: 'Unisex', proveedor_uid: '', 
                    fecha: new Date().toISOString().slice(0, 10), status: 'Activo'
                });
            }
        }
    }, [isOpen, product]);

    const similarProducts = useMemo(() => {
        if (form.id || !form.modelo) return [];
        return products.filter(p => 
            p.modelo?.toLowerCase() === form.modelo.toLowerCase() && 
            p.status !== 'archivado' && 
            p.status !== 'Reemplazado'
        );
    }, [form.modelo, form.id, products]);

    // Función unificada para actualizar estado local y avisar al padre SIN bucles
    const updateAll = (nextForm) => {
        setForm(nextForm);
        onFormUpdate?.(nextForm);
    };

    const handleMoneyChange = (field, val) => {
    const num = parseInputNumber(val);
    const maxShip = shipping?.length ? Math.max(...shipping.map(s => Number(s.tarifa) || 0)) : 0;
    
    // Obtenemos los valores actuales del estado para el cálculo
    const currentCost = field === 'costo' ? num : (Number(form.costo) || 0);
    const currentPrice = field === 'precio' ? num : (Number(form.precio) || 0);

    let next = { ...form, [field]: num };

    if (field === 'precio') {
        // GANANCIA = PRECIO - (COSTO + ENVÍO)
        // Si 30.000 - (100.000 + 12.000) = -82.000. Ahora sí dará negativo.
        next.ganancia = num - (currentCost + maxShip);
    } else if (field === 'ganancia') {
        // PRECIO = (COSTO + ENVÍO) + GANANCIA
        // Si quieres ganar -10.000 (perder), el precio bajará solo.
        next.precio = (currentCost + maxShip) + num;
    }

    updateAll(next);
};
    const handleFile = async (file) => {
        if (!file) return;
        let currentSku = form.sku || `TEMP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        
        const localPreview = URL.createObjectURL(file);
        updateAll({ ...form, imagen: localPreview, sku: currentSku });

        if (!config?.[0]) return;
        setUploading(true);
        try {
            const r = await uploadToCloudinary(file, config[0], currentSku);
            updateAll({ ...form, imagen: r.secure_url, public_id: r.public_id, sku: currentSku });
        } catch (e) { notify?.("Error", "error"); }
        finally { setUploading(false); }
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
        } catch (e) { notify?.("Error", "error"); }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={form.id ? "Editar" : "Nuevo"}>
            <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    <Input type="date" label="Fecha" value={form.fecha || ''} onChange={e => updateAll({ ...form, fecha: e.target.value })} />
                    <div className="relative space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Proveedor</label>
                        <SmartSelect 
                            value={form.proveedor_uid} options={providers} displayProp="nombre" valueProp="id" 
                            onChange={e => {
                                const p = providers.find(x => x.id === e.target.value);
                                const sku = (p && !form.id) ? `${p.id_custom}${Math.floor(1000+Math.random()*9000)}` : form.sku;
                                updateAll({ ...form, proveedor_uid: e.target.value, sku });
                            }} 
                        />
                        {form.sku && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black bg-red-50 text-brand-red px-2 py-0.5 rounded border border-red-100">SKU: {form.sku}</span>}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <SmartSelect label="Marca" value={form.marca} options={[...new Set(products.map(x => x.marca))].filter(Boolean)} onChange={e => updateAll({...form, marca: e.target.value})} onCreate={v => updateAll({...form, marca: v})} />
                    <SmartSelect label="Modelo" value={form.modelo} options={[...new Set(products.filter(x => x.marca === form.marca).map(x => x.modelo))].filter(Boolean)} onChange={e => updateAll({...form, modelo: e.target.value})} onCreate={v => updateAll({...form, modelo: v})} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input label="Nombre" value={form.nombre || ''} onChange={e => updateAll({ ...form, nombre: e.target.value })} />
                    <SmartSelect label="Género" value={form.genero || 'Unisex'} options={['Unisex', 'Hombre', 'Mujer', 'Niños']} onChange={e => updateAll({...form, genero: e.target.value})} />
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-3 gap-4">
                    <Input label="Costo" value={formatInputNumber(form.costo)} onChange={e => handleMoneyChange('costo', e.target.value)} />
                    <Input label="Precio" value={formatInputNumber(form.precio)} onChange={e => handleMoneyChange('precio', e.target.value)} />
                    <Input label="Ganancia" value={formatInputNumber(form.ganancia)} onChange={e => handleMoneyChange('ganancia', e.target.value)} className="bg-emerald-50 text-emerald-600 font-bold" />
                </div>

                <div className="pt-2 border-t border-gray-100">
                    <ImageUploader image={form.imagen} onFileSelect={handleFile} loading={uploading} onClear={() => updateAll({ ...form, imagen: '', public_id: '' })} />
                </div>

                {similarProducts.length > 0 && (
                    <div className="bg-amber-50 p-3 rounded-xl flex justify-between items-center animate-pulse border border-amber-200">
                        <span className="text-xs font-bold text-amber-800 flex items-center gap-2"><Icon name="AlertTriangle" size={16}/> Duplicado</span>
                        <button onClick={() => onReplaceRequest(similarProducts)} className="text-[10px] bg-amber-600 text-white px-3 py-1 rounded-lg font-black">COMPARAR</button>
                    </div>
                )}

                <div className="pt-2 flex justify-end gap-3 border-t">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} className="bg-brand-red text-white" disabled={uploading}>Guardar</Button>
                </div>
            </div>
        </Modal>
    );
};

export default ProductModal;