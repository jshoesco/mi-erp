import React from 'react';
import Modal from '../Modal';
import Button from '../Button';
import { Input, NumberInput, Select } from '../Inputs';
import SmartSelect from '../SmartSelect';
import ImageUploader from '../ui/ImageUploader';
import { formatCurrency } from '../../lib/utils';

const ResellModal = ({ 
    isOpen, 
    onClose, 
    item, // resellItem
    form, // resellForm
    setForm, 
    onSave, 
    financeMethods, 
    isBank, 
    onFileSelect, 
    uploading 
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Revender Producto">
            <div className="space-y-5">
                {/* Resumen del Producto */}
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200 text-sm flex justify-between items-center shadow-sm">
                    <div>
                        <span className="text-indigo-800 block text-xs uppercase font-bold mb-1">Producto a Revender</span>
                        <span className="font-black text-lg text-indigo-900 block">{item?.modelo}</span>
                    </div>
                    <div className="text-right">
                         <span className="text-xs text-indigo-400 font-bold uppercase block">Costo Base</span>
                         <span className="font-bold text-indigo-700">{formatCurrency(item?.costo)}</span>
                    </div>
                </div>

                {/* Datos del Nuevo Cliente */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Nuevo Cliente" placeholder="Nombre completo" value={form.cliente} onChange={e => setForm({...form, cliente: e.target.value})} />
                    <NumberInput label="Precio Venta" value={form.precio} onChange={e => setForm({...form, precio: e.target.value})} className="font-bold text-emerald-600" />
                </div>

                {/* Logística de Reventa */}
                <Select label="Tipo Entrega" value={form.tipo_entrega} onChange={e => setForm({...form, tipo_entrega: e.target.value})}>
                    <option value="Personal">Entrega Personal (Cobro Inmediato)</option>
                    <option value="Envío">Envío Nacional</option>
                </Select>
                
                {form.tipo_entrega === 'Envío' && (
                    <Input label="Ciudad Destino" value={form.ciudad} onChange={e => setForm({...form, ciudad: e.target.value})} />
                )}

                {/* Cobro Inmediato (Solo si es Personal) */}
                {form.tipo_entrega === 'Personal' && (
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 animate-fade-in space-y-3">
                        <label className="text-xs font-bold text-emerald-800 block uppercase">Registro de Ingreso</label>
                        <SmartSelect 
                            label="Método de Pago" 
                            value={form.metodo} 
                            onChange={e => setForm({...form, metodo: e.target.value})} 
                            options={financeMethods} 
                            placeholder="Seleccionar..." 
                        />
                        {isBank && (
                            <div className="pt-2">
                                <ImageUploader 
                                    image={form.imagen} 
                                    onFileSelect={onFileSelect} 
                                    loading={uploading} 
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Botones */}
                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button onClick={onSave} disabled={uploading} className="bg-brand-dark hover:bg-black shadow-lg">
                        Confirmar Venta
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ResellModal;