import React from 'react';
import { useFinanzas } from './hooks/useFinanzas';
import FinanceStats from './components/FinanzasStats';
import FinanceTable from './components/FinanceTable';
import FinanceSettingsModal from './modals/FinanceSettingsModal';
import TransactionModal from './modals/TransactionModal';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import { Input } from '../ui/Input';

const FinanzasView = () => {
    const {
        transactions, stats, finConfig, filter, setFilter,
        isSettingsOpen, setIsSettingsOpen,
        isTransactionModalOpen, setIsTransactionModalOpen,
        editingItem, setEditingItem, notify
    } = useFinanzas();

    return (
        <div className="p-6 max-w-7xl mx-auto pb-24 animate-fade-in">
            {/* HEADER */}
            <header className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                    <div className="bg-brand-dark p-3 rounded-2xl text-white shadow-lg">
                        <Icon name="DollarSign" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-gray-900 uppercase">Control de Caja</h1>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic">Gestión de flujos y tesorería</p>
                    </div>
                    <button onClick={() => setIsSettingsOpen(true)} className="ml-2 p-2 text-gray-300 hover:text-brand-dark transition-all">
                        <Icon name="Settings" size={18} />
                    </button>
                </div>

                <div className="flex gap-3">
                    <Input
                        placeholder="BUSCAR MOVIMIENTO..."
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className="w-64 h-11"
                    />
                    <Button
                        onClick={() => { setEditingItem(null); setIsTransactionModalOpen(true); }}
                        className="bg-brand-red text-white px-8 h-11"
                    >
                        NUEVO MOVIMIENTO
                    </Button>
                </div>
            </header>

            {/* COMPONENTES EXTERNOS */}
            <FinanceStats stats={stats} />

            <FinanceTable
                data={transactions}
                onEdit={(item) => { setEditingItem(item); setIsTransactionModalOpen(true); }}
            />

            {/* MODALES */}
            {finConfig && (
                <FinanceSettingsModal
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                    config={finConfig}
                    notify={notify}
                />
            )}

            <TransactionModal
                isOpen={isTransactionModalOpen}
                onClose={() => setIsTransactionModalOpen(false)}
                editingItem={editingItem}
                finConfig={finConfig}
                notify={notify}
            />
        </div>
    );
};

export default FinanzasView;