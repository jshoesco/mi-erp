import React, { useState } from 'react';
import { useOrders } from './logic/useOrders';
import { useSelection } from '../../hooks/useSelection';
import { useBatchActions } from '../../hooks/useBatchActions';

import HeaderPortal from '../ui/HeaderPortal';
import ActionBar from '../ui/actionbar/index';
import { Button, ConfigButton } from '../ui/display/Button';
import SelectionToggle from '../ui/display/SelectionToggle';

// LOS NUEVOS DIRECTORES DE ORQUESTA
import SalesSection from './parts/sales';
import LogisticsSection from './parts/logistics';

import OrdersModals from './components/OrdersModals';
import OrdersConfigModal from './config/OrdersConfigModal';
import { DB } from '../../constants/collections';
import { SCHEMA } from '../../constants/schema';

const OrdersView = () => {
    const { orders, tab, setTab, search, ui, barActions } = useOrders();
    const selection = useSelection();
    const { archiveItems, deleteItems } = useBatchActions(DB.ORDERS);
    const [isConfigOpen, setIsConfigOpen] = useState(false);

    const handleExecuteAction = (actionType) => {
        if (actionType === 'archive') {
            archiveItems(selection.selectedIds, SCHEMA.ORDERS.ARCHIVED, tab !== 'archived');
        } else if (actionType === 'delete') {
            deleteItems(selection.selectedIds);
        }
        selection.clear();
    };

    const finalActions = barActions.map(action => ({
        ...action,
        onClick: () => handleExecuteAction(action.actionType)
    }));

    return (
        <div className="flex flex-col h-full bg-slate-50/50">
            <HeaderPortal>
                <ConfigButton onClick={() => setIsConfigOpen(true)} />
                <div className="flex items-center gap-2 bg-white p-1 rounded-full shadow-sm border border-slate-100">
                    {['sales', 'logistics', 'archived'].map(t => (
                        <Button
                            key={t}
                            variant={tab === t ? 'primary' : 'secondary'}
                            onClick={() => setTab(t)}
                            className="rounded-full px-6 h-9 text-[11px] font-black uppercase"
                        >
                            {t === 'sales' ? 'Ventas' : t === 'logistics' ? 'Logística' : 'Archivados'}
                        </Button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <SelectionToggle isActive={selection.isSelectionMode} onClick={selection.toggleMode} count={selection.selectedIds.length} />
                    <Button variant="primary" onClick={() => ui.openModal('order')}>+ NUEVO PEDIDO</Button>
                </div>
            </HeaderPortal>

            <ActionBar count={selection.selectedIds.length} onClear={selection.clear} actions={finalActions} />

            <main className="flex-1 overflow-x-auto p-6">
                {/* LA VISTA YA NO TIENE LOGICA DE MAPEO, SOLO DECIDE QUÉ SECCIÓN MOSTRAR */}
                {tab !== 'logistics' ? (
                    <SalesSection orders={orders} search={search} selection={selection} ui={ui} />
                ) : (
                    <LogisticsSection orders={orders} search={search} ui={ui} />
                )}
            </main>

            <OrdersModals ui={ui} />
            <OrdersConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
        </div>
    );
};

export default OrdersView;