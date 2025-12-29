import React from 'react';
import { SCHEMA } from '../../../../../../constants/schema';

const KanbanView = ({ data, onAction }) => {
    const L = SCHEMA.LOGISTICS;

    const columns = [
        { id: L.STATUS.PENDING, title: 'Pendiente de Pago', color: 'bg-amber-500', action: L.ACTIONS.PAY, btnLabel: 'Pagar' },
        { id: L.STATUS.READY, title: 'Por Despachar', color: 'bg-emerald-500', action: L.ACTIONS.GUIDE, btnLabel: 'Despachar' },
        { id: L.STATUS.SHIPPED, title: 'Enviados', color: 'bg-blue-500', action: null, btnLabel: null }
    ];

    const allGroups = Object.values(data).flat();

    return (
        <div className="flex h-full gap-4 overflow-x-auto pb-4">
            {columns.map(col => (
                <div key={col.id} className="flex-shrink-0 w-80 flex flex-col bg-slate-100/50 rounded-2xl border border-slate-200">
                    <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${col.color}`} />
                            <h3 className="text-[10px] font-black uppercase text-slate-500">{col.title}</h3>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-3">
                        {allGroups.filter(g => g.status === col.id).map(group => (
                            <div key={group.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${group.shippingType === 'ACOPIO' ? 'bg-indigo-500' : 'bg-orange-500'}`} />
                                <h4 className="text-sm font-black text-slate-800 uppercase">{group.city}</h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">{group.provider}</p>

                                <div className="mt-3 flex justify-between items-center text-xs font-black">
                                    <span>{group.ordersCount} pedidos</span>
                                    <span className="text-slate-900">${(group.totalCost - group.totalPaid).toLocaleString()}</span>
                                </div>

                                {col.action && (
                                    <button
                                        onClick={() => onAction(col.action, group)}
                                        className="w-full mt-3 bg-slate-900 text-white text-[10px] font-black py-2 rounded-lg hover:bg-black transition-all uppercase"
                                    >
                                        {col.btnLabel}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default KanbanView;