import React from 'react';
import Icon from '../../ui/Icon';
import { formatCurrency } from '../../../lib/utils';

const OrderCard = ({ order, isSelected, selectionMode, onSelect, onOpen }) => (
    <div 
        onClick={() => selectionMode ? onSelect(order.id) : onOpen(order)} 
        className={`bg-white p-3 rounded-xl shadow-sm border transition-all cursor-pointer relative ${isSelected ? 'border-indigo-600 ring-4 ring-indigo-50' : 'border-transparent hover:border-brand-red/10'}`}
    >
        <div className="flex justify-between items-start mb-1">
            <div className="flex-1 min-w-0">
                <div className="font-bold text-xs truncate pr-2">{order.cliente?.nombre}</div>
                <div className="text-[9px] text-gray-400 uppercase font-bold text-indigo-500">{order.cliente?.ciudad_entrega} — {order.estrategia}</div>
            </div>
            <div className="flex flex-col items-end gap-1">
                <span className="text-[9px] font-bold text-gray-300">#{order.id_visual}</span>
                {selectionMode && (
                    <button onClick={(e) => { e.stopPropagation(); onOpen(order); }} className="bg-gray-100 hover:bg-indigo-600 hover:text-white text-gray-500 rounded-lg p-1.5">
                        <Icon name="Eye" size={12}/>
                    </button>
                )}
            </div>
        </div>
        <div className="mt-2 space-y-1">
            {order.items?.map((it, i) => (
                <div key={i} className="flex justify-between items-center bg-gray-50 px-2 py-1 rounded">
                    <span className="text-[9px] text-gray-600 truncate mr-2">{it.modelo}</span>
                    <span className="text-[8px] font-mono font-bold text-brand-red bg-red-50 px-1 rounded border border-red-100">{it.sku}</span>
                </div>
            ))}
        </div>
        <div className="mt-3 flex justify-end items-center border-t pt-2 border-gray-50">
            <span className="text-[10px] font-black text-brand-dark">{formatCurrency(order.total)}</span>
        </div>
    </div>
);

export default OrderCard;