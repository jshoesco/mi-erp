import React, { useState } from 'react';
import Modal from '../../ui/Modal';
// Importamos los módulos que acabamos de crear
import ProvidersManager from '../settings/ProvidersManager';
import LinesManager from '../settings/LinesManager';
import ColumnsManager from '../settings/ColumnsManager';

const InventorySettingsModal = ({
    isOpen,
    onClose,
    providers = [],
    lines = [],
    columns = [],
    setColumns,
    availableKeys = [],
    notify
}) => {
    const [tab, setTab] = useState('proveedores');

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="CONFIGURACIÓN DE INVENTARIO">
            <div className="w-full h-[550px] flex flex-col space-y-6">

                {/* NAVEGACIÓN */}
                <div className="flex bg-gray-100 p-1 rounded-2xl shrink-0">
                    {['proveedores', 'lineas', 'columnas'].map((t) => (
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
                    {tab === 'proveedores' && (
                        <ProvidersManager providers={providers} notify={notify} />
                    )}

                    {tab === 'lineas' && (
                        <LinesManager lines={lines} />
                    )}

                    {tab === 'columnas' && (
                        <ColumnsManager
                            columns={columns}
                            setColumns={setColumns}
                            availableKeys={availableKeys}
                        />
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default InventorySettingsModal;