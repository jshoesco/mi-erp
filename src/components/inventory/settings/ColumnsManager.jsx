import React from 'react';
import TableConfigurator from '../../ui/TableConfigurator';
import { H3, TextLabel } from '../../ui/display/Typography';
import Icon from '../../ui/display/Icon';

const ColumnsManager = ({ columns, availableKeys, onSave }) => {
    return (
        <div className="space-y-6 animate-fade-in">
            {/* ENCABEZADO ESTRATÉGICO */}
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                <div className="absolute right-[-20px] top-[-20px] opacity-10 rotate-12">
                    <Icon name="Columns" size={120} />
                </div>

                <div className="relative z-10 space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-red rounded-xl shadow-lg shadow-brand-red/20">
                            <Icon name="Layout" size={18} />
                        </div>
                        <H3 className="text-white">Arquitectura de Tabla</H3>
                    </div>
                    <TextLabel className="text-slate-400">
                        Define qué datos son visibles y el orden de prioridad en tu inventario.
                    </TextLabel>
                </div>
            </div>

            {/* CONFIGURADOR GENÉRICO ENVOLTORIO */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <TableConfigurator
                    columns={columns}
                    availableKeys={availableKeys}
                    onSave={onSave}
                    saveLabel="Sincronizar Estructura"
                />
            </div>

            {/* NOTA TÉCNICA */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                <Icon name="Info" size={16} className="text-slate-400" />
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                    Tip: Arrastra las columnas para cambiar su orden de aparición en la vista principal.
                </p>
            </div>
        </div>
    );
};

export default ColumnsManager;