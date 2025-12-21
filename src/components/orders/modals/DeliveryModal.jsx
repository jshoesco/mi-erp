import React, { useState, useEffect } from 'react';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import Icon from '../../ui/Icon';
import { Input } from '../../ui/Input'; // <--- CORREGIDO (Sin 's')
import { formatCurrency } from '../../../lib/utils';
import PaymentSection from '../../PaymentSection';
import { useUI } from '../../../context/UIContext';
import { db } from '../../../lib/firebase';
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';

const DeliveryModal = ({ isOpen, onClose, data, financeMethods }) => {
    const { notify } = useUI();
    const [uploading, setUploading] = useState(false);

    // Estado interno inicializado
    const [form, setForm] = useState({
        date: new Date().toISOString().slice(0, 10),
        items: [],
        costo_total: 0,
        ya_pagado: false,
        metodo: '',
        transaction_id: '',
        imagen: ''
    });

    // Cargar datos cuando se abre el modal
    useEffect(() => {
        if (isOpen && data) {
            // Asumimos que 'data' es un array de items o un objeto con items
            const itemsToDeliver = Array.isArray(data) ? data : (data.items || []);

            // Calculamos deuda de envío
            const totalShippingCost = itemsToDeliver.reduce((sum, item) => {
                const guideCost = item.guia?.costo || 0;
                const wasPrepaid = item.guia?.anticipado === true;
                return sum + (wasPrepaid ? 0 : Number(guideCost));
            }, 0);

            const isPrepaid = itemsToDeliver.every(i => i.guia?.anticipado === true);

            setForm({
                date: new Date().toISOString().slice(0, 10),
                items: itemsToDeliver,
                costo_total: totalShippingCost,
                ya_pagado: isPrepaid,
                metodo: '',
                transaction_id: '',
                imagen: ''
            });
        }
    }, [isOpen, data]);

    const handleSave = async () => {
        if (!form.ya_pagado && form.costo_total > 0 && !form.metodo) {
            return notify("Selecciona un método de pago para el envío", "error");
        }

        setUploading(true);
        try {
            // Agrupar por pedido para hacer updates
            const orderIds = [...new Set(form.items.map(it => it.orderId))];

            // 1. Registrar gasto si aplica
            if (form.costo_total > 0 && !form.ya_pagado) {
                await addDoc(collection(db, 'finanzas'), {
                    tipo: 'Gasto',
                    categoria: 'Envío',
                    monto: Number(form.costo_total),
                    metodo: form.metodo,
                    fecha: form.date,
                    concepto: `Pago Contraentrega - ${orderIds.length} Pedidos`,
                    imagen: form.imagen || ''
                });
            }

            // 2. Actualizar Pedidos
            await Promise.all(orderIds.map(id =>
                updateDoc(doc(db, 'pedidos', id), {
                    estado: 'Entregado',
                    fecha_entrega: form.date
                })
            ));

            notify("Entregas registradas exitosamente");
            onClose();
        } catch (e) {
            notify(e.message, "error");
        } finally {
            setUploading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Confirmar Entrega">
            <div className="space-y-5">
                <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl text-sm text-emerald-800 flex items-center gap-4 shadow-sm">
                    <div className="bg-emerald-100 p-2 rounded-full text-emerald-600">
                        <Icon name="CheckCircle" size={24} />
                    </div>
                    <div>
                        <span className="block font-bold text-emerald-900 uppercase text-xs tracking-wider mb-1">Confirmación</span>
                        <span>Marcando como entregados <b>{form.items.length} productos</b>.</span>
                    </div>
                </div>

                <Input
                    type="date"
                    label="Fecha Real de Entrega"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                />

                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                    <label className="text-[10px] font-black text-gray-400 block mb-3 uppercase tracking-widest">Estado del Pago de Envío</label>

                    {form.ya_pagado ? (
                        <div className="text-xs font-bold text-gray-400 line-through bg-gray-100 px-3 py-2 rounded-lg border border-gray-200 inline-block">
                            Pagado Anticipado: {formatCurrency(form.costo_total)}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm font-black text-gray-700 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                <span className="uppercase text-[10px] tracking-widest text-gray-400">Total a Pagar</span>
                                <span className="text-lg text-brand-red">{formatCurrency(form.costo_total)}</span>
                            </div>

                            {Number(form.costo_total) > 0 && (
                                <PaymentSection
                                    form={form}
                                    setForm={setForm}
                                    financeMethods={financeMethods}
                                    uploading={uploading}
                                    // Adaptador simple si usas Dropzone en PaymentSection
                                    onFileSelect={(file) => setForm(p => ({ ...p, imagen: file }))}
                                />
                            )}

                            {Number(form.costo_total) === 0 && (
                                <div className="text-[10px] text-emerald-600 font-bold bg-emerald-50 p-2 rounded-lg text-center uppercase tracking-wide border border-emerald-100">
                                    Envío gratuito ($0).
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="pt-2 flex justify-end gap-3 border-t border-gray-100">
                    <Button variant="secondary" onClick={onClose} className="text-[10px]">Cancelar</Button>
                    <Button onClick={handleSave} disabled={uploading} isLoading={uploading} className="bg-emerald-600 hover:bg-emerald-700 px-6 text-[10px] font-black uppercase tracking-widest">
                        Confirmar Entrega
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default DeliveryModal;