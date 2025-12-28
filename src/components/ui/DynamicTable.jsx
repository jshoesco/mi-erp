import React from 'react';
import Icon from './display/Icon';
import Checkbox from './Checkbox';
import { PriceText, TextLabel } from './display/Typography';
import { TOKENS } from '../../theme/constants';

const DynamicTable = ({
    data = [],
    columns = [],
    onEdit,
    onSelect,
    selectedIds = []
}) => {
    if (!columns || columns.length === 0) return null;

    const renderCellContent = (item, col) => {
        const value = item[col.key];

        // 1. IMÁGENES GENÉRICAS
        if (['imagen', 'foto', 'img', 'image'].includes(col.key.toLowerCase())) {
            return (
                <div className={`w-14 h-14 ${TOKENS.radius.inner} border border-brand-light p-1 bg-brand-surface shadow-sm overflow-hidden flex shrink-0`}>
                    {value ? (
                        <img src={value} className="w-full h-full object-cover rounded-lg" alt="Producto" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-brand-gray/20 bg-brand-light/30">
                            <Icon name="Image" size={20} />
                        </div>
                    )}
                </div>
            );
        }

        // 2. DINERO GENÉRICO
        if (['precio', 'monto', 'costo', 'valor', 'total', 'ganancia'].includes(col.key.toLowerCase())) {
            const isNegative = item.tipo === 'GASTO' || item.tipo === 'EGRESO';
            return (
                <div className={`${TOKENS.text.price} ${isNegative ? 'text-brand-red' : ''}`}>
                    {isNegative && '-'}
                    <PriceText value={value} />
                </div>
            );
        }

        // 3. STOCK / ESTADOS
        if (['existencias', 'stock', 'cantidad'].includes(col.key.toLowerCase())) {
            return (
                <div className={`px-4 py-1.5 ${TOKENS.radius.full} ${TOKENS.text.tiny} w-fit shadow-sm border ${value > 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-brand-red border-red-100'}`}>
                    {value} UNID
                </div>
            );
        }

        // 4. TEXTO POR DEFECTO
        return (
            <span className={TOKENS.text.body}>
                {value || '-'}
            </span>
        );
    };

    return (
        <div className="w-full overflow-x-auto custom-scrollbar">
            <table className="w-full border-separate border-spacing-y-4">
                <thead>
                    <tr className="text-left">
                        {onSelect && <th className="pb-4 px-8 w-14"></th>}
                        {columns.map((col, idx) => (
                            <th key={`h-${idx}`} className="pb-4 px-8">
                                <TextLabel>{col.label}</TextLabel>
                            </th>
                        ))}
                        <th className="pb-4 px-8 text-right">
                            <TextLabel>Acciones</TextLabel>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((item) => (
                        <tr key={item.id} className="group transition-all duration-300">
                            {onSelect && (
                                <td className={`py-6 px-8 ${TOKENS.radius.card.replace('rounded', 'rounded-l')} border-y border-l border-brand-light bg-brand-surface group-hover:bg-brand-light/30 transition-colors`}>
                                    <div className="flex justify-center">
                                        <Checkbox
                                            checked={selectedIds.includes(item.id)}
                                            onChange={() => onSelect(item.id)}
                                        />
                                    </div>
                                </td>
                            )}
                            {columns.map((col, idx) => (
                                <td
                                    key={`c-${item.id}-${idx}`}
                                    className={`py-6 px-8 border-y border-brand-light whitespace-nowrap bg-brand-surface group-hover:bg-brand-light/30 transition-colors
                                        ${!onSelect && idx === 0 ? TOKENS.radius.card.replace('rounded', 'rounded-l') + ' border-l' : ''}`}
                                >
                                    {renderCellContent(item, col)}
                                </td>
                            ))}
                            <td className={`py-6 px-8 text-right ${TOKENS.radius.card.replace('rounded', 'rounded-r')} border-y border-r border-brand-light bg-brand-surface group-hover:bg-brand-light/30 transition-colors`}>
                                <button
                                    onClick={() => onEdit(item)}
                                    className={`p-3 text-brand-gray/30 hover:text-brand-dark hover:bg-brand-surface shadow-none hover:shadow-sm ${TOKENS.radius.inner} transition-all`}
                                >
                                    <Icon name="Edit" size={18} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DynamicTable;