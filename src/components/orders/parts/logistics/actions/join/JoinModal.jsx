import React, { useState, useMemo } from 'react';
import ModalLayout from '../../../../../ui/layout/ModalLayout';
import { SCHEMA } from '../../../../../../constants/schema';
import { getJoinCandidates } from './logic';

const JoinModal = ({ isOpen, onClose, baseOrder, allOrders, onConfirm }) => {
    const S = SCHEMA.ORDERS;
    const [selectedIds, setSelectedIds] = useState([]);

    // Usamos el cerebro externo para obtener candidatos
    const candidates = useMemo(() =>
        getJoinCandidates(baseOrder, allOrders),
        [baseOrder, allOrders]);

    const handleConfirm = () => {
        onConfirm({
            orderIds: [...selectedIds, baseOrder.id],
            masterAddress: baseOrder[S.CLIENT.ROOT]?.[S.CLIENT.ADDRESS]
        });
    };

    if (!isOpen || !baseOrder) return null;

    return (
        <ModalLayout isOpen={isOpen} onClose={onClose} title="Unificar Pedidos">
            <div className="p-4 space-y-4">
                <div className="max-h-60 overflow-y-auto space-y-2">
                    {candidates.length > 0 ? (
                        candidates.map(order => (
                            <div
                                key={order.id}
                                onClick={() => setSelectedIds(prev =>
                                    prev.includes(order.id) ? prev.filter(i => i !== order.id) : [...prev, order.id]
                                )}
                                className={`p-3 border rounded-xl cursor-pointer ${selectedIds.includes(order.id) ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100'
                                    }`}
                            >
                                <p className="text-[10px] font-black uppercase text-slate-400">#{order[S.ID_ORDER]}</p>
                                <p className="text-xs font-bold text-slate-700">{order[S.CLIENT.ROOT]?.[S.CLIENT.NAME]}</p>
                            </div>
                        ))
                    ) : (
                        <div className="py-10 text-center text-[10px] font-black text-slate-400 uppercase">
                            No hay pedidos compatibles para unificar
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 text-[10px] font-black uppercase text-slate-400">Cancelar</button>
                    <button
                        onClick={handleConfirm}
                        disabled={selectedIds.length === 0}
                        className="flex-1 bg-indigo-600 disabled:bg-slate-200 text-white py-3 rounded-xl text-[10px] font-black uppercase"
                    >
                        Unificar {selectedIds.length + 1} Pedidos
                    </button>
                </div>
            </div>
        </ModalLayout>
    );
};

export default JoinModal;