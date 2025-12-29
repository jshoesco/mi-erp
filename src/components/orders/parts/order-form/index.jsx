import React from 'react';
import CustomerSection from './sections/customer';
import StrategySection from './sections/strategy';
import OrderItemsEditor from './sections/items'; // Limpio y único
import OrderProfit from './sections/profit';     // El nombre real del componente
import { SCHEMA } from '../../../../constants/schema';

const OrderCreateForm = ({ formData, setFormData }) => {
    const S = SCHEMA.ORDERS;

    // Handler centralizado para mantener el JSX limpio
    const handleItemsChange = (newItems) => {
        setFormData(prev => ({
            ...prev,
            [S.ITEMS]: newItems
        }));
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* 1. QUIÉN: Cliente */}
            <CustomerSection
                form={formData}
                setForm={setFormData}
            />

            {/* 2. CÓMO: Estrategia y Logística */}
            <StrategySection
                form={formData}
                setForm={setFormData}
            />

            {/* 3. QUÉ: Productos (Items) */}
            <OrderItemsEditor
                items={formData[S.ITEMS] || []}
                setItems={handleItemsChange}
            />

            {/* 4. RESULTADO: Profit (Él decide si se muestra si tiene items) */}
            <OrderProfit formData={formData} />
        </div>
    );
};

export default OrderCreateForm;