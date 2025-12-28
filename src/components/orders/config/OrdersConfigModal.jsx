import React from 'react';
import ConfigSheet from '../../ui/layout/ConfigSheet';
import StatesTab from './tabs/StatesTab';
import PaymentsTab from './tabs/PaymentsTab';
import CoverageTab from './tabs/coverage'; // Al llamarse index.jsx, solo apuntas a la carpeta

const OrdersConfigModal = ({ isOpen, onClose }) => {
    const orderTabs = [
        { id: 'estados', label: 'Estados', icon: 'list', component: <StatesTab /> },
        { id: 'pagos', label: 'Pagos', icon: 'credit-card', component: <PaymentsTab /> },
        { id: 'cobertura', label: 'Cobertura', icon: 'map-pin', component: <CoverageTab /> }
    ];

    return (
        <ConfigSheet
            isOpen={isOpen}
            onClose={onClose}
            title="CONFIGURACIÓN DE PEDIDOS"
            tabs={orderTabs}
        />
    );
};

export default OrdersConfigModal;