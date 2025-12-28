import React from 'react';

// TÍTULOS MAESTROS
export const H1 = ({ children, className = "" }) => (
    <h1 className={`text-3xl font-black text-slate-900 tracking-tighter uppercase ${className}`}>
        {children}
    </h1>
);

export const H2 = ({ children, className = "" }) => (
    <h2 className={`text-xl font-black text-slate-800 tracking-tight uppercase ${className}`}>
        {children}
    </h2>
);

export const H3 = ({ children, className = "" }) => (
    <h3 className={`text-sm font-black text-slate-700 tracking-widest uppercase ${className}`}>
        {children}
    </h3>
);

// ETIQUETAS TÉCNICAS (Labels)
export const TextLabel = ({ children, className = "" }) => (
    <span className={`text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ${className}`}>
        {children}
    </span>
);

// VALORES NUMÉRICOS (Finanzas)
export const PriceText = ({ value, className = "" }) => (
    <span className={`font-black tabular-nums tracking-tighter ${className}`}>
        ${Number(value || 0).toLocaleString()}
    </span>
);