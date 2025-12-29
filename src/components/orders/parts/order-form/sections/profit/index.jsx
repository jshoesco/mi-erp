import React from 'react';
import { useOrderProfit } from './logic/useOrderProfit';
import { PriceText } from '../../../../../ui/display/Typography';

const OrderProfit = ({ formData }) => {
    const { totalIngresos, totalCostos, profit, margen, esNegativo, hasItems } = useOrderProfit(formData);

    if (!hasItems) return null;

    return (
        <div className={`p-6 rounded-[2.5rem] border transition-all duration-500 ${esNegativo ? 'bg-red-50 border-red-200' : 'bg-slate-900 border-slate-800 shadow-2xl'
            }`}>
            <div className="flex justify-between items-center mb-6">
                <span className={`text-[10px] font-black uppercase tracking-widest ${esNegativo ? 'text-red-600' : 'text-slate-400'}`}>
                    Resultado Operativo
                </span>
                <span className={`px-3 py-1 rounded-xl text-[10px] font-black ${esNegativo ? 'bg-red-200 text-red-700' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {margen.toFixed(1)}% MARGEN
                </span>
            </div>

            <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                    <p className="text-[9px] uppercase font-bold text-slate-500">Ingresos Totales</p>
                    <PriceText className={`text-2xl font-black ${esNegativo ? 'text-red-900' : 'text-white'}`} value={totalIngresos} />
                </div>
                <div className="space-y-1">
                    <p className="text-[9px] uppercase font-bold text-slate-500">Egresos Totales</p>
                    <PriceText className={`text-2xl font-bold ${esNegativo ? 'text-red-800' : 'text-slate-300'}`} value={totalCostos} />
                </div>
            </div>

            <div className={`mt-6 pt-5 border-t flex justify-between items-center ${esNegativo ? 'border-red-200' : 'border-slate-800'}`}>
                <span className={`text-[11px] font-black uppercase ${esNegativo ? 'text-red-700' : 'text-slate-400'}`}>Rentabilidad Neta</span>
                <PriceText className={`text-3xl font-black ${esNegativo ? 'text-red-600' : 'text-emerald-400'}`} value={profit} />
            </div>
        </div>
    );
};

export default OrderProfit;