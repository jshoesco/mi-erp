import React, { useState, useEffect } from 'react';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import { Input, NumberInput } from '../../ui/Input';
import { Select } from '../../ui/Select';
import Dropzone from '../../ui/Dropzone';
import { formatCurrency } from '../../../lib/utils';
import { useUI } from '../../../context/UIContext';
import { db } from '../../../lib/firebase';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';

const ClientPayModal = ({
    isOpen,
    onClose,
    order,
    financeMethods = []
}) => {
    const { notify } = useUI();
    const [uploading, setUploading] = useState(false);

    // ESTADO INTERNO (AUTÓNOMO)
    const [form, setForm] = useState({
        monto: '',
        metodo: '',
        transaction_id: '',
        imagen: ''
    });

    // Calcular saldo y resetear formulario al abrir
    const saldoPendiente = (order?.total || 0) - (order?.pago_cliente || 0);

    useEffect(() => {
        if (isOpen && order) {
            // Sugerir el saldo pendiente completo por defecto
            const pendiente = Math.max(0, (order.total || 0) - (order.pago_cliente || 0));
            setForm({
                monto: pendiente,
                metodo: '',
                transaction_id: '',
                imagen: ''
            });
        }
    }, [isOpen, order]);

    // Detectar si el método es banco
    const selectedMethod = financeMethods.find(m => m.name === form.metodo);
    const isBank = selectedMethod?.isBank;

    const handleSave = async () => {
        if (!form.monto || Number(form.monto) <= 0) return notify("Ingresa un monto válido", "error");
        if (!form.metodo) return notify("Selecciona un método de pago", "error");

        setUploading(true);
        try {
            // 1. Registrar Ingreso en Finanzas
            await addDoc(collection(db, 'finanzas'), {
                tipo: 'Ingreso',
                categoria: 'Venta', // O 'Cobro Cliente' según tu config
                monto: Number(form.monto),
                metodo: form.metodo,
                fecha: new Date().toISOString(),
                concepto: `Cobro Pedido #${order.id_visual} - ${order.cliente?.nombre}`,
                imagen: form.imagen || '',
                transaction_id: form.transaction_id || ''
            });

            // 2. Actualizar el Pedido (Sumar al pago existente)
            const nuevoPagoTotal = (Number(order.pago_cliente) || 0) + Number(form.monto);
            const nuevoEstado = nuevoPagoTotal >= order.total ? 'Pagado' : order.estado; // Opcional: cambiar estado si paga todo

            await updateDoc(doc(db, 'pedidos', order.id), {
                pago_cliente: nuevoPagoTotal,
                // Si quieres que cambie estado automágicamente descomenta esto:
                // estado: nuevoEstado 
            });

            notify(`Cobro de ${formatCurrency(form.monto)} registrado`);
            onClose();
        } catch (e) {
            console.error(e);
            notify("Error al registrar cobro: " + e.message, "error");
        } finally {
            setUploading(false);
        }
    };

    const Label = ({ children }) => (
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] ml-1 block mb-2">{children}</label>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Cobrar al Cliente">
            <div className="space-y-6">

                {/* Resumen del Pedido */}
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 text-sm space-y-3 shadow-inner">
                    <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente</span>
                        <b className="text-gray-900 text-sm uppercase">{order?.cliente?.nombre}</b>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Pedido</span>
                        <b className="font-mono text-gray-700">{formatCurrency(order?.total)}</b>
                    </div>
                    <div className="flex justify-between items-center text-brand-red pt-2 mt-2 border-t border-gray-200">
                        <span className="text-[10px] font-black uppercase tracking-widest">Saldo Pendiente</span>
                        <b className="text-xl font-black tracking-tight">{formatCurrency(saldoPendiente)}</b>
                    </div>
                </div>

                {/* Formulario */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <NumberInput
                        label="Monto Recibido"
                        value={form.monto}
                        onChange={e => setForm({ ...form, monto: e.target.value })}
                        className="font-black text-gray-800 text-lg h-12"
                        autoFocus
                    />
                    <div>
                        <Label>Método de Pago</Label>
                        <Select
                            options={financeMethods.map(m => m.name)}
                            value={form.metodo}
                            onChange={e => setForm({ ...form, metodo: e.target.value })}
                            placeholder="Seleccionar..."
                            className="h-12"
                        />
                    </div>
                </div>

                {/* Comprobante (Solo si es banco) */}
                {isBank && (
                    <div className="bg-indigo-50/30 p-4 rounded-xl border border-indigo-100 space-y-4 animate-fade-in-down">
                        <Input
                            label="Número de Transacción / Ref"
                            value={form.transaction_id}
                            onChange={e => setForm({ ...form, transaction_id: e.target.value })}
                            placeholder="Ej: 098213"
                        />
                        <Dropzone
                            value={form.imagen}
                            onChange={(files) => {
                                if (files && files[0]) {
                                    // Aquí asumimos que Dropzone maneja la subida o devuelve el archivo para subirlo en handleSave
                                    // Para este ejemplo simple, asumimos que subimos en handleSave o Dropzone ya devolvió URL (depende de tu Dropzone)
                                    // Si tu Dropzone necesita subir YA, adapta esto.
                                    // Voy a asumir que solo guardamos el file en el state y lo subimos (o simulamos)
                                    notify("Archivo seleccionado (Implementar subida real si es necesario)");
                                    setForm({ ...form, imagen: "url_simulada_o_archivo" });
                                }
                            }}
                            loading={uploading}
                            label="Comprobante del Cliente"
                        />
                    </div>
                )}

                {/* Botones */}
                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                    <Button variant="secondary" onClick={onClose} className="text-[10px]">Cancelar</Button>
                    <Button onClick={handleSave} disabled={uploading} isLoading={uploading} className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 px-8 h-12 text-[10px] font-black uppercase tracking-widest">
                        Confirmar Cobro
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ClientPayModal;