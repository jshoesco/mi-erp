import React, { useState } from 'react';
import ModalLayout from '../../ui/layout/ModalLayout';
import { Button } from '../../ui/display/Button';
import { Input } from '../../ui/forms/Input';
import Select from '../../ui/forms/Select';
import { db } from '../../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useUI } from '../../../context/UIContext';

const GuideModal = ({ isOpen, onClose, data }) => {
    const { notify } = useUI();
    const [loading, setLoading] = useState(false);
    const [guide, setGuide] = useState({
        numero: data?.guia?.numero || '',
        transportadora: data?.guia?.transportadora || ''
    });

    const handleSave = async () => {
        if (!guide.numero || !guide.transportadora) {
            return notify("Completa todos los campos de envío", "error");
        }

        setLoading(true);
        try {
            const ref = doc(db, 'pedidos', data.id);
            await updateDoc(ref, {
                guia: guide,
                estado: 'Enviado' // Al poner guía, el pedido escala automáticamente
            });
            notify("Guía asignada correctamente", "success");
            onClose();
        } catch (error) {
            notify("Error al guardar guía", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalLayout isOpen={isOpen} onClose={onClose} title="Asignar Despacho" size="sm">
            <div className="p-6 space-y-4">
                <Select
                    label="Transportadora"
                    value={guide.transportadora}
                    onChange={(val) => setGuide(prev => ({ ...prev, transportadora: val }))}
                    options={[
                        { id: 'interrapidisimo', label: 'Interrapidisimo' },
                        { id: 'envia', label: 'Envia' },
                        { id: 'servientrega', label: 'Servientrega' }
                    ]}
                />
                <Input
                    label="Número de Guía"
                    value={guide.numero}
                    onChange={(e) => setGuide(prev => ({ ...prev, numero: e.target.value }))}
                    placeholder="Ej: 123456789"
                />
                <div className="pt-4">
                    <Button
                        variant="primary"
                        className="w-full"
                        onClick={handleSave}
                        isLoading={loading}
                    >
                        Confirmar Envío
                    </Button>
                </div>
            </div>
        </ModalLayout>
    );
};

export default GuideModal;