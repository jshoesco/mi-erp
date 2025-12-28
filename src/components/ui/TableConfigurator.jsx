import React, { useState } from 'react';
import Icon from './display/Icon';
import Checkbox from './Checkbox';
import { Button } from './display/Button';
import { TextLabel, H3 } from './display/Typography';

const TableConfigurator = ({
    columns = [],
    availableKeys = [],
    onSave,
    saveLabel = "Guardar Configuración"
}) => {
    // Estado local para manipular antes de guardar en Firebase
    const [localCols, setLocalCols] = useState([...columns]);

    const toggleColumn = (key, label) => {
        const exists = localCols.find(c => c.key === key);
        if (exists) {
            setLocalCols(localCols.filter(c => c.key !== key));
        } else {
            setLocalCols([...localCols, { key, label }]);
        }
    };

    const moveCol = (index, direction) => {
        const newCols = [...localCols];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= newCols.length) return;

        const temp = newCols[index];
        newCols[index] = newCols[targetIndex];
        newCols[targetIndex] = temp;
        setLocalCols(newCols);
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

                {/* COLUMNAS DISPONIBLES */}
                <div className="space-y-4">
                    <H3>Columnas Disponibles</H3>
                    <div className="grid grid-cols-1 gap-2 bg-slate-50/50 p-6 rounded-[2rem] border border-gray-100 shadow-inner max-h-[400px] overflow-y-auto custom-scrollbar">
                        {availableKeys.map((item) => (
                            <div
                                key={item.key}
                                className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-50 shadow-sm group hover:border-brand-red/30 transition-all"
                            >
                                <Checkbox
                                    label={item.label}
                                    checked={localCols.some(c => c.key === item.key)}
                                    onChange={() => toggleColumn(item.key, item.label)}
                                />
                                <span className="text-[8px] font-black text-gray-300 uppercase tracking-tighter group-hover:text-brand-red transition-colors">
                                    {item.key}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ORDEN SELECCIONADO */}
                <div className="space-y-4">
                    <H3>Orden de Visualización</H3>
                    <div className="space-y-2 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm min-h-[100px]">
                        {localCols.length === 0 ? (
                            <div className="py-10 text-center">
                                <TextLabel>No hay columnas seleccionadas</TextLabel>
                            </div>
                        ) : (
                            localCols.map((col, idx) => (
                                <div
                                    key={col.key}
                                    className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-gray-50 group"
                                >
                                    <div className="flex flex-col gap-1">
                                        <button onClick={() => moveCol(idx, -1)} className="text-gray-300 hover:text-brand-dark transition-colors">
                                            <Icon name="ChevronUp" size={14} />
                                        </button>
                                        <button onClick={() => moveCol(idx, 1)} className="text-gray-300 hover:text-brand-dark transition-colors">
                                            <Icon name="ChevronDown" size={14} />
                                        </button>
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{col.label}</div>
                                        <TextLabel className="text-[9px]">Posición: {idx + 1}</TextLabel>
                                    </div>
                                    <Icon name="GripVertical" size={16} className="text-gray-200" />
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end">
                <Button
                    variant="brand"
                    className="px-10 h-12"
                    icon="Save"
                    onClick={() => onSave(localCols)}
                >
                    {saveLabel}
                </Button>
            </div>
        </div>
    );
};

export default TableConfigurator;