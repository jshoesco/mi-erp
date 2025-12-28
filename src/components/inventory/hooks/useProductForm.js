import { useState, useEffect, useMemo, useRef } from 'react';

export const useProductForm = (initialData, isOpen, allProducts = []) => {
    const originalSkuRef = useRef(initialData?.sku || null);

    const [formData, setFormData] = useState({
        tipo: 'stock',
        linea: '',
        proveedor_uid: '',
        proveedor_nombre: '',
        sku: '',
        nombre: '',
        marca: '',
        modelo: '',
        costo: 0,
        ganancia: 0,
        precio: 0,
        stock_actual: 0,
        ubicacion: '',
        imagen: '',
        ...(initialData || {})
    });

    // Resetear al abrir/cerrar o cambiar de producto
    useEffect(() => {
        if (isOpen) {
            setFormData(initialData ? { ...initialData } : {
                tipo: 'stock', linea: '', proveedor_uid: '', proveedor_nombre: '',
                sku: '', nombre: '', marca: '', modelo: '',
                costo: 0, ganancia: 0, precio: 0, stock_actual: 0, ubicacion: '', imagen: ''
            });
            originalSkuRef.current = initialData?.sku || null;
        }
    }, [isOpen, initialData]);

    // --- LÓGICA DE PRECIOS INTELIGENTE ---
    const handlePricing = (field, value) => {
        const val = Number(value) || 0;
        setFormData(prev => {
            const newState = { ...prev, [field]: val };
            // Si cambia costo o ganancia, recalculamos precio
            if (field === 'costo' || field === 'ganancia') {
                newState.precio = Number(newState.costo || 0) + Number(newState.ganancia || 0);
            }
            return newState;
        });
    };

    // --- AUTOCOMPLETADO DE MARCAS Y MODELOS (OPTIMIZADO) ---
    const availableBrands = useMemo(() => {
        if (!allProducts.length) return [];
        const brands = allProducts
            .map(p => p.marca?.toUpperCase())
            .filter(Boolean);
        return [...new Set(brands)].sort();
    }, [allProducts]);

    const availableModels = useMemo(() => {
        if (!formData.marca || !allProducts.length) return [];
        const models = allProducts
            .filter(p => p.marca?.toUpperCase() === formData.marca.toUpperCase())
            .map(p => p.modelo?.toUpperCase())
            .filter(Boolean);
        return [...new Set(models)].sort();
    }, [formData.marca, allProducts]);

    return {
        formData,
        setFormData,
        handlePricing,
        originalSkuRef,
        availableBrands,
        availableModels
    };
};