import React, { useState } from 'react';
import { StatusBadge, ActionButtons } from '../shared';
import Icon from '../../../../../ui/display/Icon';
import { SCHEMA } from '../../../../../../constants/schema';

const TableView = ({ data, onAction }) => {
    const S = SCHEMA.ORDERS;
    const C = S.CLIENT;
    const I = S.ITEM;

    const allGroups = Object.values(data).flat();
    const [expandedGroup, setExpandedGroup] = useState(null);

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="w-10 p-4"></th>
                        <th className="p-4 text-[10px] font-black uppercase text-slate-500">Proveedor / Origen</th>
                        <th className="p-4 text-[10px] font-black uppercase text-slate-500">Destino / Envío</th>
                        <th className="p-4 text-[10px] font-black uppercase text-slate-500 text-center">Unidades</th>
                        <th className="p-4 text-[10px] font-black uppercase text-slate-500 text-center">Deuda</th>
                        <th className="p-4 text-[10px] font-black uppercase text-slate-500">Estado</th>
                        <th className="p-4 text-[10px] font-black uppercase text-slate-500 text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {allGroups.map((group) => (
                        <React.Fragment key={group.id}>
                            <tr
                                className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${expandedGroup === group.id ? 'bg-slate-50/50' : ''}`}
                                onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
                            >
                                <td className="p-4 text-center text-slate-400 text-[10px]">
                                    {expandedGroup === group.id ? '▲' : '▼'}
                                </td>
                                <td className="p-4">
                                    <div className="text-xs font-bold text-slate-900 uppercase">{group.provider}</div>
                                    <div className="text-[10px] text-slate-400 font-medium italic uppercase">
                                        {group.groupId ? `Lote: ${group.groupId.substring(0, 8)}` : 'Individual'}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="text-xs font-semibold text-slate-700 uppercase">{group.city}</div>
                                    <div className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">{group.shippingType}</div>
                                </td>
                                <td className="p-4 text-center text-xs font-bold text-slate-700">
                                    {group.ordersCount} unds
                                </td>
                                <td className="p-4 text-center text-xs font-black text-slate-600">
                                    ${(group.totalCost - group.totalPaid).toLocaleString()}
                                </td>
                                <td className="p-4">
                                    <StatusBadge status={group.status} />
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                        {(group.status === 'pago-pendiente' || group.status === 'por-despachar') && (
                                            <button
                                                onClick={() => onAction('open_join', group.orders[0])}
                                                className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100"
                                                title="Vincular Pedidos"
                                            >
                                                <Icon name="link" size={14} />
                                            </button>
                                        )}
                                        <ActionButtons
                                            status={group.status}
                                            isGrouped={group.orders.length > 1 || !!group.groupId}
                                            groupType={group.shippingType}
                                            onAction={(type) => onAction(type, group)}
                                        />
                                    </div>
                                </td>
                            </tr>

                            {expandedGroup === group.id && (
                                <tr className="bg-slate-50/30">
                                    <td colSpan="7" className="p-4 bg-slate-50/50 shadow-inner">
                                        <div className="space-y-2">
                                            {group.orders.map((order) => (
                                                <div key={order.id} className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between shadow-sm border-l-4 border-l-slate-800">
                                                    <div className="flex items-center gap-4">
                                                        <div className="bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded">
                                                            #{order[S.ID_ORDER]}
                                                        </div>
                                                        <div className="space-y-1">
                                                            {order[S.ITEMS].map((item, idx) => (
                                                                <div key={`${order.id}-${idx}`} className="flex items-center gap-3 group">
                                                                    <span className="text-xs font-medium text-slate-600 uppercase italic">
                                                                        {item[I.SKU]} - {item[I.MODEL]} (${Number(item[I.COST]).toLocaleString()})
                                                                    </span>
                                                                    {order[S.ITEMS].length > 1 && (
                                                                        <button
                                                                            onClick={() => onAction('split_item', { order, itemIndex: idx })}
                                                                            className="opacity-0 group-hover:opacity-100 p-1 bg-red-50 text-red-500 rounded hover:bg-red-500 hover:text-white transition-all text-[10px] font-black"
                                                                        >
                                                                            ✂️ SEPARAR
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex flex-col items-end">
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase">Cliente</div>
                                                        <div className="text-xs font-bold text-slate-700 uppercase">
                                                            {order[C.ROOT]?.[C.NAME]}
                                                        </div>
                                                        {order.logistics?.groupId && (
                                                            <button
                                                                onClick={() => onAction('unveiled_order', order)}
                                                                className="mt-1 flex items-center gap-1 text-[9px] font-black text-red-400 hover:text-red-600 uppercase transition-all"
                                                            >
                                                                <Icon name="unlink" size={10} />
                                                                DESVINCULAR
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TableView;