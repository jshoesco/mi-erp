import React, { useState, useMemo } from 'react';
import ModalLayout from '../../../../../ui/layout/ModalLayout';
import { Button } from '../../../../../ui/display/Button';
import Input from '../../../../../ui/forms/Input';
import Select from '../../../../../ui/forms/Select';
import Dropzone from '../../../../../ui/Dropzone';
import { SCHEMA } from '../../../../../../constants/schema';

export const PaymentModal = ({ isOpen, onClose, group, onConfirm }) => {
    const S = SCHEMA.ORDERS;
    const I = S.ITEM;

    // ESTADOS PARA FINANZAS
    const [method, setMethod] = useState('TRANSFERENCIA');
    const [referenceId, setReferenceId] = useState('');
    const [evidenceUrl, setEvidenceUrl] = useState(null);

    const [payments, setPayments] = useState(() => {
        return group?.orders?.map(order => ({
            id: order.id,
            id_visual: order[S.ID_ORDER],
            totalCost: order[S.ITEMS]?.reduce((acc, item) => acc + (Number(item[I.COST]) || 0), 0),
            alreadyPaid: order.logistics?.pago_acumulado || 0,
            payingNow: order[S.ITEMS]?.reduce((acc, item) => acc + (Number(item[I.COST]) || 0), 0) - (order.logistics?.pago_acumulado || 0)
        })) || [];
    });

    const totalToPay = useMemo(() => payments.reduce((acc, p) => acc + p.payingNow, 0), [payments]);
    const isBankTransfer = method === 'TRANSFERENCIA';

    const handleConfirm = () => {
        // Validación brutal: Si es banco, exige comprobante
        if (isBankTransfer && !referenceId) {
            alert('El número de comprobante es obligatorio para transferencias.');
            return;
        }

        onConfirm({
            totalAmount: totalToPay,
            method: method,
            referenceId: referenceId,
            evidenceUrl: evidenceUrl,
            orders: payments
        });
    };

    if (!isOpen) return null;

    return (
        <ModalLayout isOpen={isOpen} onClose={onClose} title="Registro de Pago a Proveedor">
            <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                    <p className="text-[10px] font-black text-slate-500 uppercase">Monto Total a Transferir</p>
                    <p className="text-3xl font-black text-emerald-400 font-mono">${totalToPay.toLocaleString()}</p>
                </div>

                {/* CONFIGURACIÓN DEL PAGO */}
                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Método de Pago"
                        value={method}
                        onChange={(e) => setMethod(e.target.value)}
                        options={[
                            { value: 'TRANSFERENCIA', label: 'Transferencia Bancaria' },
                            { value: 'EFECTIVO', label: 'Efectivo / Caja' },
                            { value: 'SALDO_FAVOR', label: 'Saldo a Favor' }
                        ]}
                    />
                    {isBankTransfer && (
                        <Input
                            label="Nº Comprobante / Ref"
                            placeholder="Ej: 123456"
                            value={referenceId}
                            onChange={(e) => setReferenceId(e.target.value)}
                        />
                    )}
                </div>

                {isBankTransfer && (
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-2">
                        <Dropzone
                            label="Subir Comprobante (Imagen)"
                            onUploadSuccess={(url) => setEvidenceUrl(url)}
                        />
                    </div>
                )}

                <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Desglose por Pedido</p>
                    {payments.map((p, idx) => (
                        <div key={p.id} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400">#{p.id_visual}</p>
                                <p className="text-xs font-bold text-slate-700">Deuda: ${(p.totalCost - p.alreadyPaid).toLocaleString()}</p>
                            </div>
                            <div className="w-24">
                                <Input
                                    type="number"
                                    value={p.payingNow}
                                    onChange={(e) => {
                                        const newPayments = [...payments];
                                        newPayments[idx].payingNow = Number(e.target.value);
                                        setPayments(newPayments);
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex gap-2 sticky bottom-0 bg-white pt-2">
                    <Button variant="secondary" className="flex-1 uppercase font-black" onClick={onClose}>Cancelar</Button>
                    <Button variant="primary" className="flex-1 font-black uppercase" onClick={handleConfirm}>Confirmar Pago</Button>
                </div>
            </div>
        </ModalLayout>
    );
};