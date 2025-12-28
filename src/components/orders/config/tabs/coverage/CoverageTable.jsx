import React from 'react';
import Icon from '../../../../ui/display/Icon';

const CoverageTable = ({ data, onEdit, onDelete }) => (
    <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Ciudad</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Tipo</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Tarifa</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {data?.map(item => (
                    <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4"><span className="bg-slate-900 text-white text-[9px] font-black px-2 py-1 rounded-md">{item.codigo}</span></td>
                        <td className="px-6 py-4">
                            <div className="flex flex-col">
                                <span className="text-[11px] font-black uppercase text-slate-800">{item.ciudad}</span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase">{item.paqueteria || 'GENERAL'}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                            {item.isAcopio ?
                                <span className="bg-blue-600 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase">Acopio</span> :
                                <span className="bg-slate-100 text-slate-400 text-[8px] font-black px-2 py-1 rounded-full uppercase">Entrega</span>
                            }
                        </td>
                        <td className="px-6 py-4 text-[11px] font-black text-slate-900 text-right">${item.tarifa?.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => onEdit(item)} className="p-2 text-slate-300 hover:text-blue-600"><Icon name="edit" size={14} /></button>
                                <button onClick={() => onDelete(item.id)} className="p-2 text-slate-300 hover:text-red-600"><Icon name="trash" size={14} /></button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export default CoverageTable;