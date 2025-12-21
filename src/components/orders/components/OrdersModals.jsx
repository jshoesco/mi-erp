import React from 'react';
import OrderFormModal from '../modals/OrderFormModal';
import LinkOrdersModal from '../modals/LinkOrdersModal';
import GuideModal from '../modals/GuideModal';
import PaymentModal from '../modals/PaymentModal';
import AnomalyModal from '../modals/AnomalyModal';
// IMPORTAMOS LOS FANTASMAS
import DeliveryModal from '../modals/DeliveryModal';
import ResellModal from '../modals/ResellModal';
import ClientPayModal from '../modals/ClientPayModal';
import ShippingLabelModal from '../modals/ShippingLabelModal';

const OrdersModals = ({ modals, onClose, config }) => (
    <>
        <OrderFormModal isOpen={modals.form.open} onClose={() => onClose('form')} order={modals.form.data} />
        <LinkOrdersModal isOpen={modals.link.open} onClose={() => onClose('link')} initialFilter={modals.link.data} />
        <GuideModal isOpen={modals.guide.open} onClose={() => onClose('guide')} order={modals.guide.data} />
        <PaymentModal isOpen={modals.payment.open} onClose={() => onClose('payment')} items={modals.payment.data} financeMethods={config.financeMethods} />
        <AnomalyModal isOpen={modals.anomaly.open} onClose={() => onClose('anomaly')} order={modals.anomaly.data} reasons={config.anomalyReasons} />

        {/* AGREGADOS */}
        <DeliveryModal
            isOpen={modals.delivery.open}
            onClose={() => onClose('delivery')}
            data={modals.delivery.data} // Pasamos la data genérica, el modal debe procesarla
            financeMethods={config.financeMethods}
        />
        <ResellModal
            isOpen={modals.resell.open}
            onClose={() => onClose('resell')}
            item={modals.resell.data}
        />
        <ClientPayModal
            isOpen={modals.clientPay.open}
            onClose={() => onClose('clientPay')}
            order={modals.clientPay.data}
            financeMethods={config.financeMethods}
        />
        <ShippingLabelModal
            isOpen={modals.shippingLabel.open}
            onClose={() => onClose('shippingLabel')}
            items={modals.shippingLabel.data}
        />
    </>
);

export default OrdersModals;