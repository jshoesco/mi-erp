import React, { useState } from 'react';
import { useLogisticsLogic } from './logic/useLogisticsLogic';
import TableView from './views/Table';
import { Button } from '../../../ui/display/Button';
import Icon from '../../../ui/display/Icon';
import { useOrderJoin } from './logic/useOrderJoin';
import JoinModal from './actions/JoinModal';

// ACCIONES
import { PaymentModal, usePaymentAction } from './actions/payments';
import { ShippingModal, useShippingAction } from './actions/shipping';

const LogisticsView = ({ orders, search, ui }) => {
    const [viewMode, setViewMode] = useState('table');
    const { logisticsData } = useLogisticsLogic(orders, search);
    const { joinOrders } = useOrderJoin(ui?.notify);

    const [activeGroup, setActiveGroup] = useState(null);
    const [modalState, setModalState] = useState({ payment: false, shipping: false, join: false });

    const handleAction = (type, data) => {
        if (type === 'open_join') {
            setActiveGroup(data);
            setModalState(prev => ({ ...prev, join: true }));
            return;
        }
        setActiveGroup(data);
        if (type === 'pay') setModalState(prev => ({ ...prev, payment: true }));
        if (type === 'guide') setModalState(prev => ({ ...prev, shipping: true }));
    };

    const confirmJoin = async (orderIds, masterAddress) => {
        // Mapeamos los IDs a objetos para el hook
        const selectedOrders = orders.filter(o => orderIds.includes(o.id));
        const success = await joinOrders(selectedOrders, masterAddress);
        if (success) setModalState(prev => ({ ...prev, join: false }));
    };

    return (
        <div className="flex flex-col h-full gap-4 px-6 pb-6">
            <div className="flex justify-between items-center">
                <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">Logística Operativa</h2>
                <div className="bg-slate-100 p-1 rounded-lg flex gap-1 border border-slate-200">
                    <Button variant={viewMode === 'table' ? 'primary' : 'secondary'} className="p-1.5 h-7 w-7" onClick={() => setViewMode('table')}>
                        <Icon name="list" size={12} />
                    </Button>
                    <Button variant={viewMode === 'kanban' ? 'primary' : 'secondary'} className="p-1.5 h-7 w-7" onClick={() => setViewMode('kanban')}>
                        <Icon name="columns" size={12} />
                    </Button>
                </div>
            </div>

            <main className="flex-1 overflow-auto">
                <TableView data={logisticsData} onAction={handleAction} notify={ui?.notify} />
            </main>

            {modalState.join && (
                <JoinModal
                    isOpen={modalState.join}
                    onClose={() => setModalState(prev => ({ ...prev, join: false }))}
                    baseOrder={activeGroup}
                    allOrders={orders}
                    onConfirm={confirmJoin}
                />
            )}

            {/* Resto de modales (Payment y Shipping) iguales... */}
        </div>
    );
};

export default LogisticsView;