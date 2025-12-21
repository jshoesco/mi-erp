import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import { Input } from '../../ui/Inputs';
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
            
            // Agrupar items por pedido para hacer menos lecturas
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

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Registrar Pago">
            <div className="space-y-6">
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {items.map((it) => {
                        const debt = Math.max(0, ((Number(it.costo) || 0) + (Number(it.costo_envio_asignado) || 0)) - (Number(it.pago_proveedor) || 0));
                        const isSelected = !!selectedItems[it.unique_id];

                        return (
                            <div key={it.unique_id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isSelected ? 'border-indigo-600 bg-indigo-50/30' : 'bg-gray-50'}`}>
                                <input 
                                    type="checkbox" 
                                    checked={isSelected} 
                                    onChange={() => handleToggleItem(it.unique_id, debt)}
                                    className="w-4 h-4 rounded border-gray-300 text-indigo-600"
                                />
                                <div className="flex-1 min-w-0 text-[11px]">
                                    <div className="font-bold truncate">{it.modelo}</div>
                                    <div className="text-gray-400 font-mono text-[9px] uppercase">{it.sku} | {it.clientName}</div>
                                </div>
                                <div className="w-24">
                                    <input 
                                        type="number"
                                        disabled={!isSelected}
                                        value={selectedItems[it.unique_id] || ''}
                                        onChange={(e) => setSelectedItems({...selectedItems, [it.unique_id]: e.target.value})}
                                        className="w-full p-1.5 text-right text-xs font-black rounded-lg border bg-white"
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="col-span-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase">Método</label>
                        <select 
                            className="w-full p-2 bg-gray-50 border rounded-lg text-sm font-bold"
                            value={paymentData.metodo}
                            onChange={e => setPaymentData({...paymentData, metodo: e.target.value})}
                        >
                            <option value="">Seleccionar...</option>
                            {/* CORRECCIÓN: Accediendo a m.name para evitar el error de objeto */}
                            {financeMethods.map((m, idx) => (
                                <option key={idx} value={m.name}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                    <Input label="Referencia" value={paymentData.referencia} onChange={e => setPaymentData({...paymentData, referencia: e.target.value})} />
                    <Input type="date" label="Fecha" value={paymentData.fecha} onChange={e => setPaymentData({...paymentData, fecha: e.target.value})} />
                </div>

                <div className="flex justify-between items-center bg-brand-dark p-4 rounded-2xl text-white">
                    <div>
                        <div className="text-[9px] opacity-60 font-black uppercase">Monto Total</div>
                        <div className="text-lg font-black">{formatCurrency(totalAmount)}</div>
                    </div>
                    <Button onClick={handleConfirmPayment} isLoading={loading} className="bg-brand-red px-6 text-[10px] font-black">
                        PAGAR AHORA
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default PaymentModal;