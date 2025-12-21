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
                        // FILTRO CONTEXTUAL: Misma ciudad y proveedor
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
                        <div className="p-10 text-center text-gray-400 italic text-xs">
                            {initialFilter 
                                ? "No hay otros pedidos de este proveedor para esta ciudad." 
                                : "No hay pedidos disponibles para vincular."}
                        </div>
                    )}
                    {availableGroups.map((group) => {
                        const isSel = selected.find(s => s.id === group.id);
                        return (
                            <div 
                                key={group.id} 
                                onClick={() => handleToggle(group)} 
                                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${isSel ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'bg-white border-gray-100 hover:border-gray-200'}`}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <div className="text-[11px] font-black text-gray-800 truncate uppercase">{group.clientName}</div>
                                        <div className="text-[10px] font-black text-gray-400">#{group.orderVisualId}</div>
                                    </div>
                                    <div className="text-[9px] text-indigo-600 font-bold mt-1 uppercase tracking-tight">
                                        {group.clientCity} — {group.proveedor_nombre}
                                    </div>
                                    <div className="text-[8px] text-gray-400 mt-1 uppercase font-bold">
                                        {group.orderStatus} • {group.items.length} ítems
                                    </div>
                                </div>
                                {isSel && <Icon name="CheckCircle" className="text-indigo-600" size={18}/>}
                            </div>
                        );
                    })}
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="ghost" onClick={onClose}>Cerrar</Button>
                    {selected.length >= 2 && (
                        <Button onClick={handleLink} isLoading={loading} className="bg-indigo-600 text-white px-8">
                            Unificar {selected.length} Pedidos
                        </Button>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default LinkOrdersModal;