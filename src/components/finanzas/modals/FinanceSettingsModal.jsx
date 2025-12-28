import React, { useState } from 'react';
import { db, doc, updateDoc } from '../../../lib/firebase';
import IncomeManager from '../settings/IncomeManager';
import ExpenseManager from '../settings/ExpenseManager';
import BankManager from '../settings/BankManager';
import FinanceColumnsManager from '../settings/FinanceColumnsManager';

// IMPORTACIÓN DEL SISTEMA GENÉRICO
import ModalLayout from '../../ui/layout/ModalLayout';

const FinanceSettingsModal = ({
    isOpen, onClose, config, notify,
    columns, availableKeys,
    saveColumnsConfig
}) => {
    const [tab, setTab] = useState('ingresos');

    const tabs = [
        { id: 'ingresos', label: 'Ingresos' },
        { id: 'gastos', label: 'Gastos' },
        { id: 'bancos', label: 'Bancos' },
        { id: 'columnas', label: 'Columnas' }
    ];

    const sync = async (newData) => {
        try {
            if (!config?.id) return notify("Error de configuración", "error");
            await updateDoc(doc(db, 'config_finanzas', config.id), newData);
        } catch (e) { notify(e.message, "error"); }
    };

    return (
        <ModalLayout
            isOpen={isOpen}
            onClose={onClose}
            title="Estructura Financiera"
            size="max-w-3xl"
        >
            <div className="flex flex-col space-y-8">
                <nav className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-[1.5rem] border border-gray-100 w-full">
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${tab === t.id
                                    ? 'bg-white shadow-sm text-slate-900'
                                    : 'text-gray-400 hover:text-slate-600'
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </nav>

                <div className="min-h-[400px] max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                    {tab === 'ingresos' && <IncomeManager config={config} sync={sync} />}
                    {tab === 'gastos' && <ExpenseManager config={config} sync={sync} />}
                    {tab === 'bancos' && <BankManager config={config} sync={sync} />}
                    {tab === 'columnas' && (
                        <FinanceColumnsManager
                            columns={columns}
                            availableKeys={availableKeys}
                            onSave={saveColumnsConfig}
                        />
                    )}
                </div>
            </div>
        </ModalLayout>
    );
};

export default FinanceSettingsModal;