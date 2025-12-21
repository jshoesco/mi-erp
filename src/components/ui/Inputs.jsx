import React from 'react';

// Estilo base para todos los inputs: Gris suave, borde sutil, foco rojo/negro
const inputClass = "w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none transition-all shadow-sm hover:border-slate-400";

export const Input = ({ label, ...props }) => (
    <div className="flex flex-col gap-1.5 w-full">
        {label && <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">{label}</label>}
        <input {...props} className={inputClass} />
    </div>
);

export const NumberInput = ({ label, value, onChange, className = "", ...props }) => {
    const format = (val) => {
        if (!val && val !== 0) return '';
        return val.toString().replace(/\./g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const handleChange = (e) => {
        const raw = e.target.value.replace(/\./g, '');
        if (!/^\d*$/.test(raw)) return;
        onChange({ target: { value: raw } });
    };

    return (
        <div className="flex flex-col gap-1.5 w-full">
            {label && <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">{label}</label>}
            <input 
                {...props} 
                type="text" 
                inputMode="numeric" 
                value={format(value)} 
                onChange={handleChange} 
                className={`${inputClass} font-mono font-medium ${className}`} 
            />
        </div>
    );
};

export const Select = ({ label, children, ...props }) => (
    <div className="flex flex-col gap-1.5 w-full">
        {label && <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">{label}</label>}
        <select {...props} className={inputClass}>
            {children}
        </select>
    </div>
);