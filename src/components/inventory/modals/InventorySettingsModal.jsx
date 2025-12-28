import React, { useState } from 'react';
import ProvidersManager from '../settings/ProvidersManager';
import LinesManager from '../settings/LinesManager';
import ColumnsManager from '../settings/ColumnsManager';
import { TOKENS } from '../../../theme/constants';
import ModalLayout from '../../ui/layout/ModalLayout';
import { TextLabel } from '../../ui/display/Typography';

const InventorySettingsModal = ({
    isOpen, onClose, providers = [],
    lineas = [],
    columns = [], availableKeys = [], notify,
    setColumns, saveColumnsConfig,
    mapping
}) => {
    const [tab, setTab] = useState('proveedores');

    const tabs = [
        { id: 'proveedores', label: 'Proveedores' },
        { id: 'lineas', label: 'Líneas' },
        { id: 'columnas', label: 'Columnas' }
    ];

    return (
        <ModalLayout
            isOpen={isOpen}
            onClose={onClose}
            title="Ajustes de Inventario"
            size="max-w-4xl"
        >
            <div className="flex flex-col space-y-10">
                <nav className={`flex items-center gap-1 bg-brand-light/50 p-1.5 ${TOKENS.radius.inner} border border-brand-light w-full backdrop-blur-md`}>
                    {tabs.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`flex-1 py-4 ${TOKENS.text.tiny} ${TOKENS.radius.button} transition-all duration-300 ${tab === t.id
                                ? 'bg-brand-dark text-white shadow-lg scale-[1.02]'
                                : 'text-brand-gray/40 hover:text-brand-dark'
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </nav>

                <div className="min-h-[450px] max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                    {tab === 'proveedores' && (
                        <ProvidersManager
                            providers={providers}
                            lines={lineas}
                            notify={notify}
                            mapping={mapping}
                        />
                    )}

                    {tab === 'lineas' && (
                        <LinesManager
                            lines={lineas} // <--- CABLE CONECTADO
                            notify={notify}
                            mapping={mapping}
                        />
                    )}

                    {tab === 'columnas' && (
                        <ColumnsManager
                            columns={columns}
                            setColumns={setColumns}
                            availableKeys={availableKeys}
                            onSave={saveColumnsConfig}
                        />
                    )}
                </div>
            </div>
        </ModalLayout>
    );
};

export default InventorySettingsModal;