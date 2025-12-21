import React from 'react';
import OrderFormModal from '../modals/OrderFormModal';
import LinkOrdersModal from '../modals/LinkOrdersModal';
import GuideModal from '../modals/GuideModal';
import PaymentModal from '../modals/PaymentModal';
import AnomalyModal from '../modals/AnomalyModal';

const OrdersModals = ({ modals, onClose, config }) => (
    <>
        <OrderFormModal isOpen={modals.form.open} onClose={() => onClose('form')} order={modals.form.data} />
        <LinkOrdersModal isOpen={modals.link.open} onClose={() => onClose('link')} initialFilter={modals.link.data} />
        <GuideModal isOpen={modals.guide.open} onClose={() => onClose('guide')} order={modals.guide.data} />
        <PaymentModal isOpen={modals.payment.open} onClose={() => onClose('payment')} items={modals.payment.data} financeMethods={config.financeMethods} />
        <AnomalyModal isOpen={modals.anomaly.open} onClose={() => onClose('anomaly')} order={modals.anomaly.data} reasons={config.anomalyReasons} />
    </>
);

export default OrdersModals;