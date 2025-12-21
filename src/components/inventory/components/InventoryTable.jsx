import React from 'react';
import Icon from '../../ui/Icon';

const InventoryTable = ({ products = [], columns, selectedIds = [], onEdit, ui }) => {
    // Validación de seguridad para evitar el crash de .length
    const safeProducts = products || [];
    const isAllSelected = safeProducts.length > 0 && selectedIds.length === safeProducts.length;

    const renderCell = (field, value, item) => {
        if (field === 'imagen') return <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden">{value && <img src={value} className="w-full h-full object-cover"/>}</div>;
        if (field === 'nombre') return <div className="flex flex-col"><span className="font-bold uppercase">{value}</span><span className="text-[10px] text-gray-400 font-mono">{item.sku}</span></div>;
        if (field === 'precio') return <span className="font-bold">${Number(value).toLocaleString()}</span>;
        if (field === 'stock_actual') return <span className="font-bold">{value} UNID</span>;
        return <span className="uppercase text-xs">{value || '—'}</span>;
    };

    return (
        <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden h-full flex flex-col">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-0">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-4 w-10 border-b border-gray-100">
                                <input type="checkbox" checked={isAllSelected} onChange={() => ui.toggleSelectAll(safeProducts)} className="rounded text-brand-red" />
                            </th>
                            {columns.map(col => (
                                <th key={col.id} className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">{col.header}</th>
                            ))}
                            <th className="p-4 border-b border-gray-100"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {safeProducts.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50/50 transition-all">
                                <td className="p-4 border-b border-gray-50">
                                    <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => ui.toggleSelect(item.id)} className="rounded text-brand-red" />
                                </td>
                                {columns.map(col => (
                                    <td key={col.id} className="p-4 border-b border-gray-50">{renderCell(col.field, item[col.field], item)}</td>
                                ))}
                                <td className="p-4 border-b border-gray-50 text-right">
                                    <button onClick={() => onEdit(item)} className="p-2 bg-gray-100 rounded-lg hover:bg-brand-dark hover:text-white transition-all"><Icon name="Edit3" size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InventoryTable;