import React, { useMemo } from 'react';
import { useProductForm } from '../hooks/useProductForm';
import useCollection from '../../../hooks/useCollection';
import { TOKENS } from '../../../theme/constants';

// --- IMPORTACIONES DEL SISTEMA GENÉRICO ---
import ModalLayout from '../../ui/layout/ModalLayout';
import { Input, NumberInput } from '../../ui/forms/Controls';
import { Select } from '../../ui/forms/Select';
import { Button } from '../../ui/display/Button';
import { TextLabel, PriceText } from '../../ui/display/Typography';
import Dropzone from '../../ui/Dropzone';
import Icon from '../../ui/display/Icon';

const ProductModal = ({ isOpen, onClose, onSave, initialData = null, allProducts = [], mapping }) => {
    const { data: lines } = useCollection(mapping?.coll_lines || 'config_lineas');
    const { data: allProviders } = useCollection(mapping?.coll_providers || 'proveedores');

    const {
        formData,
        setFormData,
        handlePricing,
        originalSkuRef,
        availableBrands,
        availableModels
    } = useProductForm(initialData, isOpen, allProducts);

    // --- CEREBRO DE AUTO-LLENADO ---
    // Creamos un mapa donde cada modelo conoce su marca
    const allExistingModels = useMemo(() => {
        return [...new Set(allProducts.map(p => p.modelo?.toUpperCase()))].filter(Boolean);
    }, [allProducts]);


    const modelToBrandMap = useMemo(() => {
        const map = {};
        allProducts.forEach(p => {
            if (p.modelo && p.marca) {
                map[p.modelo.toUpperCase()] = p.marca.toUpperCase();
            }
        });
        return map;
    }, [allProducts]);

    const handleBrandChange = (e) => {
        const newBrand = e.target.value.toUpperCase();
        // Verificamos si el modelo actual existe en la nueva marca
        const modelExistsInNewBrand = allProducts.some(p =>
            p.marca?.toUpperCase() === newBrand &&
            p.modelo?.toUpperCase() === formData.modelo?.toUpperCase()
        );

        setFormData(prev => ({
            ...prev,
            marca: newBrand,
            modelo: modelExistsInNewBrand ? prev.modelo : '' // Limpia si no coincide
        }));
    };

    const handleModelChange = (e) => {
        const val = e.target.value.toUpperCase();
        const autoBrand = modelToBrandMap[val];
        if (autoBrand) {
            setFormData(prev => ({ ...prev, modelo: val, marca: autoBrand }));
        } else {
            setFormData(prev => ({ ...prev, modelo: val }));
        }
    };

    const filteredProviders = useMemo(() => {
        if (!formData.linea) return [];
        return allProviders.filter(p => p.lineas && Array.isArray(p.lineas) && p.lineas.includes(formData.linea));
    }, [formData.linea, allProviders]);

    const handleProviderChange = (e) => {
        const selectedName = e.target.value;
        const p = filteredProviders.find(x => x.nombre === selectedName);
        if (!p) return setFormData(prev => ({ ...prev, proveedor_uid: '', proveedor_nombre: '', sku: '' }));

        const prefix = p.id_custom || p.id;
        const newSku = (originalSkuRef.current && originalSkuRef.current.startsWith(prefix))
            ? originalSkuRef.current
            : `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

        setFormData(prev => ({
            ...prev,
            proveedor_uid: p.id_custom || p.id,
            proveedor_nombre: p.nombre,
            sku: newSku
        }));
    };

    const handleSubmit = async () => {
        if (!formData.linea || !formData.proveedor_nombre) return alert("Línea y Proveedor requeridos");
        const success = await onSave(formData);
        if (success) onClose();
    };

    return (
        <ModalLayout
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? "Ficha de Producto" : "Nuevo Registro"}
            size="max-w-3xl"
            actions={
                <Button onClick={handleSubmit} variant="brand" className="px-12 h-14" icon="Save">
                    {initialData ? "ACTUALIZAR" : "GUARDAR"}
                </Button>
            }
        >
            <div className={`space-y-10 ${TOKENS.animation.fade} pb-6`}>

                {/* IDENTIDAD VISUAL Y TÍTULO */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                    <div className="md:col-span-1">
                        <Dropzone label="Multimedia" value={formData.imagen} onChange={(url) => setFormData(prev => ({ ...prev, imagen: url }))} />
                    </div>
                    <div className="md:col-span-2 space-y-6">
                        <div className={`flex bg-brand-light/50 p-1.5 ${TOKENS.radius.inner} border border-brand-light shadow-inner`}>
                            {['stock', 'dropshipping'].map((t) => (
                                <button key={t} onClick={() => setFormData({ ...formData, tipo: t })}
                                    className={`flex-1 py-3 ${TOKENS.text.tiny} ${TOKENS.radius.button} transition-all ${formData.tipo === t ? 'bg-brand-dark text-white shadow-lg' : 'text-brand-gray/40'}`}>
                                    {t === 'stock' ? 'INVENTARIO REAL' : 'SOBREPEDIDO'}
                                </button>
                            ))}
                        </div>
                        <Input label="Título del Producto" placeholder="Ej: Nike Air Jordan 1" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Select label="Línea de Negocio" options={lines.map(l => ({ label: l.nombre, value: l.nombre }))} value={formData.linea} onChange={e => setFormData({ ...formData, linea: e.target.value, proveedor_uid: '', proveedor_nombre: '', sku: '' })} />
                    <div className="relative">
                        <Select label="Proveedor" options={filteredProviders.map(p => ({ label: p.nombre, value: p.nombre }))} value={formData.proveedor_nombre} onChange={handleProviderChange} />
                        {formData.sku && <div className="absolute -top-1 right-0"><span className={`bg-brand-dark text-white px-3 py-1 ${TOKENS.radius.inner} ${TOKENS.text.tiny}`}>SKU: {formData.sku}</span></div>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Select
                        label="Marca"
                        options={availableBrands}
                        value={formData.marca}
                        allowCustom={true}
                        onChange={handleBrandChange} // <--- Usa la nueva función
                    />

                    <Select
                        label="Versión / Modelo"
                        options={formData.marca ? availableModels : allExistingModels}
                        value={formData.modelo}
                        allowCustom={true}
                        onChange={handleModelChange}
                    />
                </div>

                {/* COSTOS Y LOGÍSTICA (Igual que antes) */}
                <div className={`grid grid-cols-3 gap-8 bg-brand-light/30 p-10 ${TOKENS.radius.card} border border-brand-light shadow-inner relative overflow-hidden`}>
                    <div className="absolute top-0 left-0 w-1 h-full bg-brand-red opacity-50" />
                    <NumberInput label="Costo Base" value={formData.costo} onChange={e => handlePricing('costo', e.target.value)} />
                    <NumberInput label="Utilidad (%)" value={formData.ganancia} onChange={e => handlePricing('ganancia', e.target.value)} />
                    <div className="flex flex-col items-end justify-center">
                        <TextLabel className="text-brand-red font-black">Precio de Venta</TextLabel>
                        <PriceText className="text-brand-dark font-black text-3xl" value={formData.precio} />
                    </div>
                </div>

                {formData.tipo === 'stock' && (
                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 p-8 border border-brand-light ${TOKENS.radius.card} bg-white/50`}>
                        <NumberInput label="Stock Actual" value={formData.stock_actual} onChange={e => setFormData({ ...formData, stock_actual: Number(e.target.value) })} />
                        <Input label="Ubicación" placeholder="Bodega A-1" value={formData.ubicacion} onChange={e => setFormData({ ...formData, ubicacion: e.target.value })} />
                    </div>
                )}
            </div>
        </ModalLayout>
    );
};

export default ProductModal;