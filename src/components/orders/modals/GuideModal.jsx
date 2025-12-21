import React, { useState, useEffect } from 'react';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import { Input, NumberInput } from '../../ui/Input';
import { Select } from '../../ui/Select'; // <--- Select Nuevo
import Checkbox from '../../ui/Checkbox'; // <--- Checkbox Nuevo
import Dropzone from '../../ui/Dropzone'; // <--- Dropzone en vez de ImageUploader viejo
import { useUI } from '../../../context/UIContext';
import { useData } from '../../../context/DataContext';
import { db } from '../../../lib/firebase';
import { doc, writeBatch, collection } from 'firebase/firestore';

const GuideModal = ({ isOpen, onClose, order }) => {
    const { notify } = useUI();
    const { financeConfig } = useData();
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        numero: '',
        fecha: new Date().toISOString().slice(0, 10),
        costo_envio: '',
        anticipado: false,
        metodo: '',
        transaction_id: '',
        imagen: ''
    });

    const financeMethods = financeConfig?.methods || [];
    const isBank = financeMethods.find(m => m.name === form.metodo)?.isBank;

    useEffect(() => {
        if (isOpen) {
            setForm({
                numero: '',
                fecha: new Date().toISOString().slice(0, 10),
                costo_envio: '',
                anticipado: false,
                metodo: '',
                transaction_id: '',
                imagen: ''
            });
        }
    }, [isOpen]);

    const handleSave = async (e) => {
        if (e) e.preventDefault();

        if (!form.numero) return notify("Número de guía obligatorio", "error");
        if (!order || !order.id) return notify("Error: Pedido no identificado", "error");
        if (form.anticipado && (!form.costo_envio || !form.metodo)) {
            return notify("Faltan datos del pago anticipado", "error");
        }

        setLoading(true);
        try {
            const batch = writeBatch(db);
            const orderRef = doc(db, 'pedidos', order.id);

            const updatedItems = order.items.map(item => ({
                ...item,
                guia: {
                    numero: form.numero,
                    fecha: form.fecha,
                    anticipado: form.anticipado,
                    costo: Number(form.costo_envio) || 0
                }
            }));

            if (form.anticipado && Number(form.costo_envio) > 0) {
                const finRef = doc(collection(db, 'finanzas'));
                batch.set(finRef, {
                    tipo: 'Gasto',
                    categoria: 'Envío',
                    monto: Number(form.costo_envio),
                    metodo: form.metodo,
                    imagen: form.imagen || '',
                    fecha: new Date().toISOString(),
                    concepto: `Pago Flete Guía #${form.numero} - Pedido #${order.id_visual}`
                });
            }

            batch.update(orderRef, { items: updatedItems, estado: 'Enviado' });

            await batch.commit();
            notify("Pedido despachado correctamente", "success");
            onClose();
        } catch (error) {
            console.error("Error en GuideModal:", error);
            notify("Error crítico: " + error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const Label = ({ children }) => (
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] ml-1 block mb-2">{children}</label>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Despachar #${order?.id_visual}`}>
            <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Nro Guía" value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} autoFocus />
                    <Input label="Fecha" type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} />
                </div>

                <div className="p-5 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-4">
                    <NumberInput
                        label="Costo del Envío"
                        value={form.costo_envio}
                        onChange={e => setForm({ ...form, costo_envio: e.target.value })}
                    />
                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100">
                        <Checkbox
                            checked={form.anticipado}
                            onChange={() => setForm({ ...form, anticipado: !form.anticipado })}
                        />
                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wide cursor-pointer" onClick={() => setForm({ ...form, anticipado: !form.anticipado })}>
                            ¿Flete Pagado Anticipado?
                        </span>
                    </div>
                </div>

                {form.anticipado && (
                    <div className="space-y-4 p-5 bg-indigo-50/20 border border-indigo-100 rounded-2xl animate-fade-in-down">
                        <div>
                            <Label>Método de Pago</Label>
                            <Select
                                options={financeMethods.map(m => m.name)}
                                value={form.metodo}
                                onChange={e => setForm({ ...form, metodo: e.target.value })}
                                placeholder="Seleccionar..."
                            />
                        </div>
                        {isBank && (
                            <Dropzone
                                value={form.imagen}
                                onChange={(files) => {
                                    // Aquí iría tu lógica de subida, por ahora simulamos
                                    if (files[0]) notify("Subida pendiente de implementación real");
                                }}
                                loading={false}
                            />
                        )}
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <Button type="button" variant="secondary" onClick={onClose} className="text-[10px]">Cancelar</Button>
                    <Button type="submit" isLoading={loading} className="bg-brand-dark px-8 text-[10px] font-black tracking-widest uppercase">
                        Confirmar Envío
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default GuideModal;