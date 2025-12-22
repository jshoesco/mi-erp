import React from 'react';
import Icon from '../../ui/Icon';

const InventoryTable = ({ products = [], columns = [], onEdit, selectedIds = [], toggleSelect, toggleAll }) => {
    if (!columns || columns.length === 0) return null;

    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-2">
                <thead>
                    <tr className="text-left">
                        <th className="pb-4 px-4">
                            <input type="checkbox" onChange={(e) => toggleAll(e)} checked={products.length > 0 && selectedIds.length === products.length} />
                        </th>
                        {columns.map(col => (
                            <th key={`head-${col.key}`} className="pb-4 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{col.label}</th>
                        ))}
                        <th className="pb-4 px-4 text-right text-[10px] font-black text-gray-400 uppercase">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(p => (
                        <tr key={`row-${p.id}`} className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                            <td className="py-4 px-4 rounded-l-2xl border-y border-l border-gray-50">
                                <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => toggleSelect(p.id)} />
                            </td>
                            {columns.map(col => (
                                <td key={`cell-${p.id}-${col.key}`} className="py-4 px-4 border-y border-gray-50 text-[11px] font-black text-gray-800 uppercase text-gray-700">
                                    {col.key === 'precio' ? `$${p[col.key]?.toLocaleString() || '0'}` : p[col.key] || '-'}
                                </td>
                            ))}
                            <td className="py-4 px-4 text-right rounded-r-2xl border-y border-r border-gray-50">
                                <button onClick={() => onEdit(p)} className="p-2 text-gray-400 hover:text-brand-dark"><Icon name="Edit" size={16} /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default InventoryTable;