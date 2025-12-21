import React, { useState } from 'react';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import { Input } from '../../ui/Inputs';
import { db } from '../../../lib/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { useUI } from '../../../context/UIContext';

const ResellModal = ({ isOpen, onClose, item, financeMethods }) => {
    const { notify } = useUI();
    const [form, setForm] = useState({ precio: '', cliente: '', metodo: '' });
    const [loading, setLoading] = useState(false);

    const handleResell = async () => {
        if (!form.precio || !form.cliente) return notify("Faltan datos", "error");
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
            // Marcar original como revendido
            const oldOrderRef = doc(db, 'pedidos', item.orderId);
            // ... (Lógica de actualización de items originales aquí)
            await batch.commit();
            notify("Producto revendido");
            onClose();
        } catch (e) { notify(e.message, "error"); }
        setLoading(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Revender Producto">
            <div className="space-y-4">
                <Input label="Cliente Nuevo" value={form.cliente} onChange={e => setForm({...form, cliente: e.target.value})} />
                <Input label="Precio Venta" type="number" value={form.precio} onChange={e => setForm({...form, precio: e.target.value})} />
                <Button onClick={handleResell} className="w-full" isLoading={loading}>Confirmar Reventa</Button>
            </div>
        </Modal>
    );
};
export default ResellModal;