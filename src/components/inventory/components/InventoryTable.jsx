import React from 'react';
import Checkbox from '../../ui/Checkbox';
import { formatCurrency } from '../../../lib/utils';

const InventoryTable = ({ products, selectedIds, toggleSelect, toggleAll, onEdit, columns }) => {
    // Solo renderizamos lo que el usuario marcó como visible
    const visibleCols = columns.filter(c => c.visible);

    return (
        <div className="overflow-x-auto bg-white rounded-2xl border border-gray-100 shadow-sm">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="p-4 w-10">
                            <Checkbox
                                checked={selectedIds.length === products.length && products.length > 0}
                                indeterminate={selectedIds.length > 0 && selectedIds.length < products.length}
                                onChange={toggleAll}
                            />
                        </th>
                        {visibleCols.map(col => (
                            <th key={col.id} className="p-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                                {col.label || 'SIN NOMBRE'}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {products.map((p) => (
                        <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(p.id) ? 'bg-red-50/30' : ''}`}>
                            <td className="p-4">
                                <Checkbox checked={selectedIds.includes(p.id)} onChange={() => toggleSelect(p.id)} />
                            </td>
                            {visibleCols.map(col => (
                                <td key={col.id} className="p-4 cursor-pointer" onClick={() => onEdit(p)}>
                                    {renderCell(col, p)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// ESTA ES LA FUNCIÓN CRÍTICA
const renderCell = (col, p) => {
    const value = p[col.key];

    // Caso 1: Es una imagen
    if (col.key === 'imagen' || col.key === 'img') {
        return (
            <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden border border-gray-200">
                {value ? <img src={value} className="w-full h-full object-cover" /> : <div className="text-[8px] text-gray-400 text-center mt-3">N/A</div>}
            </div>
        );
    }

    // Caso 2: Es precio
    if (col.key === 'precio') {
        return <span className="font-mono font-bold text-sm text-gray-600">{formatCurrency(value || 0)}</span>;
    }

    // Caso 3: Es stock
    if (col.key === 'stock_actual' || col.key === 'stock') {
        return (
            <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${value <= 2 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                {value || 0}
            </span>
        );
    }

    // Caso 4: Es el nombre (con SKU debajo por diseño)
    if (col.key === 'nombre') {
        return (
            <div className="flex flex-col">
                <span className="text-sm font-black text-gray-800 uppercase leading-none">{value}</span>
                <span className="text-[9px] font-mono text-brand-red font-bold mt-1.5 tracking-tighter">{p.sku}</span>
            </div>
        );
    }

    // Caso por defecto: Cualquier otro campo de la base de datos
    return <span className="text-[11px] font-bold text-gray-700 uppercase">{value !== undefined ? String(value) : '—'}</span>;
};

export default InventoryTable;