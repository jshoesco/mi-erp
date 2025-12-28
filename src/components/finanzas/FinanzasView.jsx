import React from 'react';
import { useFinanzas } from './hooks/useFinanzas';
import { HeaderPortal } from '../ui/HeaderPortal';
import FinanzasStats from './components/FinanzasStats';
import DynamicTable from '../ui/DynamicTable';
import FinanceSettingsModal from './modals/FinanceSettingsModal';
import TransactionModal from './modals/TransactionModal';
import Button from '../ui/display/Button';
import Icon from '../ui/display/Icon';
import { TOKENS } from '../../theme/constants';

const FinanzasView = () => {
    const { transactions, stats, finConfig, filter, setFilter, isSettingsOpen, setIsSettingsOpen, isTransactionModalOpen, setIsTransactionModalOpen, editingItem, setEditingItem, notify, columns, setColumns, availableKeys, saveColumnsConfig } = useFinanzas();

    return (
        <div className={`flex flex-col h-full ${TOKENS.animation.fade} pb-8`}>
            <HeaderPortal>
                <div className={`flex items-center bg-brand-light p-1 ${TOKENS.radius.inner} border border-brand-light shadow-inner`}>
                    <div className="flex items-center gap-2 px-4">
                        <Icon name="Search" size={14} className="text-brand-gray/30" />
                        <input className={`bg-transparent border-none ${TOKENS.text.tiny} text-brand-dark placeholder:text-brand-gray/30 w-40 focus:ring-0 outline-none`} placeholder="BUSCAR MOVIMIENTO..." value={filter} onChange={e => setFilter(e.target.value)} />
                    </div>
                    <div className="w-[1px] h-4 bg-brand-gray/10 mx-1" />
                    <button onClick={() => setIsSettingsOpen(true)} className={`p-2 text-brand-gray/30 hover:text-brand-dark transition-all ${TOKENS.radius.button} hover:bg-brand-surface`}>
                        <Icon name="Settings" size={18} />
                    </button>
                </div>

                <Button onClick={() => { setEditingItem(null); setIsTransactionModalOpen(true); }} variant="primary" icon="Plus" className="px-6 h-12">
                    NUEVO MOVIMIENTO
                </Button>
            </HeaderPortal>

            <div className={`${TOKENS.spacing.section} flex flex-col h-full mt-4`}>
                <FinanzasStats stats={stats} />

                <div className={`flex-1 bg-brand-surface ${TOKENS.radius.container} ${TOKENS.spacing.view} ${TOKENS.action.shadow} border border-brand-light overflow-hidden`}>
                    <DynamicTable data={transactions} columns={columns} onEdit={(t) => { setEditingItem(t); setIsTransactionModalOpen(true); }} />
                </div>
            </div>

            <TransactionModal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} transaction={editingItem} config={finConfig} notify={notify} />
            <FinanceSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} config={finConfig} notify={notify} columns={columns} setColumns={setColumns} availableKeys={availableKeys} saveColumnsConfig={saveColumnsConfig} />
        </div>
    );
};
export default FinanzasView;