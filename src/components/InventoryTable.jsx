import React from 'react';
import SafeImg from './SafeImg';

const InventoryTable = ({ 
    products, 
    columns, 
    selectedIds, 
    setSelectedIds, 
    onEdit, 
    providers 
}) => {
    
    const isAllSelected = products.length > 0 && selectedIds.size === products.length;

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(new Set(products.map(p => p.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (e, id) => {
        e.stopPropagation();
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

const renderCell = (p, field) => {
    let v = p[field];
    
    if (field === 'proveedor') {
        return providers.find(x => x.id === p.proveedor_uid)?.nombre || '-';
    }
    
    if (field === 'imagen') {
        // Blindaje total: si no hay v, no renderiza basura
        return (
            <div className="w-fit">
                <SafeImg 
                    src={v || ''} 
                    className="w-12 h-12 rounded-lg object-contain border shadow-sm bg-gray-50" 
                />
            </div>
        );
    }

    if (field === 'precio' || field === 'costo') {
        return <span className="font-mono font-bold text-gray-800">${Number(v || 0).toLocaleString()}</span>;
    }

    if (field === 'status') {
        const isArchived = v === 'archivado' || v === 'Reemplazado';
        return (
            <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                isArchived ? 'bg-gray-100 text-gray-500' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
            }`}>
                {v || 'Activo'}
            </span>
        );
    }

    return <span className="text-sm font-medium text-gray-600">{v || '-'}</span>;
};

    return (
        <div className="flex-1 min-h-0 bg-white rounded-2xl border border-gray-200 overflow-hidden overflow-y-auto shadow-sm">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
                    <tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                        <th className="p-4 w-10 bg-gray-50">
                            <input 
                                type="checkbox" 
                                className="accent-brand-red cursor-pointer w-4 h-4" 
                                checked={isAllSelected} 
                                onChange={handleSelectAll} 
                            />
                        </th>
                        {columns.map(c => (
                            <th key={c.id} className="p-4 font-black">{c.header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {products.map(p => (
                        <tr 
                            key={p.id} 
                            onClick={() => onEdit(p)} 
                            className={`transition-all cursor-pointer group ${
                                selectedIds.has(p.id) ? 'bg-red-50/50' : 'hover:bg-brand-red/[0.02]'
                            }`}
                        >
                            <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                <input 
                                    type="checkbox" 
                                    className="accent-brand-red cursor-pointer w-4 h-4" 
                                    checked={selectedIds.has(p.id)} 
                                    onChange={(e) => handleSelectOne(e, p.id)} 
                                />
                            </td>
                            {columns.map(c => (
                                <td key={c.id} className="p-4">
                                    {renderCell(p, c.field)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default InventoryTable;