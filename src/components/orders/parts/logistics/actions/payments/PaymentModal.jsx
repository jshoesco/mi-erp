import React, { useState, useMemo } from 'react';
import ModalLayout from '../../../../../ui/layout/ModalLayout';
import { Button } from '../../../../../ui/display/Button';
import Input from '../../../../../ui/forms/Input';

export const PaymentModal = ({ isOpen, onClose, group, onConfirm }) => {
    const [amount, setAmount] = useState('');

    // Calculamos el costo total que se le debe al proveedor por este lote
    const totalCostToProvider = useMemo(() => {
        if (!group?.orders) return 0;
        return group.orders.reduce((acc, order) => {
            const orderCost = order.items?.reduce((itemAcc, item) => itemAcc + (Number(item.costo) || 0), 0) || 0;
            return acc + orderCost;
        }, 0);
    }, [group]);

    const handleSubmit = () => {
        const enteredAmount = Number(amount);

        // REGLA DE ORO: Solo cambia el status si el pago es completo
        if (enteredAmount !== totalCostToProvider) {
            alert(`PAGO DENEGADO: El monto debe ser exacto ($${totalCostToProvider.toLocaleString()}). Estás ingresando $${enteredAmount.toLocaleString()}`);
            return;
        }

        onConfirm({
            amount: enteredAmount,
            method: 'transferencia'
        });
    };

    return (
        <ModalLayout isOpen={isOpen} onClose={onClose} title="Validar Pago a Proveedor">
            <div className="p-4 space-y-4">
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 shadow-inner">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Deuda de este Lote</p>
                    <p className="text-3xl font-black text-emerald-400 font-mono">
                        ${totalCostToProvider.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 italic italic">Suma de costos de {group?.ordersCount} pedidos</p>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Monto de la transferencia</label>
                    <Input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 pt-2">
                    <Button variant="secondary" className="flex-1" onClick={onClose}>CANCELAR</Button>
                    <Button variant="primary" className="flex-1 font-black" onClick={handleSubmit}>REGISTRAR PAGO</Button>
                </div>
            </div>
        </ModalLayout>
    );
};