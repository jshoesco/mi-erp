import React from 'react';
import CustomerSection from './sections/customer';
import StrategySection from './sections/strategy'; // LA PIEZA QUE FALTABA
import ItemsEditor from './sections/items';
import ProfitPreview from './sections/profit';
import { SCHEMA } from '../../../../constants/schema';

const OrderCreateForm = ({ formData, setFormData }) => {

    const S = SCHEMA.ORDERS;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* 1. QUIÉN: Sección de Cliente (Solo Datos de Contacto) */}
            <CustomerSection
                form={formData}
                setForm={setFormData}
            />

            {/* 2. CÓMO: Nueva sección de Estrategia (Maneja su propia lógica) */}
            <StrategySection
                form={formData}
                setForm={setFormData}
            />

            {/* 3. QUÉ: Los productos */}
            <ItemsEditor
                items={formData[S.ITEMS] || []}
                setItems={(newItems) => setFormData(prev => ({
                    ...prev,
                    [S.ITEMS]: newItems
                }))}
            />

            {/* 4. FINANZAS: Solo si hay datos para calcular */}
            {(formData[S.ITEMS]?.length > 0 || formData[SCHEMA.ORDERS.CLIENT.ROOT]?.[SCHEMA.ORDERS.CLIENT.CITY]) && (
                <ProfitPreview formData={formData} />
            )}
        </div>
    );
};

export default OrderCreateForm;