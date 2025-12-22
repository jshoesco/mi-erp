import React, { useState } from 'react';
import LogisticsConfig from './sections/LogisticsConfig';
import SupplyConfig from './sections/SupplyConfig';
import FinanceConfig from './sections/FinanceConfig';
import SystemConfig from './sections/SystemConfig';
import Icon from '../ui/Icon';

const ConfigView = () => {
    const [tab, setTab] = useState('logistics');

    const tabs = [
        { id: 'logistics', label: 'Logística', icon: 'Truck' },
        { id: 'supply', label: 'Abastecimiento', icon: 'Box' },
        { id: 'finance', label: 'Finanzas', icon: 'DollarSign' },
        { id: 'system', label: 'Sistema', icon: 'Settings' }
    ];

    return (
        // Contenedor principal con ancho FIJO máximo para que nada se mueva
        <div className="p-6 max-w-6xl mx-auto pb-24 w-full">
            <h1 className="text-2xl font-black text-gray-900 mb-8 tracking-tight uppercase">Configuración Pro</h1>

            {/* ESTA ES LA BARRA INDEPENDIENTE. 
              Tiene un ancho del 100% fijo y no depende de lo que pase abajo.
            */}
            <div className="w-full bg-white border border-gray-100 rounded-t-3xl shadow-sm overflow-hidden">
                <div className="grid grid-cols-4 w-full">
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`
                                py-5 flex items-center justify-center gap-3 transition-all duration-200
                                text-[10px] font-black uppercase tracking-widest border-b-4
                                ${tab === t.id
                                    ? 'border-brand-red text-brand-dark bg-gray-50/50'
                                    : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50/20'}
                            `}
                        >
                            <Icon name={t.icon} size={16} />
                            <span className="hidden md:inline">{t.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ESTE ES EL CONTENEDOR DE CONTENIDO.
              Es independiente de la barra y tiene una altura mínima bloqueada.
            */}
            <div className="w-full bg-white border border-t-0 border-gray-100 rounded-b-3xl shadow-sm min-h-[650px] p-10">
                <div className="animate-fade-in w-full">
                    {/* IMPORTANTE: Aquí inyectamos el componente. 
                      Cada sección DEBE ocupar el 100% de este espacio.
                    */}
                    {tab === 'logistics' && <LogisticsConfig />}
                    {tab === 'supply' && <SupplyConfig />}
                    {tab === 'finance' && <FinanceConfig />}
                    {tab === 'system' && <SystemConfig />}
                </div>
            </div>
        </div>
    );
};

export default ConfigView;