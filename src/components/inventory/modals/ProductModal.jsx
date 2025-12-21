import React, { useMemo } from 'react';
import { useProductForm } from '../hooks/useProductForm';
import useCollection from '../../../hooks/useCollection';
import ModalLayout from '../../ui/ModalLayout';
import { Input, NumberInput } from '../../ui/Input'; // Quitamos Select de aquí
import { Select } from '../../ui/Select'; // Importamos el Select NUEVO
import Button from '../../ui/Button';
import Dropzone from '../../ui/Dropzone';

const ProductModal = ({ isOpen, onClose, onSave, initialData = null, allProducts = [] }) => {
    const { data: lines } = useCollection('config_lineas');
    const { data: allProviders } = useCollection('proveedores');

    const {
        formData,
        setFormData,
        handlePricing,
        handleImageUpload,
        uploading,
        originalSkuRef,
        availableBrands,
        availableModels
    } = useProductForm(initialData, isOpen, allProducts);

    const filteredProviders = useMemo(() => {
        if (!formData.linea) return [];
        return allProviders.filter(p => p.lineas?.includes(formData.linea));
    }, [formData.linea, allProviders]);

    // ADAPTADOR: El nuevo Select devuelve el NOMBRE, así que buscamos el objeto completo
    const handleProviderChange = (e) => {
        const selectedName = e.target.value;
        const p = filteredProviders.find(x => x.nombre === selectedName);

        // Si no encontramos proveedor (ej. limpió el campo), reseteamos
        if (!p) return setFormData(prev => ({ ...prev, proveedor_uid: '', proveedor_nombre: '', sku: '' }));

        const prefix = p.id_custom || p.id;
        const isValid = (s) => s && s.startsWith(prefix);

        // Mantener SKU si ya era válido, si no generar uno nuevo
        const newSku = (originalSkuRef.current && isValid(originalSkuRef.current))
            ? originalSkuRef.current
            : `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

        setFormData(prev => ({
            ...prev,
            proveedor_uid: p.id_custom || p.id,
            proveedor_nombre: p.nombre,
            sku: newSku
        }));
    };

    // Componente auxiliar para renderizar Labels con el mismo estilo que tus Inputs
    const Label = ({ children }) => (
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] ml-1 block mb-2">
            {children}
        </label>
    );

    return (
        <ModalLayout
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? "EDITAR PRODUCTO" : "NUEVO PRODUCTO"}
            actions={<Button onClick={() => onSave(formData)}>Guardar</Button>}
        >
            <div className="space-y-5">
                <Dropzone
                    value={formData.imagen}
                    onChange={handleImageUpload}
                    loading={uploading}
                />

                {/* Selector de Tipo (Físico vs Sobrepedido) */}
                <div className="flex bg-gray-50/50 p-1 rounded-2xl border border-gray-100">
                    <button
                        onClick={() => setFormData({ ...formData, tipo: 'stock' })}
                        className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${formData.tipo === 'stock' ? 'bg-white text-brand-red shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        INVENTARIO FÍSICO
                    </button>
                    <button
                        onClick={() => setFormData({ ...formData, tipo: 'dropshipping' })}
                        className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${formData.tipo === 'dropshipping' ? 'bg-white text-brand-red shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        SOBREPEDIDO
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-5">
                    {/* SELECT DE LÍNEA */}
                    <div>
                        <Label>Línea</Label>
                        <Select
                            options={lines.map(l => l.nombre)}
                            value={formData.linea}
                            onChange={e => setFormData({ ...formData, linea: e.target.value, proveedor_uid: '', proveedor_nombre: '' })}
                        />
                    </div>

                    {/* SELECT DE PROVEEDOR */}
                    <div className="relative">
                        <Label>Proveedor</Label>
                        <Select
                            options={filteredProviders.map(p => p.nombre)}
                            value={formData.proveedor_nombre} // Usamos el nombre para que coincida con las opciones
                            onChange={handleProviderChange}
                        />
                        {formData.sku && (
                            <span className="absolute right-0 top-0 text-[9px] font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded pointer-events-none">
                                SKU: {formData.sku}
                            </span>
                        )}
                    </div>
                </div>

                <Input
                    label="Nombre del Producto"
                    value={formData.nombre}
                    onChange={e => setFormData({ ...formData, nombre: e.target.value.toUpperCase() })}
                />

                <div className="grid grid-cols-2 gap-5">
                    {/* SELECT DE MARCA (AUTOCOMPLETE) */}
                    <div>
                        <Label>Marca</Label>
                        <Select
                            options={availableBrands}
                            value={formData.marca}
                            onChange={e => setFormData({ ...formData, marca: e.target.value, modelo: '' })}
                        />
                    </div>

                    {/* SELECT DE MODELO (AUTOCOMPLETE) */}
                    <div>
                        <Label>Modelo</Label>
                        <Select
                            options={availableModels}
                            value={formData.modelo}
                            onChange={e => setFormData({ ...formData, modelo: e.target.value })}
                        />
                    </div>
                </div>

                {/* Sección de Precios */}
                <div className="grid grid-cols-3 gap-4 bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                    <NumberInput label="Costo" value={formData.costo} onChange={e => handlePricing('costo', e.target.value)} />
                    <NumberInput label="Ganancia" value={formData.ganancia} onChange={e => handlePricing('ganancia', e.target.value)} />
                    <NumberInput label="Precio Venta" value={formData.precio} onChange={e => handlePricing('precio', e.target.value)} />
                </div>

                {formData.tipo === 'stock' && (
                    <div className="grid grid-cols-2 gap-5">
                        <NumberInput label="Stock Inicial" value={formData.stock_actual} onChange={e => setFormData({ ...formData, stock_actual: Number(e.target.value) })} />
                        <Input label="Ubicación" value={formData.ubicacion} onChange={e => setFormData({ ...formData, ubicacion: e.target.value.toUpperCase() })} />
                    </div>
                )}
            </div>
        </ModalLayout>
    );
};

export default ProductModal;