import React from 'react';
import { Input } from './Inputs';
import SmartSelect from './SmartSelect';
import ImageUploader from './ImageUploader';

const PaymentSection = ({ 
    form, 
    setForm, 
    financeMethods, 
    uploading, 
    onFileSelect 
}) => {
    // Protección: Asegurarnos de que form existe para no romper la app
    const safeForm = form || {};

    // Detectar automáticamente si es banco
    const selectedMethod = financeMethods.find(m => m.name === safeForm.metodo);
    const isBank = selectedMethod?.isBank;

    return (
        <div className="space-y-3">
            <SmartSelect 
                label="Método de Pago" 
                // FIX CRÍTICO: El || '' evita que sea undefined y cause el error
                value={safeForm.metodo || ''} 
                onChange={e => setForm({ ...safeForm, metodo: e.target.value })} 
                options={financeMethods} 
                displayProp="name"
                valueProp="name"
                placeholder="Seleccionar..." 
            />

            {/* Renderizado Condicional Automático */}
            {isBank && (
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-3 animate-fade-in shadow-sm">
                    <Input 
                        label="Número de Transacción / Comprobante" 
                        // FIX CRÍTICO: El || '' evita el error de "uncontrolled"
                        value={safeForm.transaction_id || ''} 
                        onChange={e => setForm({ ...safeForm, transaction_id: e.target.value })} 
                        placeholder="Ej: NEQUI-123456" 
                    />
                    <ImageUploader 
                        image={safeForm.imagen || ''} 
                        onFileSelect={onFileSelect} 
                        loading={uploading} 
                        onClear={() => setForm({ ...safeForm, imagen: '' })} 
                    />
                </div>
            )}
        </div>
    );
};

export default PaymentSection;