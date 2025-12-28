import React from 'react';
import { Input } from './ui/forms/Input'; // Importación correcta (singular)
import { Select } from './ui/forms/Select'; // El nuevo Select estándar
import Dropzone from './ui/Dropzone'; // El nuevo estándar de imágenes

const PaymentSection = ({
    form,
    setForm,
    financeMethods = [],
    uploading,
    onFileSelect
}) => {
    // Protección anti-crash
    const safeForm = form || {};

    // Detectar si es banco (para mostrar campos extra)
    const selectedMethod = financeMethods.find(m => m.name === safeForm.metodo);
    const isBank = selectedMethod?.isBank;

    // Helper para mantener consistencia visual con los Labels de tus otros inputs
    const Label = ({ children }) => (
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] ml-1 block mb-2">
            {children}
        </label>
    );

    return (
        <div className="space-y-4">
            <div>
                <Label>Método de Pago</Label>
                <Select
                    options={financeMethods.map(m => m.name)}
                    value={safeForm.metodo || ''}
                    onChange={e => setForm({ ...safeForm, metodo: e.target.value })}
                    placeholder="SELECCIONAR..."
                />
            </div>

            {/* Renderizado Condicional Automático */}
            {isBank && (
                <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-4 animate-fade-in shadow-sm">
                    <Input
                        label="Número de Transacción / Comprobante"
                        value={safeForm.transaction_id || ''}
                        onChange={e => setForm({ ...safeForm, transaction_id: e.target.value })}
                        placeholder="Ej: NEQUI-123456"
                    />

                    <Dropzone
                        value={safeForm.imagen || ''}
                        onChange={(files) => {
                            // Adaptador: Dropzone devuelve array, tu lógica espera 1 archivo
                            if (onFileSelect && files.length > 0) {
                                onFileSelect(files[0]);
                            }
                        }}
                        loading={uploading}
                        label="Subir Comprobante"
                    />
                </div>
            )}
        </div>
    );
};

export default PaymentSection;