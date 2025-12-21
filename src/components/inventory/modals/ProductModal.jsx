import React, { useMemo } from 'react';
import { useProductForm } from '../hooks/useProductForm';
import useCollection from '../../../hooks/useCollection';
import ModalLayout from '../../ui/ModalLayout';
import { Input, NumberInput, Select } from '../../ui/Input';
import Button from '../../ui/Button';

const ProductModal = ({ isOpen, onClose, onSave, initialData = null, allProducts = [] }) => {
    const { data: lines } = useCollection('config_lineas');
    const { data: allProviders } = useCollection('proveedores');
    const { formData, setFormData, handlePricing, originalSkuRef, availableBrands, availableModels } = useProductForm(initialData, isOpen, allProducts);

    const filteredProviders = useMemo(() => {
        if (!formData.linea) return [];
        return allProviders.filter(p => p.lineas?.includes(formData.linea));
    }, [formData.linea, allProviders]);

    const handleProviderChange = (e) => {
        const uid = e.target.value;
        const p = filteredProviders.find(x => x.id_custom === uid || x.id === uid);
        const prefix = p?.id_custom || uid;
        if (!uid) return setFormData(prev => ({ ...prev, proveedor_uid: '', sku: '' }));

        const isValid = (s) => s && s.startsWith(prefix);
        const newSku = (originalSkuRef.current && isValid(originalSkuRef.current))
            ? originalSkuRef.current
            : `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

        setFormData(prev => ({ ...prev, proveedor_uid: uid, proveedor_nombre: p?.nombre || '', sku: newSku }));
    };

    return (
        <ModalLayout isOpen={isOpen} onClose={onClose} title="PRODUCTO" actions={<Button onClick={() => onSave(formData)}>Guardar</Button>}>
            <div className="space-y-4">
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button onClick={() => setFormData({ ...formData, tipo: 'stock' })} className={`flex-1 py-2 text-[10px] font-black rounded-lg ${formData.tipo === 'stock' ? 'bg-white text-brand-red' : 'text-gray-400'}`}>FÍSICO</button>
                    <button onClick={() => setFormData({ ...formData, tipo: 'dropshipping' })} className={`flex-1 py-2 text-[10px] font-black rounded-lg ${formData.tipo === 'dropshipping' ? 'bg-white text-brand-red' : 'text-gray-400'}`}>SOBREPEDIDO</button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Select label="Línea" value={formData.linea} onChange={e => setFormData({ ...formData, linea: e.target.value })}><option value="">Línea...</option>{lines.map(l => <option key={l.id} value={l.nombre}>{l.nombre}</option>)}</Select>
                    <div className="relative">
                        <Select label="Proveedor" value={formData.proveedor_uid} onChange={handleProviderChange}><option value="">Proveedor...</option>{filteredProviders.map(p => <option key={p.id} value={p.id_custom}>{p.nombre}</option>)}</Select>
                        {formData.sku && <span className="absolute right-8 top-[38px] text-[9px] font-mono text-gray-400 pointer-events-none">{formData.sku}</span>}
                    </div>
                </div>

                <Input label="Nombre" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value.toUpperCase() })} />

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Input label="Marca" list="brands-list" value={formData.marca} onChange={e => setFormData({ ...formData, marca: e.target.value.toUpperCase(), modelo: '' })} />
                        <datalist id="brands-list">{availableBrands.map(b => <option key={b} value={b} />)}</datalist>
                    </div>
                    <div>
                        <Input label="Modelo" list="models-list" disabled={!formData.marca} value={formData.modelo} onChange={e => setFormData({ ...formData, modelo: e.target.value.toUpperCase() })} />
                        <datalist id="models-list">{availableModels.map(m => <option key={m} value={m} />)}</datalist>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl">
                    <NumberInput label="Costo" value={formData.costo} onChange={e => handlePricing('costo', e.target.value)} />
                    <NumberInput label="Ganancia" value={formData.ganancia} onChange={e => handlePricing('ganancia', e.target.value)} />
                    <NumberInput label="Precio" value={formData.precio} onChange={e => handlePricing('precio', e.target.value)} />
                </div>

                {formData.tipo === 'stock' && (
                    <div className="grid grid-cols-2 gap-4">
                        <NumberInput label="Stock" value={formData.stock_actual} onChange={e => setFormData({ ...formData, stock_actual: Number(e.target.value) })} />
                        <Input label="Ubicación" value={formData.ubicacion} onChange={e => setFormData({ ...formData, ubicacion: e.target.value.toUpperCase() })} />
                    </div>
                )}
            </div>
        </ModalLayout>
    );
};

export default ProductModal;