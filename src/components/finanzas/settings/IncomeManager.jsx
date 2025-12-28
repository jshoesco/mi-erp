import React, { useState } from 'react';
import Icon from '../../ui/display/Icon';

const IncomeManager = ({ config, sync }) => {
    const [newValue, setNewValue] = useState('');
    const [editingIndex, setEditingIndex] = useState(null);
    const [tempValue, setTempValue] = useState('');

    const addCategory = () => {
        if (!newValue) return;
        const current = config.ingresos || [];
        if (current.includes(newValue.toUpperCase())) return setNewValue('');
        sync({ ...config, ingresos: [...current, newValue.toUpperCase()] });
        setNewValue('');
    };

    const startEdit = (val, idx) => {
        setEditingIndex(idx);
        setTempValue(val);
    };

    const saveEdit = (idx) => {
        if (!tempValue) return setEditingIndex(null);
        const list = [...(config.ingresos || [])];
        list[idx] = tempValue.toUpperCase();
        sync({ ...config, ingresos: list });
        setEditingIndex(null);
    };

    const deleteItem = (idx) => {
        const list = config.ingresos.filter((_, i) => i !== idx);
        sync({ ...config, ingresos: list });
    };

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex gap-2 sticky top-0 bg-white pb-2 z-10">
                <input
                    className="flex-1 bg-gray-50 border-none rounded-xl px-4 text-xs font-bold h-12 outline-none focus:ring-2 focus:ring-brand-dark"
                    placeholder="NUEVA CATEGORÍA DE INGRESO..."
                    value={newValue}
                    onChange={e => setNewValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCategory()}
                />
                <button onClick={addCategory} className="bg-brand-dark text-white w-12 h-12 rounded-xl font-bold text-xl transition-transform active:scale-90">+</button>
            </div>

            <div className="grid grid-cols-1 gap-2 mt-2">
                {config.ingresos?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl group hover:border-gray-200 transition-all shadow-sm">
                        {editingIndex === idx ? (
                            <input
                                autoFocus
                                className="flex-1 bg-gray-100 border-none rounded-lg px-2 py-1 text-[11px] font-black uppercase outline-none"
                                value={tempValue}
                                onChange={e => setTempValue(e.target.value)}
                                onBlur={() => saveEdit(idx)}
                                onKeyDown={e => e.key === 'Enter' && saveEdit(idx)}
                            />
                        ) : (
                            <span onClick={() => startEdit(item, idx)} className="text-[11px] font-black text-gray-700 uppercase cursor-pointer hover:text-brand-dark flex-1">
                                {item}
                            </span>
                        )}
                        <button onClick={() => deleteItem(idx)} className="text-gray-200 hover:text-red-500 ml-4 transition-colors">
                            <Icon name="Trash" size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default IncomeManager;