import React from 'react';
import Icon from '../../ui/Icon';
import { formatCurrency } from '../../../lib/utils';

const FinanceTable = ({ data, onEdit }) => {
    // Función blindada para formatear fechas de cualquier tipo
    const formatDate = (dateValue) => {
        if (!dateValue) return 'S/F';
        try {
            // Si es Timestamp de Firebase
            if (dateValue.toDate) return dateValue.toDate().toLocaleDateString();
            // Si es String o Date objeto
            return new Date(dateValue).toLocaleDateString();
        } catch (e) { return 'Error Fecha'; }
    };

    return (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden animate-fade-in">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-gray-50/50">
                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Concepto</th>
                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Valor</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {data.map(t => (
                        <tr key={t.id} onClick={() => onEdit(t)} className="hover:bg-gray-50/50 cursor-pointer transition-all group">
                            <td className="p-4">
                                <div className={`w-2 h-2 rounded-full ${t.tipo === 'INGRESO' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                <div className="text-[9px] font-bold text-gray-400 mt-1">{formatDate(t.fecha)}</div>
                            </td>
                            <td className="p-4">
                                <div className="text-[11px] font-black text-gray-800 uppercase italic leading-none">{t.descripcion}</div>
                                <div className="text-[9px] font-bold text-gray-400 uppercase mt-1">{t.categoria} • {t.metodo}</div>
                            </td>
                            <td className={`p-4 text-right font-black text-xs ${t.tipo === 'INGRESO' ? 'text-emerald-600' : 'text-red-600'}`}>
                                {t.tipo === 'INGRESO' ? '+' : '-'} {formatCurrency(t.monto)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default FinanceTable;