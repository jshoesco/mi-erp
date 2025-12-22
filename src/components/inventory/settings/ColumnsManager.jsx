import React from 'react';
import Checkbox from '../../ui/Checkbox';

const ColumnsManager = ({ columns = [], setColumns, availableKeys = [] }) => {

    const toggleColumn = (colDef) => {
        const isVisible = columns.find(c => c.key === colDef.key);
        if (isVisible) {
            setColumns(columns.filter(c => c.key !== colDef.key));
        } else {
            // Añadimos la columna completa para no perder la etiqueta
            setColumns([...columns, colDef]);
        }
    };

    return (
        <div className="grid grid-cols-1 gap-2 animate-fade-in">
            {availableKeys.map(k => (
                <div
                    key={k.key}
                    className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-gray-200 transition-all cursor-pointer"
                    onClick={() => toggleColumn(k)}
                >
                    <span className="text-[11px] font-black text-gray-900 uppercase tracking-widest">
                        {k.label}
                    </span>
                    <Checkbox
                        checked={!!columns.find(c => c.key === k.key)}
                        onChange={() => toggleColumn(k)}
                    />
                </div>
            ))}
        </div>
    );
};

export default ColumnsManager;