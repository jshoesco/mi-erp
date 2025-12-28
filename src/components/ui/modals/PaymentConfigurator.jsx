import React, { useState, useEffect, useMemo } from 'react';
import ModalLayout from '../layout/ModalLayout';
import { Input, NumberInput } from '../forms/Controls';
import { Select } from '../forms/Select';
import { Button } from '../display/Button';
import { TextLabel, PriceText } from '../display/Typography';
import Checkbox from '../Checkbox';

const PaymentConfigurator = ({
    isOpen,
    onClose,
    items = [], // Formato: { id, title, subtitle, debt }
    methods = [],
    onConfirm,
    title = "Registrar Pago"
}) => {
    const [selectedItems, setSelectedItems] = useState({});
    const [paymentData, setPaymentData] = useState({
        metodo: '', referencia: '', fecha: new Date().toISOString().slice(0, 10)
    });

    useEffect(() => {
        if (isOpen) {
            const initial = {};
            items.forEach(it => { if (it.debt > 0) initial[it.id] = it.debt; });
            setSelectedItems(initial);
        }
    }, [isOpen, items]);

    const totalAmount = useMemo(() =>
        Object.values(selectedItems).reduce((s, v) => s + Number(v || 0), 0)
        , [selectedItems]);

    const handleConfirm = () => {
        if (totalAmount <= 0 || !paymentData.metodo) return;
        onConfirm(selectedItems, paymentData); // Devolvemos la bola al padre
    };

    return (
        <ModalLayout
            isOpen={isOpen} onClose={onClose} title={title} size="max-w-3xl"
            actions={
                <div className="flex gap-6 items-center w-full justify-between bg-slate-900 p-6 rounded-[2.5rem] text-white">
                    <div className="flex flex-col">
                        <TextLabel className="text-white/50">Monto Seleccionado</TextLabel>
                        <div className="text-2xl font-black"><PriceText value={totalAmount} /></div>
                    </div>
                    <Button onClick={handleConfirm} variant="brand" className="px-10 h-14" icon="Check">Confirmar</Button>
                </div>
            }
        >
            <div className="space-y-8">
                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                    {items.map((it) => {
                        const isSelected = !!selectedItems[it.id];
                        return (
                            <div key={it.id} className={`flex items-center gap-5 p-5 rounded-[1.8rem] border transition-all ${isSelected ? 'border-brand-red bg-red-50/20' : 'bg-slate-50 border-gray-100'}`}>
                                <Checkbox checked={isSelected} onChange={() => {
                                    setSelectedItems(prev => {
                                        const next = { ...prev };
                                        isSelected ? delete next[it.id] : next[it.id] = it.debt;
                                        return next;
                                    });
                                }} />
                                <div className="flex-1">
                                    <div className="font-black text-[11px] text-slate-900 uppercase">{it.title}</div>
                                    <TextLabel>{it.subtitle}</TextLabel>
                                </div>
                                <div className="w-32">
                                    <NumberInput disabled={!isSelected} value={selectedItems[it.id] || ''}
                                        onChange={(e) => setSelectedItems({ ...selectedItems, [it.id]: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="grid grid-cols-2 gap-6 bg-slate-50/50 p-8 rounded-[2.5rem] border border-gray-100">
                    <div className="col-span-2">
                        <Select label="Método" options={methods} value={paymentData.metodo}
                            onChange={e => setPaymentData({ ...paymentData, metodo: e.target.value })}
                        />
                    </div>
                    <Input label="Referencia" value={paymentData.referencia} onChange={e => setPaymentData({ ...paymentData, referencia: e.target.value })} />
                    <Input type="date" label="Fecha" value={paymentData.fecha} onChange={e => setPaymentData({ ...paymentData, fecha: e.target.value })} />
                </div>
            </div>
        </ModalLayout>
    );
};

export default PaymentConfigurator;