import React, { useState, useEffect } from 'react';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import { Select } from '../../ui/Select'; // <--- Select Nuevo
import Checkbox from '../../ui/Checkbox'; // <--- Checkbox Nuevo
import { db } from '../../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useUI } from '../../../context/UIContext';

const AnomalyModal = ({ isOpen, onClose, order, reasons = [], shipping }) => {
    const { notify } = useUI();
    const [selectedIds, setSelectedIds] = useState([]);
    const [details, setDetails] = useState({});
    const [loading, setLoading] = useState(false);

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

    const Label = ({ children }) => (
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] ml-1 block mb-2">{children}</label>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Reportar Novedad - #${order?.id_visual}`}>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Selecciona los productos afectados:</p>

                {order?.items.map(it => (
                    <div key={it.unique_id} className={`p-4 border rounded-xl transition-all ${selectedIds.includes(it.unique_id) ? 'border-brand-red bg-red-50/50' : 'border-gray-100 bg-white'}`}>
                        <div className="flex items-center gap-4 mb-3">
                            <Checkbox
                                checked={selectedIds.includes(it.unique_id)}
                                onChange={() => toggleSelection(it.unique_id)}
                            />
                            <div className="flex-1">
                                <span className="font-black text-xs text-gray-800 uppercase block">{it.modelo}</span>
                                <span className="text-[10px] font-mono text-gray-400">{it.sku}</span>
                            </div>
                        </div>

                        {selectedIds.includes(it.unique_id) && (
                            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-red-100 animate-fade-in-down">
                                <div>
                                    <Label>Motivo</Label>
                                    <Select
                                        options={reasons.map(r => r.motivo)}
                                        value={details[it.unique_id]?.motivo}
                                        onChange={(e) => updateDetail(it.unique_id, 'motivo', e.target.value)}
                                        className="h-10 text-[10px]"
                                    />
                                </div>
                                <div>
                                    <Label>Acción a Tomar</Label>
                                    <Select
                                        options={['Devolver a Proveedor', 'Stock (Revender)', 'Perdida Total']}
                                        value={details[it.unique_id]?.accion}
                                        onChange={(e) => updateDetail(it.unique_id, 'accion', e.target.value)}
                                        className="h-10 text-[10px]"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 sticky bottom-0 bg-white/95 backdrop-blur py-2">
                    <Button variant="secondary" onClick={onClose} className="text-[10px]">Cancelar</Button>
                    <Button onClick={handleSave} isLoading={loading} className="bg-brand-red text-white px-6 text-[10px] font-black tracking-widest uppercase">
                        Confirmar Novedad
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default AnomalyModal;