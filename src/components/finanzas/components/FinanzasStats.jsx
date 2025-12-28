import React from 'react';
import { TextLabel, PriceText } from '../../ui/display/Typography';
import Icon from '../../ui/display/Icon';

const FinanzasStats = ({ stats }) => {
    const balance = stats.total ?? stats.balance ?? 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">

            {/* INGRESOS */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between h-36 group hover:border-emerald-200 transition-all">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                        <TextLabel>Ingresos Totales</TextLabel>
                    </div>
                    <Icon name="TrendingUp" size={18} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-3xl font-black text-slate-900">
                    <PriceText value={stats.ingresos} />
                </div>
            </div>

            {/* GASTOS */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between h-36 group hover:border-red-200 transition-all">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                        <TextLabel>Gastos Totales</TextLabel>
                    </div>
                    <Icon name="TrendingDown" size={18} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-3xl font-black text-slate-900">
                    <PriceText value={stats.gastos} />
                </div>
            </div>

            {/* BALANCE NETO - LA CÁPSULA MAESTRA */}
            <div className={`p-8 rounded-[2.5rem] border shadow-xl flex flex-col justify-between h-36 transition-all duration-500 transform hover:scale-[1.02] ${balance >= 0
                    ? 'bg-slate-900 border-slate-900 shadow-slate-200'
                    : 'bg-red-600 border-red-600 shadow-red-200'
                }`}>
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full animate-pulse ${balance >= 0 ? 'bg-emerald-400' : 'bg-white'
                        }`} />
                    <TextLabel className={balance >= 0 ? 'text-slate-400' : 'text-red-100'}>
                        Balance Neto
                    </TextLabel>
                </div>
                <div className="text-3xl font-black text-white">
                    <PriceText value={balance} />
                </div>
            </div>
        </div>
    );
};

export default FinanzasStats;