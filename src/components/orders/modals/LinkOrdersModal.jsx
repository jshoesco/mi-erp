import React, { useState, useMemo, useEffect } from 'react';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import Icon from '../../ui/Icon';
import { useData } from '../../../context/DataContext';
import { useUI } from '../../../context/UIContext';
import { db } from '../../../lib/firebase';
import { doc, writeBatch } from 'firebase/firestore';

const LinkOrdersModal = ({ isOpen, onClose, initialFilter }) => {
    const { orders } = useData();
    const { notify } = useUI();
    const [selected, setSelected] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) setSelected([]);
    }, [isOpen]);

    const availableGroups = useMemo(() => {
        const groups = {};
        orders.forEach(o => {
            if (!['Completado', 'Devuelto', 'Rechazado'].includes(o.estado)) {
                o.items?.forEach((it) => {
                    if (!it.guia?.numero && !it.devolucion) {
                        if (initialFilter) {
                            if (it.proveedor_nombre !== initialFilter.proveedor || o.cliente?.ciudad_entrega !== initialFilter.ciudad) return;
                        }

                        const groupKey = `${o.id}_${it.proveedor_nombre}`;
                        if (!groups[groupKey]) {
                            groups[groupKey] = {
                                id: groupKey,
                                orderId: o.id,
                                orderVisualId: o.id_visual,
                                clientName: o.cliente?.nombre,
                                clientCity: o.cliente?.ciudad_entrega,
                                proveedor_nombre: it.proveedor_nombre,
                                orderStatus: o.estado,
                                items: []
                            };
                        }
                        groups[groupKey].items.push(it);
                    }
                });
            }
        });
        return Object.values(groups);
    }, [orders, initialFilter, isOpen]);

    const handleToggle = (group) => {
        const isSelected = selected.find(s => s.id === group.id);
        if (isSelected) {
            setSelected(selected.filter(s => s.id !== group.id));
        } else {
            if (selected.length > 0) {
                const first = selected[0];
                if (group.proveedor_nombre !== first.proveedor_nombre || group.clientCity !== first.clientCity) {
                    return notify("No compatible: Proveedor o Ciudad diferentes", "error");
                }
            }
            setSelected([...selected, group]);
        }
    };

    const handleLink = async () => {
        if (selected.length < 2) return notify("Selecciona al menos 2 pedidos para unificar");
        setLoading(true);
        try {
            const batch = writeBatch(db);
            const linkId = `LNK-${Date.now().toString().slice(-4)}`;
            const orderIds = [...new Set(selected.map(s => s.orderId))];

            orderIds.forEach(oId => {
                const order = orders.find(o => o.id === oId);
                const selGroups = selected.filter(s => s.orderId === oId);
                const newItems = order.items.map(it => {
                    const shouldLink = selGroups.some(g => g.proveedor_nombre === it.proveedor_nombre);
                    return shouldLink ? { ...it, linked_to_id: linkId } : it;
                });
                batch.update(doc(db, 'pedidos', oId), { items: newItems });
            });

            await batch.commit();
            notify("Envío consolidado exitosamente");
            onClose();
        } catch (e) { notify(e.message, "error"); }
        finally { setLoading(false); }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialFilter ? `Unificar envíos para ${initialFilter.proveedor}` : "Consolidar Envíos"}
        >
            <div className="space-y-4">
                <div className="max-h-[450px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {availableGroups.length <= 1 && (
                        <div className="p-10 text-center text-gray-400 italic text-xs uppercase tracking-widest font-bold">
                            {initialFilter
                                ? "No hay otros pedidos compatibles"
                                : "No hay pedidos disponibles"}
                        </div>
                    )}
                    {availableGroups.map((group) => {
                        const isSel = selected.find(s => s.id === group.id);
                        return (
                            <div
                                key={group.id}
                                onClick={() => handleToggle(group)}
                                className={`
                                    p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-4 group
                                    ${isSel ? 'border-indigo-500 bg-indigo-50/50 shadow-sm' : 'bg-white border-gray-100 hover:border-gray-200'}
                                `}
                            >
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSel ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-gray-200 group-hover:border-gray-300'}`}>
                                    {isSel && <Icon name="Check" size={12} strokeWidth={4} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="text-[11px] font-black text-gray-800 truncate uppercase tracking-wide">{group.clientName}</div>
                                        <div className="text-[9px] font-black text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">#{group.orderVisualId}</div>
                                    </div>
                                    <div className="text-[10px] text-indigo-600 font-bold uppercase tracking-tight flex items-center gap-2">
                                        <span>{group.clientCity}</span>
                                        <span className="text-gray-300">•</span>
                                        <span>{group.proveedor_nombre}</span>
                                    </div>
                                    <div className="text-[9px] text-gray-400 mt-1 uppercase font-bold">
                                        {group.orderStatus} • {group.items.length} {group.items.length === 1 ? 'ítem' : 'ítems'}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <Button variant="secondary" onClick={onClose} className="text-[10px]">Cancelar</Button>
                    {selected.length >= 2 && (
                        <Button onClick={handleLink} isLoading={loading} className="bg-indigo-600 hover:bg-indigo-700 px-6 text-[10px] font-black tracking-widest uppercase">
                            Unificar {selected.length} Pedidos
                        </Button>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default LinkOrdersModal;