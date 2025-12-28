import React, { useMemo } from 'react';
import Icon from '../../../../ui/display/Icon';
import { PriceText } from '../../../../ui/display/Typography';
import { SCHEMA } from '../../../../../constants/schema';
import SelectToggle from '../../../../ui/display/SelectToggle';

const OrderCard = ({ order, isSelected, onSelect, onClick, isVisibleSelection }) => {
    const S = SCHEMA.ORDERS;
    const C = S.CLIENT;
    const I = S.ITEM;

    const totalVenta = useMemo(() => {
        const storedTotal = Number(order[S.TOTAL] || 0);
        if (storedTotal > 0) return storedTotal;
        return (order[S.ITEMS] || []).reduce((acc, it) => acc + (Number(it[I.PRICE] || 0) * Number(it[I.QTY] || 1)), 0);
    }, [order, S, I]);

    // MANEJADOR DE CLIC DUAL (GENÉRICO)
    const handleCardClick = (e) => {
        if (isVisibleSelection) {
            onSelect(); // En modo selección, toda la tarjeta selecciona
        } else {
            onClick(); // En modo normal, abre el modal
        }
    };

    return (
        <div
            onClick={handleCardClick}
            className={`group bg-white p-4 rounded-3xl border transition-all cursor-pointer relative ${isSelected
                ? 'border-slate-900 ring-1 ring-slate-900 shadow-lg scale-[0.98]'
                : 'border-slate-100 hover:border-slate-300'
                }`}
        >
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <SelectToggle
                        isVisible={isVisibleSelection}
                        isSelected={isSelected}
                    />

                    <span className="text-[10px] font-black text-slate-400">
                        #{order[S.ID_ORDER] || order.id_visual || '---'}
                    </span>
                </div>

                {!isVisibleSelection && (
                    <div className="bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                        <span className="text-[9px] font-black uppercase text-slate-500">{order[S.STATUS]}</span>
                    </div>
                )}
            </div>

            <h4 className="text-sm font-black text-slate-800 leading-tight mb-1 truncate">
                {order[C.ROOT]?.[C.NAME] || 'Sin nombre'}
            </h4>

            <p className="text-[10px] text-slate-400 flex items-center gap-1 mb-4">
                <Icon name="map-pin" size={10} className="text-slate-300" />
                {order[C.ROOT]?.[C.CITY] || 'No definido'}
            </p>

            <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Total Venta</span>
                    <PriceText className="text-sm font-black text-brand-dark" value={totalVenta} />
                </div>
                <div className={`p-1.5 rounded-lg ${order[S.STRATEGY] === 'Acopio' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                    <Icon name={order[S.STRATEGY] === 'Acopio' ? 'home' : 'truck'} size={12} />
                </div>
            </div>
        </div>
    );
};

export default OrderCard;