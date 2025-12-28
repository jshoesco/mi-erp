import React, { useState, useEffect } from 'react';
import ModalLayout from '../../ui/layout/ModalLayout';
import { Button } from '../../ui/display/Button';
import ProviderPaymentForm from '../parts/ProviderPaymentForm';
import { db } from '../../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useUI } from '../../../context/UIContext';

const PaymentModal = ({ isOpen, onClose, data }) => {
    const { notify } = useUI();
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState([]);

    useEffect(() => {
        if (data?.items) setItems(data.items);
    }, [data, isOpen]);

    const handleUpdatePayment = (itemId, value) => {
        setItems(prev => prev.map(it =>
            it.id === itemId ? { ...it, pago_provider: value } : it
        ));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const ref = doc(db, 'pedidos', data.id);
            await updateDoc(ref, { items });
            notify("Pagos actualizados", "success");
            onClose();
        } catch (e) {
            notify("Error al guardar pagos", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalLayout isOpen={isOpen} onClose={onClose} title="Pagos a Proveedor" size="md">
            <div className="p-6 space-y-4">
                <div className="max-h-[60vh] overflow-y-auto pr-2">
                    {items.map(item => (
                        <ProviderPaymentForm
                            key={item.id}
                            item={item}
                            onUpdatePayment={handleUpdatePayment}
                        />
                    ))}
                </div>
                <div className="pt-4 border-t border-slate-100">
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        className="w-full"
                        isLoading={loading}
                    >
                        Guardar Todos los Pagos
                    </Button>
                </div>
            </div>
        </ModalLayout>
    );
};

export default PaymentModal;