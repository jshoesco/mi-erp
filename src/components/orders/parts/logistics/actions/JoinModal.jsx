import React, { useState, useMemo } from 'react';
import ModalLayout from '../../../../ui/layout/ModalLayout';
import { SCHEMA } from '../../../../../constants/schema';

const JoinModal = ({ isOpen, onClose, baseOrder, allOrders, onConfirm }) => {
    const candidates = useMemo(() => {
        if (!baseOrder || !allOrders) return [];

        const baseProvider = baseOrder[SCHEMA.ORDERS.ITEMS]?.[0]?.[SCHEMA.ORDERS.ITEM.PROVIDER];
        const baseCity = baseOrder[SCHEMA.ORDERS.CLIENT.ROOT]?.[SCHEMA.ORDERS.CLIENT.CITY];

        return allOrders.filter(o =>
            o.id !== baseOrder.id &&
            !o.logistics?.groupId &&
            o[SCHEMA.ORDERS.ITEMS]?.[0]?.[SCHEMA.ORDERS.ITEM.PROVIDER] === baseProvider &&
            o[SCHEMA.ORDERS.CLIENT.ROOT]?.[SCHEMA.ORDERS.CLIENT.CITY] === baseCity &&
            o[SCHEMA.ORDERS.STRATEGY]?.toUpperCase() === 'DIRECTO' &&
            o[SCHEMA.ORDERS.STATUS]?.toLowerCase() !== 'entregado'
        );
    }, [baseOrder, allOrders]);

    const [selectedIds, setSelectedIds] = useState([]);
    const [masterAddress, setMasterAddress] = useState(baseOrder?.[SCHEMA.ORDERS.CLIENT.ROOT]?.[SCHEMA.ORDERS.CLIENT.ADDRESS] || '');

    if (!isOpen || !baseOrder) return null;

    return (
        <ModalLayout
            isOpen={isOpen}
            onClose={onClose}
            title="Unificar Pedidos Directos"
            actions={
                <div className="flex gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase">Cancelar</button>
                    <button
                        disabled={selectedIds.length === 0}
                        onClick={() => onConfirm([...selectedIds, baseOrder.id], masterAddress)}
                        className="px-4 py-2 bg-indigo-600 disabled:bg-slate-300 text-white text-[10px] font-black rounded-lg uppercase"
                    >
                        Unificar {selectedIds.length + 1} Pedidos
                    </button>
                </div>
            }
        >
            <div className="p-4 space-y-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Pedido Base:</span>
                    <div className="text-xs font-bold text-slate-800">
                        #{baseOrder[SCHEMA.ORDERS.ID_ORDER]} - {baseOrder[SCHEMA.ORDERS.CLIENT.ROOT]?.[SCHEMA.ORDERS.CLIENT.NAME]}
                    </div>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2">
                    {candidates.length > 0 ? (
                        candidates.map(order => (
                            <div
                                key={order.id}
                                onClick={() => setSelectedIds(prev => prev.includes(order.id) ? prev.filter(i => i !== order.id) : [...prev, order.id])}
                                className={`p-3 border rounded-xl cursor-pointer flex items-center gap-3 ${selectedIds.includes(order.id) ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100'
                                    }`}
                            >
                                <input type="checkbox" checked={selectedIds.includes(order.id)} readOnly />
                                <div className="flex-1">
                                    <div className="text-[10px] font-black text-slate-400 uppercase">#{order[SCHEMA.ORDERS.ID_ORDER]}</div>
                                    <div className="text-[11px] font-bold text-slate-700">{order[SCHEMA.ORDERS.CLIENT.ROOT]?.[SCHEMA.ORDERS.CLIENT.ADDRESS]}</div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-6 text-slate-400 text-[10px] font-black uppercase">
                            No hay otros pedidos compatibles para unificar.
                        </div>
                    )}
                </div>
            </div>
        </ModalLayout>
    );
};

export default JoinModal;