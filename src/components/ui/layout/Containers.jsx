import React from 'react';

// Contenedor de toda la página
export const ViewWrapper = ({ children }) => (
    <div className="flex flex-col h-full space-y-8 animate-fade-in pb-10">
        {children}
    </div>
);

// Sección de datos (Tablas, Listas)
export const DataCard = ({ children, title, padding = "p-8" }) => (
    <div className={`bg-white rounded-[2.5rem] ${padding} border border-gray-100 shadow-sm overflow-hidden flex-1 flex flex-col`}>
        {title && (
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-6">
                {title}
            </h4>
        )}
        <div className="flex-1 overflow-hidden">
            {children}
        </div>
    </div>
);

// Agrupador de campos en formularios
export const FormSection = ({ children, columns = 2, title }) => (
    <div className="space-y-4">
        {title && <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{title}</h5>}
        <div className={`grid grid-cols-1 md:grid-cols-${columns} gap-6 bg-slate-50/50 p-6 rounded-[2rem] border border-gray-50`}>
            {children}
        </div>
    </div>
);