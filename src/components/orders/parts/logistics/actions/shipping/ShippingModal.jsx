import React, { useState } from 'react';
import ModalLayout from '../../../../../ui/layout/ModalLayout';
import { Button } from '../../../../../ui/display/Button';
import Input from '../../../../../ui/forms/Input';

export const ShippingModal = ({ isOpen, onClose, group, onConfirm }) => {
    const [carrier, setCarrier] = useState('INTERRAPIDISIMO');
    const [guideNumber, setGuideNumber] = useState('');

    const handleSubmit = () => {
        if (!guideNumber) return alert('Debes ingresar el número de guía');
        onConfirm({ carrier, guideNumber });
        onClose();
    };

    return (
        <ModalLayout isOpen={isOpen} onClose={onClose} title="Asignar Guía de Despacho">
            <div className="space-y-4">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <p className="text-[10px] font-black text-blue-400 uppercase">Destino</p>
                    <p className="text-sm font-bold text-blue-900">{group?.city}</p>
                    <p className="text-[10px] text-blue-600">{group?.ordersCount} pedidos en este paquete</p>
                </div>

                <Input
                    label="Transportadora"
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value.toUpperCase())}
                />

                <Input
                    label="Número de Guía"
                    placeholder="Ej: 7000123456"
                    value={guideNumber}
                    onChange={(e) => setGuideNumber(e.target.value)}
                />

                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="secondary" onClick={onClose}>CANCELAR</Button>
                    <Button variant="primary" onClick={handleSubmit}>DESPACHAR PEDIDOS</Button>
                </div>
            </div>
        </ModalLayout>
    );
};

export default ShippingModal;