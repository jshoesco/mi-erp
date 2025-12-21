import React, { useState } from 'react';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import { Input, NumberInput } from '../../ui/Input'; // Ruta corregida
import { db } from '../../../lib/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { useUI } from '../../../context/UIContext';

const ResellModal = ({ isOpen, onClose, item, financeMethods }) => {
    const { notify } = useUI();
    const [form, setForm] = useState({ precio: '', cliente: '', metodo: '' });
    const [loading, setLoading] = useState(false);

    const handleResell = async () => {
        if (!form.precio || !form.cliente) return notify("Faltan datos obligatorios", "error");
        setLoading(true);
        try {
            const batch = writeBatch(db);
            const newOrderRef = doc(collection(db, 'pedidos'));
            const newOrder = {
                cliente: { nombre: form.cliente, telefono: '0000000000', direccion: 'Reventa' },
                items: [{ ...item, precio: Number(form.precio), total: Number(form.precio), devolucion: null, unique_id: crypto.randomUUID() }],
                total: Number(form.precio),
                estado: 'Completado',
                fecha: new Date().toISOString(),
                id_visual: Date.now().toString().slice(-6)
            };
            batch.set(newOrderRef, newOrder);

            // Aquí iría la lógica para marcar el item original como revendido si fuera necesario
            // Por ahora solo crea el nuevo pedido como pediste en el original

            await batch.commit();
            notify("Producto revendido exitosamente");
            onClose();
        } catch (e) { notify(e.message, "error"); }
        setLoading(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Revender Producto">
            <div className="space-y-5 p-2">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs text-gray-500 mb-2">
                    Estás creando un nuevo pedido automático para el producto: <br />
                    <b className="text-gray-800 uppercase">{item?.modelo}</b>
                </div>

                <Input
                    label="Nombre Cliente Nuevo"
                    value={form.cliente}
                    onChange={e => setForm({ ...form, cliente: e.target.value })}
                    autoFocus
                />
                <NumberInput
                    label="Precio de Venta"
                    value={form.precio}
                    onChange={e => setForm({ ...form, precio: e.target.value })}
                />

                <div className="pt-2">
                    <Button onClick={handleResell} className="w-full h-12 text-[10px] font-black uppercase tracking-widest" isLoading={loading}>
                        Confirmar Reventa
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
export default ResellModal;