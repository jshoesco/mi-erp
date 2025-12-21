import React from 'react';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import Icon from '../../ui/Icon';
import { Input } from '../../ui/Inputs';
import { formatCurrency } from '../../../lib/utils';
// Importamos el nuevo componente
import PaymentSection from '../../PaymentSection';

const DeliveryModal = ({ 
    isOpen, 
    onClose, 
    form, 
    setForm, 
    onSave, 
    financeMethods, 
    onFileSelect, 
    uploading 
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Confirmar Entrega">
            <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-sm text-emerald-800 flex items-center gap-3">
                    <Icon name="CheckCircle" size={24}/> 
                    <span>Estás marcando como entregado(s) <b>{form.items.length} productos</b>.</span>
                </div>

                <Input 
                    type="date" 
                    label="Fecha Entrega" 
                    value={form.date} 
                    onChange={e => setForm({...form, date: e.target.value})} 
                />

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="text-xs font-bold text-slate-500 block mb-2 uppercase">Estado del Pago de Envío</label>
                    
                    {form.ya_pagado ? (
                        <div className="text-sm font-bold text-slate-400 line-through bg-slate-100 p-2 rounded inline-block">
                            Pagado Anticipado: {formatCurrency(form.costo_total)}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm font-bold text-slate-700 bg-white p-2 rounded border">
                                <span>A Pagar:</span>
                                <span>{formatCurrency(form.costo_total)}</span>
                            </div>

                            {/* Solo pedir pago si hay deuda */}
                            {Number(form.costo_total) > 0 && (
                                <PaymentSection 
                                    form={form}
                                    setForm={setForm}
                                    financeMethods={financeMethods}
                                    uploading={uploading}
                                    onFileSelect={onFileSelect}
                                />
                            )}

                            {Number(form.costo_total) === 0 && (
                                <div className="text-xs text-emerald-600 font-bold italic bg-emerald-50 p-2 rounded">
                                    Envío gratuito o cubierto ($0).
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="pt-2 flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button onClick={onSave} disabled={uploading} className="bg-emerald-600 hover:bg-emerald-700">
                        Confirmar Entrega
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default DeliveryModal;