import React from 'react';
import OrderFormModal from '../modals/OrderFormModal';
import GuideModal from '../modals/GuideModal';
import PaymentModal from '../modals/PaymentModal';

const OrdersModals = ({ ui }) => {
    const { type, data } = ui.modal || {};

    return (
        <>
            <OrderFormModal
                isOpen={type === 'order'}
                onClose={() => ui.closeModal()}
                orderToEdit={data} // <--- 'data' contiene el pedido de la base de datos
            />

            <GuideModal
                isOpen={type === 'guide'}
                onClose={() => ui.closeModal()}
                data={data}
            />

            <PaymentModal
                isOpen={type === 'payment'}
                onClose={() => ui.closeModal()}
                data={data}
            />
        </>
    );
};

export default OrdersModals;