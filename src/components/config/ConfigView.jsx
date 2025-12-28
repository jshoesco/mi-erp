import React, { useState } from 'react';
import LogisticsConfig from './sections/LogisticsConfig';
import SupplyConfig from './sections/SupplyConfig';
import FinanceConfig from './sections/FinanceConfig';
import SystemConfig from './sections/SystemConfig';

// IMPORTACIÓN DE COMPONENTES GENÉRICOS (TOKENS)
import { TOKENS } from '../../theme/constants';
import { H1, TextLabel } from '../ui/display/Typography';
import Icon from '../ui/display/Icon';

const ConfigView = () => {
    const [tab, setTab] = useState('logistics');

    const tabs = [
        { id: 'logistics', label: 'Logística', icon: 'Truck' },
        { id: 'supply', label: 'Abastecimiento', icon: 'Box' },
        { id: 'finance', label: 'Finanzas', icon: 'DollarSign' },
        { id: 'system', label: 'Sistema', icon: 'Settings' }
    ];

    return (
        <div className={`flex flex-col h-full ${TOKENS.spacing.view} ${TOKENS.animation.fade} space-y-10`}>
            {/* HEADER ESTRATÉGICO */}
            <div className="space-y-1">
                <H1>Panel de Configuración</H1>
                <TextLabel>Control maestro de infraestructura y reglas de negocio</TextLabel>
            </div>

            {/* NAV DE PESTAÑAS (DNA CAPSULE) */}
            <nav className={`flex items-center gap-2 bg-brand-light/50 p-1.5 ${TOKENS.radius.inner} border border-brand-light w-fit backdrop-blur-md`}>
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`
                            px-8 py-3 flex items-center gap-3 ${TOKENS.radius.button} transition-all duration-300
                            ${TOKENS.text.tiny}
                            ${tab === t.id
                                ? 'bg-brand-dark text-white shadow-lg scale-[1.05]'
                                : 'text-brand-gray/40 hover:text-brand-dark hover:bg-brand-surface'}
                        `}
                    >
                        <Icon name={t.icon} size={16} />
                        <span className="hidden md:inline">{t.label}</span>
                    </button>
                ))}
            </nav>

            {/* CUERPO DE CONFIGURACIÓN */}
            <div className={`flex-1 bg-brand-surface ${TOKENS.radius.container} p-12 shadow-card border border-brand-light overflow-y-auto custom-scrollbar`}>
                <div className="w-full max-w-5xl mx-auto">
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