import { useState, useEffect, useRef, useMemo } from 'react';
import { useUpload } from '../../../hooks/useUpload';

export const useProductForm = (initialData, isOpen, allProducts = []) => {
    const [formData, setFormData] = useState({
        tipo: 'stock', linea: '', proveedor_uid: '', proveedor_nombre: '',
        nombre: '', marca: '', modelo: '', sku: '', costo: '',
        ganancia: '', precio: '', stock_actual: 0, ubicacion: '', imagen: ''
    });

    const originalSkuRef = useRef(null);
    const { uploadImage, loading: uploading } = useUpload();

    const availableBrands = useMemo(() => {
        const brands = allProducts.map(p => p.marca?.toUpperCase()).filter(Boolean);
        return [...new Set(brands)].sort();
    }, [allProducts]);

    const availableModels = useMemo(() => {
        if (!formData.marca) return [];
        const models = allProducts
            .filter(p => p.marca?.toUpperCase() === formData.marca.toUpperCase())
            .map(p => p.modelo?.toUpperCase())
            .filter(Boolean);
        return [...new Set(models)].sort();
    }, [formData.marca, allProducts]);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({ ...initialData, id: initialData.id });
                originalSkuRef.current = initialData.sku;
            } else {
                setFormData({ 
                    tipo: 'stock', linea: '', proveedor_uid: '', proveedor_nombre: '', 
                    nombre: '', marca: '', modelo: '', sku: '', costo: '', 
                    ganancia: '', precio: '', stock_actual: 0, ubicacion: '', imagen: '' 
                });
                originalSkuRef.current = null;
            }
        }
    }, [initialData, isOpen]);

    const handlePricing = (field, value) => {
        if (value === '' || value === null) {
            setFormData(prev => ({ ...prev, [field]: '' }));
            return;
        }
        const newValue = Number(value);
        const currentCosto = Number(formData.costo || 0);
        let updates = { [field]: newValue };
        if (field === 'ganancia' && currentCosto > 0) updates.precio = currentCosto + newValue;
        else if (field === 'precio' && currentCosto > 0) updates.ganancia = newValue - currentCosto;
        setFormData(prev => ({ ...prev, ...updates }));
    };

    const handleImageUpload = async (file) => {
        if (!file) return setFormData(prev => ({ ...prev, imagen: '' }));
        const url = await uploadImage(file, formData.sku);
        if (url) setFormData(prev => ({ ...prev, imagen: url }));
    };

    return { 
        formData, setFormData, handlePricing, handleImageUpload, 
        uploading, originalSkuRef, availableBrands, availableModels 
    };
};