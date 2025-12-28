import React from 'react';
import { Input } from '../../ui/forms/Input';
import { PriceText, TextLabel } from '../../ui/display/Typography';
import Icon from '../../ui/display/Icon';

const ProviderPaymentForm = ({ item, onUpdatePayment }) => {
    // Cálculo de deuda en tiempo real para este ítem
    const costoTotal = (Number(item.costo) || 0) + (Number(item.costo_envio_asignado) || 0);
    const pagado = Number(item.pago_provider) || 0;
    const deuda = Math.max(0, costoTotal - pagado);

    return (
        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm mb-3">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="text-[10px] font-black text-brand-dark uppercase tracking-tighter">
                        {item.modelo} - T{item.talla}
                    </div>
                    <TextLabel className="text-[9px] opacity-50">Proveedor: {item.proveedor_nombre}</TextLabel>
                </div>
                <div className={`px-2 py-1 rounded-lg border ${deuda > 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                    <span className="text-[8px] uppercase font-black block leading-none opacity-40">Deuda</span>
                    <PriceText
                        className={`text-[11px] font-black ${deuda > 0 ? 'text-red-600' : 'text-emerald-600'}`}
                        value={deuda}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
                <div className="space-y-1">
                    <TextLabel className="text-[9px] font-bold ml-1">Costo Producto</TextLabel>
                    <div className="bg-slate-50 px-3 py-2 rounded-xl text-[11px] font-bold text-slate-600">
                        <PriceText value={costoTotal} />
                    </div>
                </div>

                <Input
                    label="Registrar Pago"
                    type="number"
                    value={item.pago_provider || ''}
                    onChange={(e) => onUpdatePayment(item.id, e.target.value)}
                    placeholder="Monto pagado..."
                    icon="credit-card"
                />
            </div>

            {deuda === 0 && (
                <div className="mt-3 flex items-center justify-center gap-1 bg-emerald-500/10 py-1 rounded-lg">
                    <Icon name="check-circle" size={10} className="text-emerald-600" />
                    <span className="text-[8px] font-black text-emerald-700 uppercase">Saldado</span>
                </div>
            )}
        </div>
    );
};

export default ProviderPaymentForm;