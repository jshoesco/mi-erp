import React from 'react';
import Icon from '../../ui/Icon';

const LogisticsCard = ({ group, columnKey, onAction }) => {
    // Solo nos interesa la deuda si estamos en la columna de pendientes
    const isPendingCol = columnKey === 'pending';

    return (
        <div className={`bg-white p-3 rounded-xl shadow-sm border-l-4 mb-3 transition-all ${group.totalDebt > 0.1 ? 'border-l-brand-red ring-1 ring-red-50' : 'border-l-emerald-500'}`}>
            <div className="flex justify-between items-start mb-2">
                <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-black text-indigo-600 uppercase flex items-center gap-1">
                        <Icon name="Package" size={10}/> {group.provName}
                    </div>
                    <div className="text-[11px] font-bold text-gray-800 truncate">
                        {group.items.length > 1 ? `📦 ENVÍO CONSOLIDADO` : group.mainClientName}
                    </div>
                </div>
                
                <div className="flex gap-1 ml-2">
                    {(columnKey === 'ready' || columnKey === 'pending') && (
                        <button onClick={() => onAction('link', { proveedor: group.provName, ciudad: group.city })} className="p-1 text-indigo-400">
                            <Icon name="Link" size={14}/>
                        </button>
                    )}
                    {columnKey === 'pending' && (
                        <button onClick={() => onAction('payment', group.items)} className="p-1 text-red-500">
                            <Icon name="DollarSign" size={14}/>
                        </button>
                    )}
                    {columnKey === 'ready' && (
                        <button onClick={() => {
                            onAction('guide', group.items[0].orderId);
                        }} className="p-1 text-indigo-500">
                            <Icon name="Truck" size={14}/>
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-4 mt-2 border-t pt-2 border-gray-50">
                {group.clients.map(c => (
                    <div key={c.visualId} className="space-y-1">
                        <div className="text-[9px] font-black text-gray-400 uppercase px-1">
                            👤 {c.name}
                        </div>
                        
                        <div className="space-y-1">
                            {c.items.map((it, i) => {
                                // Calculamos deuda específica de este producto
                                const itemDebt = Math.max(0, ((Number(it.costo) || 0) + (Number(it.costo_envio_asignado) || 0)) - (Number(it.pago_proveedor) || 0));
                                const isUnpaid = itemDebt > 0.1;

                                return (
                                    <div key={i} className="flex items-center justify-between gap-2 pl-2 pr-1 py-0.5">
                                        <span className={`text-[10px] truncate flex-1 ${isPendingCol && isUnpaid ? 'text-amber-600 font-medium' : 'text-gray-500'}`}>
                                            <span className="font-bold">{it.cantidad}x</span> {it.modelo}
                                            <span className="font-mono text-[8px] ml-1 opacity-40">[{it.sku}]</span>
                                        </span>

                                        {/* SOLO MARCA LO NO PAGADO Y SOLO EN PENDIENTES */}
                                        {isPendingCol && isUnpaid && (
                                            <div className="flex items-center gap-1 text-[8px] font-black text-amber-500 uppercase tracking-tighter">
                                                <span>FALTA PAGO</span>
                                                <Icon name="Clock" size={10} strokeWidth={3} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LogisticsCard;