import React from 'react';
import CustomerSection from './sections/customer';
import ItemsEditor from './sections/items';
import ProfitPreview from './sections/profit';
import { useOrderFormLogic } from './logic/useOrderFormLogic';
import { SCHEMA } from '../../../../constants/schema';

const OrderCreateForm = ({ formData, setFormData }) => {

    const S = SCHEMA.ORDERS;
    const C = S.CLIENT;

    // Normalización estricta al SCHEMA antes de pasar al estado del formulario
    const normalizedData = React.useMemo(() => {
        if (!formData) return formData;
        return {
            ...formData,
            [C.ROOT]: {
                [C.NAME]: formData[C.ROOT]?.[C.NAME] || formData.cliente?.nombre || '',
                [C.TEL]: formData[C.ROOT]?.[C.TEL] || formData.cliente?.telefono || '',
                [C.CITY]: formData[C.ROOT]?.[C.CITY] || formData.ciudad || formData.cliente?.ciudad || '',
                [C.ADDRESS]: formData[C.ROOT]?.[C.ADDRESS] || formData.cliente?.direccion || '',
                [C.IS_ACOPIO]: formData[C.ROOT]?.[C.IS_ACOPIO] || formData.es_acopio || false
            }
        };
    }, [formData]);

    const logic = useOrderFormLogic(normalizedData, setFormData);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* SECCIÓN CLIENTE: Recibe el estado para que su propio especialista (useCustomerLogic) trabaje */}
            <CustomerSection
                form={formData}
                setForm={setFormData}
            />

            {/* SECCIÓN ITEMS: 100% Genérica */}
            <ItemsEditor
                items={formData.items || []}
                setItems={(newItems) => setFormData(prev => ({ ...prev, items: newItems }))}
            />

            {/* VISTA DE BENEFICIOS: Inteligencia Financiera en tiempo real */}
            {(formData.items?.length > 0 || formData.ciudad) && (
                <ProfitPreview formData={formData} />
            )}
        </div>
    );
};

export default OrderCreateForm;