import React from 'react';
import Modal from '../Modal';
import Button from '../Button';
import { Input, Select } from '../Inputs';
import Icon from '../Icon';

const AnomalyModal = ({ 
    isOpen, 
    onClose, 
    items, // anomalyItems
    selectedIds, // selectedAnomalyIds
    toggleSelection, 
    details, // anomalyDetails
    updateDetail, 
    onSave, 
    reasons, 
    shipping, // Para saber donde hay acopios
    currentOrder 
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Gestionar Devolución/Rechazo">
            <div className="space-y-5">
                <p className="text-sm text-gray-500 font-medium">Selecciona los productos que presentan novedad:</p>
                
                {/* Lista de Productos */}
                <div className="max-h-64 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                    {items.map((item, idx) => {
                        const isSelected = selectedIds.includes(item.unique_id);
                        const itemDetails = details[item.unique_id] || {};
                        
                        return (
                            <div key={idx} className={`border rounded-xl p-3 transition-all duration-200 ${isSelected ? 'bg-red-50 border-brand-red shadow-sm' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                                <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleSelection(item.unique_id)}>
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-brand-red border-brand-red text-white' : 'border-gray-300 bg-white'}`}>
                                        {isSelected && <Icon name="Check" size={12}/>}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-sm text-gray-800">{item.modelo}</div>
                                        <div className="text-xs text-gray-500 flex gap-2">
                                            <span>Talla: {item.talla || '-'}</span>
                                            <span className="text-gray-300">|</span>
                                            <span className="font-mono">{item.sku}</span>
                                        </div>
                                    </div>
                                </div>

                                {isSelected && (
                                    <div className="mt-4 pl-8 grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Motivo</label>
                                            <select className="w-full text-xs p-2.5 border rounded-lg bg-white outline-none focus:border-brand-red" value={itemDetails.motivo || ''} onChange={e => updateDetail(item.unique_id, 'motivo', e.target.value)}>
                                                {reasons.map((r, i) => (<option key={i} value={r.motivo}>{r.motivo}</option>))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Acción / Destino</label>
                                            <select className="w-full text-xs p-2.5 border rounded-lg bg-white outline-none focus:border-brand-red" value={itemDetails.accion || 'Devolver a Proveedor'} onChange={e => updateDetail(item.unique_id, 'accion', e.target.value)}>
                                                <option value="Devolver a Proveedor">Devolver a Proveedor</option>
                                                <option value="Stock (Revender)">Stock (Revender)</option>
                                                <option value="Desechar">Desechar / Pérdida</option>
                                            </select>
                                        </div>

                                        {/* UBICACIÓN DINÁMICA SI ES STOCK */}
                                        {itemDetails.accion === 'Stock (Revender)' && (
                                            <div className="md:col-span-2 bg-indigo-50 p-3 rounded-lg border border-indigo-100 grid grid-cols-2 gap-3 mt-1">
                                                <div className="col-span-2 md:col-span-1">
                                                    <label className="text-[10px] font-bold text-indigo-700 uppercase block mb-1">¿Dónde queda?</label>
                                                    <select className="w-full text-xs p-2 border border-indigo-200 rounded-lg bg-white text-indigo-900 font-bold outline-none" value={itemDetails.ubicacion || ''} onChange={e => updateDetail(item.unique_id, 'ubicacion', e.target.value)}>
                                                        <option value={currentOrder?.cliente?.ciudad_entrega}>En {currentOrder?.cliente?.ciudad_entrega} (Actual)</option>
                                                        {shipping.filter(s => s.tiene_acopio && s.ciudad !== currentOrder?.cliente?.ciudad_entrega).map(s => (
                                                            <option key={s.id} value={`Acopio ${s.ciudad}`}>Mover a Acopio {s.ciudad}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                {/* GUÍA DE RETORNO SI SE MUEVE */}
                                                {itemDetails.ubicacion !== currentOrder?.cliente?.ciudad_entrega && (
                                                    <div className="col-span-2 md:col-span-1">
                                                        <label className="text-[10px] font-bold text-indigo-700 uppercase block mb-1">Guía Traslado</label>
                                                        <input className="w-full text-xs p-2 border border-indigo-200 rounded-lg bg-white outline-none" placeholder="# Guía..." value={itemDetails.guia_retorno || ''} onChange={e => updateDetail(item.unique_id, 'guia_retorno', e.target.value)} />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Botones */}
                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button onClick={onSave} variant="danger" disabled={selectedIds.length === 0} className="shadow-lg shadow-red-500/20">
                        Confirmar Novedad
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default AnomalyModal;