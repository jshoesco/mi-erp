import React, { useState } from 'react';
import ModalLayout from './ModalLayout';
import Icon from '../display/Icon';

const ConfigSheet = ({ isOpen, onClose, title, tabs = [] }) => {
    const [activeTab, setActiveTab] = useState(tabs[0]?.id);

    return (
        <ModalLayout
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="xl"
            hideFooter
        >
            <div className="flex h-[500px] -m-6">
                {/* Menú de Navegación Lateral */}
                <div className="w-64 border-r border-slate-100 bg-slate-50/50 p-4 space-y-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all
                                ${activeTab === tab.id
                                    ? 'bg-slate-900 text-white shadow-lg'
                                    : 'text-slate-400 hover:bg-white hover:shadow-sm'}`}
                        >
                            <Icon name={tab.icon} size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Área de Contenido de la Pestaña */}
                <div className="flex-1 p-8 overflow-y-auto">
                    {tabs.find(t => t.id === activeTab)?.component}
                </div>
            </div>
        </ModalLayout>
    );
};

export default ConfigSheet;