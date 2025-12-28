import React from 'react';

export const StatusBadge = ({ status }) => {
    const styles = {
        'pago-pendiente': 'bg-amber-100 text-amber-700 border-amber-200',
        'por-despachar': 'bg-blue-100 text-blue-700 border-blue-200',
        'enviado': 'bg-purple-100 text-purple-700 border-purple-200',
        'entregado': 'bg-emerald-100 text-emerald-700 border-emerald-200'
    };

    return (
        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${styles[status] || 'bg-slate-100 text-slate-500'}`}>
            {status?.replace('-', ' ') || 'SIN ESTADO'}
        </span>
    );
};