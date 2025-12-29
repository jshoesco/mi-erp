import React, { useState } from 'react';
import { SCHEMA } from '../../../../constants/schema';
import { useLogisticsLogic } from './logic/useLogisticsLogic';
import TableView from './views/Table';
import KanbanView from './views/kanban/index';
import { Button } from '../../../ui/display/Button';
import Icon from '../../../ui/display/Icon';

// SOLO LO QUE ESTÁ VIVO Y FUNCIONA
import { PaymentModal } from './actions/payments/PaymentModal';
import { ShippingModal } from './actions/shipping/ShippingModal';

// CEREBRO PURIFICADO
import { useLogisticsActions } from './logic/useLogisticsActions';

const LogisticsView = ({ orders, search, ui }) => {
    const L = SCHEMA.LOGISTICS;

    const [viewMode, setViewMode] = useState('table');
    const [activeGroup, setActiveGroup] = useState(null);

    // ESTADO SIN RASTROS DE JOIN NI SPLIT
    const [modalState, setModalState] = useState({
        [L.MODAL_KEYS.PAYMENT]: false,
        [L.MODAL_KEYS.SHIPPING]: false
    });

    const { logisticsData } = useLogisticsLogic(orders, search);
    const { handleLogisticsAction, confirmModalAction } = useLogisticsActions(
        orders, ui, setModalState, setActiveGroup
    );

    return (
        <div className="flex flex-col h-full gap-4 px-6 pb-6">
            <Header viewMode={viewMode} setViewMode={setViewMode} />

            <main className="flex-1 overflow-auto">
                {viewMode === 'table' ? (
                    <TableView data={logisticsData} onAction={handleLogisticsAction} />
                ) : (
                    <KanbanView data={logisticsData} onAction={handleLogisticsAction} />
                )}
            </main>

            {/* MODALES ACTIVOS */}
            {modalState[L.MODAL_KEYS.PAYMENT] && (
                <PaymentModal
                    isOpen={modalState[L.MODAL_KEYS.PAYMENT]}
                    onClose={() => setModalState(prev => ({ ...prev, [L.MODAL_KEYS.PAYMENT]: false }))}
                    group={activeGroup}
                    onConfirm={(data) => confirmModalAction(L.MODAL_KEYS.PAYMENT, data, activeGroup)}
                />
            )}

            {modalState[L.MODAL_KEYS.SHIPPING] && (
                <ShippingModal
                    isOpen={modalState[L.MODAL_KEYS.SHIPPING]}
                    onClose={() => setModalState(prev => ({ ...prev, [L.MODAL_KEYS.SHIPPING]: false }))}
                    group={activeGroup}
                    onConfirm={(data) => confirmModalAction(L.MODAL_KEYS.SHIPPING, data)}
                />
            )}
        </div>
    );
};

const Header = ({ viewMode, setViewMode }) => (
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
);

export default LogisticsView;