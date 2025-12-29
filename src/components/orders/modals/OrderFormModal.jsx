import React, { useState, useEffect } from 'react';
import ModalLayout from '../../ui/layout/ModalLayout';
import OrderCreateForm from '../parts/order-form';
import { useOrdersActions } from '../logic/useOrdersActions';
import { useUI } from '../../../context/UIContext';
import { SCHEMA } from '../../../constants/schema';
import { Button } from '../../ui/display/Button';

const S = SCHEMA.ORDERS;
const C = S.CLIENT;

const INITIAL_STATE = {
    [C.ROOT]: { [C.NAME]: '', [C.TEL]: '', [C.ADDRESS]: '', [C.CITY]: '' },
    [S.ITEMS]: [],
    [S.SHIPPING_COST]: 0,
    [S.STATUS]: 'Pendiente',
    [S.STRATEGY]: 'DIRECTO'
};

const OrderFormModal = ({ isOpen, onClose, orderToEdit = null }) => {
    const [formData, setFormData] = useState(INITIAL_STATE);
    const [isSaving, setIsSaving] = useState(false);
    const { saveOrder } = useOrdersActions();
    const { notify } = useUI();

    useEffect(() => {
        if (isOpen) {
            if (orderToEdit) {
                // MAPEO 100% ESTRICTO: Eliminamos IS_ACOPIO
                setFormData({
                    id: orderToEdit.id,
                    [S.ID_ORDER]: orderToEdit[S.ID_ORDER] || '',
                    [C.ROOT]: {
                        [C.NAME]: orderToEdit[C.ROOT]?.[C.NAME] || '',
                        [C.TEL]: orderToEdit[C.ROOT]?.[C.TEL] || '',
                        [C.ADDRESS]: orderToEdit[C.ROOT]?.[C.ADDRESS] || '',
                        [C.CITY]: orderToEdit[C.ROOT]?.[C.CITY] || '',
                    },
                    [S.ITEMS]: orderToEdit[S.ITEMS] || [],
                    [S.SHIPPING_COST]: Number(orderToEdit[S.SHIPPING_COST] || 0),
                    [S.STATUS]: orderToEdit[S.STATUS] || 'Pendiente',
                    [S.STRATEGY]: orderToEdit[S.STRATEGY] || 'DIRECTO'
                });
            } else {
                setFormData(INITIAL_STATE);
            }
        }
    }, [orderToEdit, isOpen]);

    const handleSubmit = async () => {
        const clienteData = formData[C.ROOT];
        const nombreValido = clienteData?.[C.NAME]?.trim();
        const tieneItems = formData[S.ITEMS]?.length > 0;

        if (!nombreValido || !tieneItems) {
            return notify("Nombre del cliente e ítems son obligatorios", "error");
        }

        try {
            setIsSaving(true);
            await saveOrder(formData);
            notify(orderToEdit ? "Pedido actualizado" : "Pedido registrado", "success");
            onClose();
        } catch (error) {
            notify("Error al guardar el pedido", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <ModalLayout
            isOpen={isOpen}
            onClose={onClose}
            title={orderToEdit ? "Editar Orden" : "Nueva Orden de Venta"}
            size="max-w-5xl"
            actions={(
                <div className="flex gap-4">
                    <Button variant="ghost" onClick={onClose} disabled={isSaving}>CANCELAR</Button>
                    <Button onClick={handleSubmit} disabled={isSaving} className="bg-brand-red text-white px-8">
                        {isSaving ? "PROCESANDO..." : (orderToEdit ? "GUARDAR CAMBIOS" : "REGISTRAR PEDIDO")}
                    </Button>
                </div>
            )}
        >
            <div className="py-4">
                <OrderCreateForm formData={formData} setFormData={setFormData} />
            </div>
        </ModalLayout>
    );
};

export default OrderFormModal;