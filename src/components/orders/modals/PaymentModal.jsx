import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import { Input, NumberInput } from '../../ui/Input';
import { Select } from '../../ui/Select'; // <--- El nuevo Select
import Checkbox from '../../ui/Checkbox'; // <--- Checkbox de la casa
import { formatCurrency } from '../../../lib/utils';
import { db } from '../../../lib/firebase';
import { doc, writeBatch, getDoc } from 'firebase/firestore';

const PaymentModal = ({ isOpen, onClose, items, financeMethods }) => {
    const [selectedItems, setSelectedItems] = useState({});
    const [paymentData, setPaymentData] = useState({ metodo: '', referencia: '', fecha: new Date().toISOString().slice(0, 10) });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && items) {
            const initial = {};
            items.forEach(it => {
                const debt = Math.max(0, ((Number(it.costo) || 0) + (Number(it.costo_envio_asignado) || 0)) - (Number(it.pago_proveedor) || 0));
                if (debt > 0) initial[it.unique_id] = debt;
            });
            setSelectedItems(initial);
        }
    }, [isOpen, items]);

    const totalAmount = useMemo(() => {
        return Object.values(selectedItems).reduce((sum, val) => sum + Number(val || 0), 0);
    }, [selectedItems]);

    const handleToggleItem = (id, debt) => {
        setSelectedItems(prev => {
            const newSelected = { ...prev };
            if (newSelected[id]) delete newSelected[id];
            else newSelected[id] = debt;
            return newSelected;
        });
    };

    const handleConfirmPayment = async () => {
        if (totalAmount <= 0 || !paymentData.metodo) return alert("Faltan datos");

        setLoading(true);
        try {
            const batch = writeBatch(db);
            const ordersToUpdate = [...new Set(items.map(i => i.orderId))];

            for (const orderId of ordersToUpdate) {
                const orderRef = doc(db, 'pedidos', orderId);
                const orderSnap = await getDoc(orderRef);

                if (orderSnap.exists()) {
                    const orderData = orderSnap.data();
                    const updatedItems = orderData.items.map(it => {
                        const paymentForThis = selectedItems[it.unique_id];
                        if (paymentForThis) {
                            return {
                                ...it,
                                pago_proveedor: (Number(it.pago_proveedor) || 0) + Number(paymentForThis)
                            };
                        }
                        return it;
                    });

                    batch.update(orderRef, { items: updatedItems });
                }
            }
            await batch.commit();
            onClose();
        } catch (e) {
            console.error("Error en pago:", e);
            alert("Error al procesar el pago");
        } finally {
            setLoading(false);
        }
    };

    // Componente Label auxiliar para mantener consistencia visual
    const Label = ({ children }) => (
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] ml-1 block mb-2">
            {children}
        </label>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Registrar Pago">
            <div className="space-y-6">
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {items.map((it) => {
                        const debt = Math.max(0, ((Number(it.costo) || 0) + (Number(it.costo_envio_asignado) || 0)) - (Number(it.pago_proveedor) || 0));
                        const isSelected = !!selectedItems[it.unique_id];

                        return (
                            <div key={it.unique_id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isSelected ? 'border-brand-red bg-red-50/20' : 'bg-gray-50 border-gray-100'}`}>
                                <Checkbox
                                    checked={isSelected}
                                    onChange={() => handleToggleItem(it.unique_id, debt)}
                                />
                                <div className="flex-1 min-w-0 text-[11px]">
                                    <div className="font-black uppercase text-gray-800 truncate">{it.modelo}</div>
                                    <div className="text-gray-400 font-mono text-[9px] uppercase tracking-wide">{it.sku} • {it.clientName}</div>
                                </div>
                                <div className="w-24">
                                    <NumberInput
                                        disabled={!isSelected}
                                        value={selectedItems[it.unique_id] || ''}
                                        onChange={(e) => setSelectedItems({ ...selectedItems, [it.unique_id]: Number(e.target.value) })}
                                        className="h-9 text-right font-black"
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                    <div className="col-span-2">
                        <Label>Método de Pago</Label>
                        <Select
                            options={financeMethods.map(m => m.name)}
                            value={paymentData.metodo}
                            onChange={e => setPaymentData({ ...paymentData, metodo: e.target.value })}
                            placeholder="Seleccionar Método..."
                        />
                    </div>
                    <Input label="Referencia" value={paymentData.referencia} onChange={e => setPaymentData({ ...paymentData, referencia: e.target.value })} />
                    <Input type="date" label="Fecha" value={paymentData.fecha} onChange={e => setPaymentData({ ...paymentData, fecha: e.target.value })} />
                </div>

                <div className="flex justify-between items-center bg-gray-900 p-5 rounded-2xl text-white shadow-xl shadow-gray-200">
                    <div>
                        <div className="text-[9px] opacity-60 font-black uppercase tracking-widest mb-1">Total a Pagar</div>
                        <div className="text-2xl font-black tracking-tighter text-brand-red">{formatCurrency(totalAmount)}</div>
                    </div>
                    <Button onClick={handleConfirmPayment} isLoading={loading} className="bg-brand-red hover:bg-red-600 px-8 h-12 text-[10px] font-black tracking-widest uppercase">
                        Confirmar Pago
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default PaymentModal;