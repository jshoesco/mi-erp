import React from 'react';
import { formatCurrency } from '../../../lib/utils';

const FinanzasStats = ({ stats }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Ingresos Totales</span>
            <div className="text-2xl font-black text-emerald-700">{formatCurrency(stats.ingresos)}</div>
        </div>
        <div className="bg-red-50 p-5 rounded-2xl border border-red-100">
            <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Gastos Totales</span>
            <div className="text-2xl font-black text-red-700">{formatCurrency(stats.gastos)}</div>
        </div>
        <div className={`p-5 rounded-2xl border ${stats.balance >= 0 ? 'bg-gray-900 border-gray-800' : 'bg-orange-50 border-orange-100'}`}>
            <span className={`text-[10px] font-black uppercase tracking-widest ${stats.balance >= 0 ? 'text-gray-400' : 'text-orange-600'}`}>Balance Neto</span>
            <div className={`text-2xl font-black ${stats.balance >= 0 ? 'text-white' : 'text-orange-700'}`}>{formatCurrency(stats.balance)}</div>
        </div>
    </div>
);

export default FinanzasStats;