import React, { useState, useEffect } from 'react';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import { Input } from '../../ui/Input';
import ImageUploader from '../../ui/ImageUploader';
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
        
        // 1. Validaciones
        if (!form.numero) return notify("Número de guía obligatorio", "error");
        if (!order || !order.id) return notify("Error: Pedido no identificado", "error");
        if (form.anticipado && (!form.costo_envio || !form.metodo)) {
            return notify("Faltan datos del pago anticipado", "error");
        }

        setLoading(true);
        try {
            const batch = writeBatch(db);
            const orderRef = doc(db, 'pedidos', order.id);

            // 2. Crear nuevos items sin usar funciones de array complejas
            const updatedItems = [];
            const originalItems = order.items || [];
            
            for (let i = 0; i < originalItems.length; i++) {
                updatedItems.push({
                    ...originalItems[i],
                    guia: {
                        numero: form.numero,
                        fecha: form.fecha,
                        anticipado: form.anticipado,
                        costo: Number(form.costo_envio) || 0
                    }
                });
            }

            // 3. Egreso en Finanzas
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

            // 4. Actualizar Pedido
            batch.update(orderRef, { 
                items: updatedItems, 
                estado: 'Enviado' 
            });

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

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Despachar #${order?.id_visual}`}>
            <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <Input label="Nro Guía" value={form.numero} onChange={e => setForm({...form, numero: e.target.value})} />
                    <Input label="Fecha" type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} />
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                    <Input 
                        label="Costo del Envío ($)" 
                        type="number" 
                        value={form.costo_envio} 
                        onChange={e => setForm({...form, costo_envio: e.target.value})} 
                    />
                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="ant"
                            checked={form.anticipado} 
                            onChange={e => setForm({...form, anticipado: e.target.checked})}
                            className="w-4 h-4 accent-brand-dark"
                        />
                        <label htmlFor="ant" className="text-xs font-bold text-gray-600">¿Pagado por anticipado?</label>
                    </div>
                </div>

                {form.anticipado && (
                    <div className="space-y-3 p-4 bg-indigo-50/30 border border-indigo-100 rounded-xl">
                        <select 
                            className="w-full p-2.5 border rounded-lg text-sm bg-white"
                            value={form.metodo}
                            onChange={e => setForm({...form, metodo: e.target.value})}
                        >
                            <option value="">Seleccionar Caja/Banco...</option>
                            {financeMethods.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                        </select>
                        {isBank && (
                            <ImageUploader 
                                label="Comprobante"
                                currentImg={form.imagen}
                                onFileSelect={(url) => setForm({...form, imagen: url})}
                            />
                        )}
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" isLoading={loading} className="bg-brand-dark text-white px-8">Confirmar Envío</Button>
                </div>
            </form>
        </Modal>
    );
};

export default GuideModal;