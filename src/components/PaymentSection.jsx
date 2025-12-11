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
    // Detectar automáticamente si es banco según la configuración global
    const selectedMethod = financeMethods.find(m => m.name === form.metodo);
    const isBank = selectedMethod?.isBank;

    return (
        <div className="space-y-3">
            <SmartSelect 
                label="Método de Pago" 
                value={form.metodo} 
                onChange={e => setForm({ ...form, metodo: e.target.value })} 
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
                        value={form.transaction_id} 
                        onChange={e => setForm({ ...form, transaction_id: e.target.value })} 
                        placeholder="Ej: NEQUI-123456" 
                    />
                    <ImageUploader 
                        image={form.imagen} 
                        onFileSelect={onFileSelect} 
                        loading={uploading} 
                        onClear={() => setForm({ ...form, imagen: '' })} 
                    />
                </div>
            )}
        </div>
    );
};

export default PaymentSection;