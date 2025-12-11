import React from 'react';
import Modal from '../Modal';
import Button from '../Button';
import { Input, NumberInput } from '../Inputs';
import SmartSelect from '../SmartSelect';
import ImageUploader from '../ImageUploader';
import Icon from '../Icon';
import { formatCurrency } from '../../lib/utils';

const ClientPayModal = ({ 
    isOpen, 
    onClose, 
    order, 
    form, 
    setForm, 
    financeMethods, 
    isBank, 
    onFileSelect, 
    uploading, 
    onSave 
}) => {
    
    const saldoPendiente = (order?.total || 0) - (order?.pago_cliente || 0);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Cobrar al Cliente">
            <div className="space-y-5">
                
                {/* Resumen del Pedido */}
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 text-sm space-y-2 shadow-inner">
                    <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="text-gray-500">Cliente:</span> 
                        <b className="text-gray-900 text-lg">{order?.cliente?.nombre}</b>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Total Pedido:</span> 
                        <b>{formatCurrency(order?.total)}</b>
                    </div>
                    <div className="flex justify-between text-brand-red pt-2 mt-2 border-t border-gray-200">
                        <span className="font-bold uppercase text-xs">Saldo Pendiente:</span> 
                        <b className="text-xl">{formatCurrency(saldoPendiente)}</b>
                    </div>
                </div>

                {/* Formulario */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <NumberInput 
                        label="Monto Recibido" 
                        value={form.monto} 
                        onChange={e => setForm({ ...form, monto: e.target.value })} 
                        className="font-bold text-gray-800 text-lg"
                    />
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Método</label>
                        <SmartSelect 
                            label="" 
                            displayProp="name" 
                            valueProp="name"
                            value={form.metodo} 
                            onChange={e => setForm({ ...form, metodo: e.target.value })} 
                            options={financeMethods} 
                            placeholder="Buscar método..." 
                        />
                    </div>
                </div>

                {/* Comprobante */}
                {isBank && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3 animate-fade-in">
                        <Input 
                            label="Número de Transacción" 
                            value={form.transaction_id} 
                            onChange={e => setForm({ ...form, transaction_id: e.target.value })} 
                            placeholder="Ej: 098213" 
                        />
                        <ImageUploader 
                            image={form.imagen} 
                            onFileSelect={onFileSelect} 
                            loading={uploading} 
                            onClear={() => setForm({ ...form, imagen: '' })} 
                        />
                    </div>
                )}

                {/* Botones */}
                <div className="pt-2 flex justify-end gap-3 border-t border-gray-100">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button onClick={onSave} disabled={uploading} className="bg-emerald-600 hover:bg-emerald-700 shadow-lg">
                        Confirmar Cobro
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ClientPayModal;