import React from 'react';
import { PriceText } from '../../ui/display/Typography';
import Icon from '../../ui/display/Icon';
import { SCHEMA } from '../../../../../constants/schema';

const ProfitPreview = ({ formData }) => {
    const I = SCHEMA.ORDERS.ITEM;
    const items = formData.items || [];

    // 1. EXTRAER FLETES (Sincronizado con useCustomerLogic)
    // Usamos Number() y fallback 0 para evitar errores de cálculo
    const costoEnvioEmpresa = Number(formData.envio_precio || 0);
    const envioCobradoAlCliente = Number(formData.envio_cobrado_cliente || 0);

    // 2. CÁLCULOS DINÁMICOS
    const subtotalVenta = items.reduce((acc, it) => {
        const precio = Number(it[I.PRICE] || 0);
        const cantidad = Number(it[I.QTY] || 1);
        return acc + (precio * cantidad);
    }, 0);

    const subtotalCosto = items.reduce((acc, it) => {
        const costo = Number(it[I.COST] || 0);
        const cantidad = Number(it[I.QTY] || 1);
        return acc + (costo * cantidad);
    }, 0);

    const totalIngresos = subtotalVenta + envioCobradoAlCliente;
    const totalCostos = subtotalCosto + costoEnvioEmpresa;

    const utilidad = totalIngresos - totalCostos;
    const esNegativo = utilidad < 0;

    // No mostramos nada si no hay items, para no ensuciar la UI
    if (items.length === 0) return null;

    return (
        <div className={`p-6 rounded-[2rem] border transition-all duration-500 ${esNegativo
                ? 'bg-red-50 border-red-100 shadow-inner'
                : 'bg-slate-900 border-slate-800 shadow-xl shadow-slate-200'
            }`}>

            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl ${esNegativo ? 'bg-red-100' : 'bg-slate-800'}`}>
                        <Icon
                            name={esNegativo ? "alert-circle" : "trending-up"}
                            size={16}
                            className={esNegativo ? 'text-red-600' : 'text-emerald-400'}
                        />
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${esNegativo ? 'text-red-700' : 'text-slate-400'
                        }`}>
                        Proyección de Utilidad
                    </span>
                </div>
                {/* Badge de porcentaje de margen (Opcional pero útil) */}
                {!esNegativo && totalIngresos > 0 && (
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">
                        {Math.round((utilidad / totalIngresos) * 100)}% Margen
                    </span>
                )}
            </div>

            <div className="grid grid-cols-2 gap-8">
                <div>
                    <p className={`text-[9px] uppercase font-bold mb-1 ${esNegativo ? 'text-red-400' : 'text-slate-500'}`}>
                        Ingreso Total
                    </p>
                    <PriceText className={`text-xl font-black ${esNegativo ? 'text-red-900' : 'text-white'}`} value={totalIngresos} />
                </div>
                <div>
                    <p className={`text-[9px] uppercase font-bold mb-1 ${esNegativo ? 'text-red-400' : 'text-slate-500'}`}>
                        Costos Totales
                    </p>
                    <PriceText className={`text-xl font-bold ${esNegativo ? 'text-red-800' : 'text-slate-300'}`} value={totalCostos} />
                </div>
            </div>

            <div className={`mt-6 pt-5 border-t flex justify-between items-center ${esNegativo ? 'border-red-200' : 'border-slate-800'
                }`}>
                <span className={`text-[11px] font-black uppercase tracking-tighter ${esNegativo ? 'text-red-700' : 'text-slate-400'
                    }`}>
                    Rentabilidad Neta
                </span>
                <div className="text-right">
                    <PriceText
                        className={`text-2xl font-black ${esNegativo ? 'text-red-600' : 'text-emerald-400'}`}
                        value={utilidad}
                    />
                </div>
            </div>

            {esNegativo && (
                <div className="mt-4 p-3 bg-white/50 rounded-xl border border-red-200 animate-pulse">
                    <p className="text-[10px] text-red-600 font-black text-center uppercase leading-tight">
                        ⚠️ Alerta: El costo de envío y productos superan la venta
                    </p>
                </div>
            )}
        </div>
    );
};

export default ProfitPreview;