import React, { useState } from 'react';
import Modal from '../../ui/Modal';
import { db, doc, updateDoc } from '../../../lib/firebase';
// Importamos los módulos
import IncomeManager from '../settings/IncomeManager';
import ExpenseManager from '../settings/ExpenseManager';
import BankManager from '../settings/BankManager';

const FinanceSettingsModal = ({ isOpen, onClose, config, notify }) => {
    const [tab, setTab] = useState('ingresos');

    // Función centralizada de guardado
    const sync = async (newData) => {
        try {
            if (!config?.id) return notify("Error de configuración", "error");
            await updateDoc(doc(db, 'config_finanzas', config.id), newData);
        } catch (e) { notify(e.message, "error"); }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="ESTRUCTURA FINANCIERA">
            <div className="w-full h-[550px] flex flex-col space-y-6">

                {/* NAVEGACIÓN */}
                <div className="flex bg-gray-100 p-1 rounded-2xl shrink-0">
                    {['ingresos', 'gastos', 'bancos'].map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${tab === t ? 'bg-white shadow text-brand-dark' : 'text-gray-400'}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {/* CONTENIDO MODULAR */}
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {tab === 'ingresos' && (
                        <IncomeManager config={config} sync={sync} />
                    )}

                    {tab === 'gastos' && (
                        <ExpenseManager config={config} sync={sync} />
                    )}

                    {tab === 'bancos' && (
                        <BankManager config={config} sync={sync} />
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default FinanceSettingsModal;