import React, { useState, useEffect } from 'react';
import Modal from '../../ui/Modal'; // Asegúrate de que la ruta a tu Modal base sea correcta
import Button from '../../ui/Button';
import Icon from '../../ui/Icon';
import { db } from '../../../lib/firebase';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import { useUI } from '../../../context/UIContext';

const AnomalyModal = ({ isOpen, onClose, order, reasons, shipping }) => {
    const { notify } = useUI();
    const [selectedIds, setSelectedIds] = useState([]);
    const [details, setDetails] = useState({});
    const [loading, setLoading] = useState(false);

    // Limpiar estado cuando se abre con un nuevo pedido
    useEffect(() => {
        if (isOpen) {
            setSelectedIds([]);
            setDetails({});
        }
    }, [isOpen, order]);

    const toggleSelection = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(i => i !== id));
        } else {
            setSelectedIds(prev => [...prev, id]);
            // Valores por defecto al seleccionar
            const firstReason = reasons?.[0]?.motivo || 'Defecto';
            setDetails(prev => ({ 
                ...prev, 
                [id]: { 
                    motivo: firstReason, 
                    accion: 'Devolver a Proveedor', 
                    ubicacion: order?.cliente?.ciudad_entrega || '',
                    guia_retorno: '' 
                } 
            }));
        }
    };

    const updateDetail = (id, field, val) => {
        setDetails(prev => {
            const newState = { ...prev, [id]: { ...prev[id], [field]: val } };
            // Si cambia el motivo, intentar predecir la acción si existe en la config
            if (field === 'motivo') {
                const config = reasons.find(r => r.motivo === val);
                if (config?.accion) newState[id].accion = config.accion;
            }
            return newState;
        });
    };

    const handleSave = async () => {
        if (selectedIds.length === 0) return notify("Selecciona al menos un producto", "error");
        
        setLoading(true);
        try {
            const updatedItems = order.items.map(item => {
                if (selectedIds.includes(item.unique_id)) {
                    const d = details[item.unique_id];
                    return { 
                        ...item, 
                        devolucion: { 
                            fecha: new Date().toISOString(), 
                            motivo: d.motivo,
                            accion: d.accion,
                            ubicacion: d.accion === 'Stock (Revender)' ? d.ubicacion : null,
                            guia_retorno: d.guia_retorno || '',
                            estado: d.accion === 'Stock (Revender)' ? 'En Retorno' : 'Pendiente'
                        } 
                    };
                }
                return item;
            });

            await updateDoc(doc(db, 'pedidos', order.id), { items: updatedItems });
            notify("Novedad registrada correctamente");
            onClose();
        } catch (e) {
            notify("Error al registrar novedad: " + e.message, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Reportar Novedad - #${order?.id_visual}`}>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <p className="text-sm text-gray-500 italic">Selecciona los productos con novedad:</p>
                
                {order?.items.map(it => (
                    <div key={it.unique_id} className={`p-3 border rounded-lg transition-colors ${selectedIds.includes(it.unique_id) ? 'border-brand-red bg-red-50' : 'border-gray-200'}`}>
                        <div className="flex items-center gap-3 mb-2">
                            <input 
                                type="checkbox" 
                                checked={selectedIds.includes(it.unique_id)}
                                onChange={() => toggleSelection(it.unique_id)}
                                className="w-4 h-4 accent-brand-red"
                            />
                            <span className="font-bold text-sm">{it.modelo}</span>
                        </div>

                        {selectedIds.includes(it.unique_id) && (
                            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-red-100">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Motivo</label>
                                    <select 
                                        className="text-xs p-1.5 border rounded"
                                        value={details[it.unique_id]?.motivo}
                                        onChange={(e) => updateDetail(it.unique_id, 'motivo', e.target.value)}
                                    >
                                        {reasons.map(r => <option key={r.motivo} value={r.motivo}>{r.motivo}</option>)}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Acción</label>
                                    <select 
                                        className="text-xs p-1.5 border rounded"
                                        value={details[it.unique_id]?.accion}
                                        onChange={(e) => updateDetail(it.unique_id, 'accion', e.target.value)}
                                    >
                                        <option value="Devolver a Proveedor">Devolver a Proveedor</option>
                                        <option value="Stock (Revender)">Stock (Revender)</option>
                                        <option value="Perdida Total">Pérdida Total</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                <div className="flex justify-end gap-2 pt-4 border-t sticky bottom-0 bg-white">
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} isLoading={loading} className="bg-brand-red text-white">
                        Registrar Novedad
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default AnomalyModal;