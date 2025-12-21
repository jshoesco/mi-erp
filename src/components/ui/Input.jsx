import React from 'react';

// Estilo High-End: Bordes más redondos, fondos más limpios, foco elegante
const inputClass = "w-full px-5 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl text-[13px] font-bold text-gray-800 placeholder-gray-400 focus:bg-white focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 outline-none transition-all duration-300 hover:border-gray-300 shadow-none";

export const Input = ({ label, icon, ...props }) => (
    <div className="flex flex-col gap-2 w-full">
        {label && <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] ml-1">{label}</label>}
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
        <div className="flex flex-col gap-2 w-full">
            {label && <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] ml-1">{label}</label>}
            <input 
                {...props} 
                type="text" 
                inputMode="numeric" 
                value={format(value)} 
                onChange={handleChange} 
                className={`${inputClass} font-mono font-bold ${className}`} 
            />
        </div>
    );
};

export const Select = ({ label, children, ...props }) => (
    <div className="flex flex-col gap-2 w-full">
        {label && <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] ml-1">{label}</label>}
        <div className="relative">
            <select {...props} className={`${inputClass} appearance-none cursor-pointer`}>
                {children}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
        </div>
    </div>
);

export default Input;