import React from 'react';
import { useOrderProfit } from './logic/useOrderProfit';

const OrderProfit = ({ formData }) => {
    const { subtotal, envio, profit, margen } = useOrderProfit(formData);

    const isNegative = profit < 0;

    return (
        <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl overflow-hidden relative">
            {/* Decoración de fondo para que se vea Pro */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 blur-3xl rounded-full -mr-16 -mt-16" />

            <div className="grid grid-cols-2 gap-6 relative z-10">
                <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Subtotal Venta</span>
                    <div className="text-2xl font-black">${subtotal.toLocaleString()}</div>
                </div>

                <div className="space-y-1 text-right">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Costo Envío</span>
                    <div className="text-xl font-bold text-slate-300">${envio.toLocaleString()}</div>
                </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-800 flex justify-between items-end relative z-10">
                <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-brand tracking-widest">Utilidad Estimada</span>
                    <div className={`text-3xl font-black ${isNegative ? 'text-red-400' : 'text-green-400'}`}>
                        ${profit.toLocaleString()}
                    </div>
                </div>

                <div className="text-right">
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${isNegative ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                        {margen.toFixed(1)}% MARGEN
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderProfit;