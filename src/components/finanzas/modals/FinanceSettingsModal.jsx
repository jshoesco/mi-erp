import React, { useState } from 'react';
import Modal from '../../ui/Modal';
import Icon from '../../ui/Icon';
import Checkbox from '../../ui/Checkbox';
import { db, doc, updateDoc } from '../../../lib/firebase';

const FinanceSettingsModal = ({ isOpen, onClose, config, notify }) => {
    const [tab, setTab] = useState('ingresos');
    const [newValue, setNewValue] = useState('');
    const [editingIndex, setEditingIndex] = useState(null);
    const [tempValue, setTempValue] = useState('');

    const sync = async (newData) => {
        try {
            await updateDoc(doc(db, 'config_finanzas', config.id), newData);
        } catch (e) { notify(e.message, "error"); }
    };

    const addCategory = () => {
        if (!newValue) return;
        const current = config[tab] || [];
        if (current.includes(newValue.toUpperCase())) return setNewValue('');
        sync({ ...config, [tab]: [...current, newValue.toUpperCase()] });
        setNewValue('');
    };

    const startEdit = (val, idx) => {
        setEditingIndex(idx);
        setTempValue(val);
    };

    const saveEdit = (type, idx) => {
        if (!tempValue) return setEditingIndex(null);
        const list = [...config[type]];
        list[idx] = tempValue.toUpperCase();
        sync({ ...config, [type]: list });
        setEditingIndex(null);
    };

    const saveBankEdit = (idx, field, val) => {
        const list = [...config.methods];
        list[idx] = { ...list[idx], [field]: field === 'name' ? val.toUpperCase() : val };
        sync({ ...config, methods: list });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="ESTRUCTURA FINANCIERA">
            {/* CONTENEDOR DE TAMAÑO FIJO BLOQUEADO (w-full y h-[550px]) */}
            <div className="w-full h-[550px] flex flex-col space-y-6">

                {/* 1. NAVEGACIÓN (ESTÁTICA) */}
                <div className="flex bg-gray-100 p-1 rounded-2xl shrink-0">
                    {['ingresos', 'gastos', 'bancos'].map(t => (
                        <button key={t} onClick={() => { setTab(t); setEditingIndex(null); }}
                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${tab === t ? 'bg-white shadow text-brand-dark' : 'text-gray-400'}`}>
                            {t}
                        </button>
                    ))}
                </div>

                {/* 2. AREA DE CONTENIDO (CON SCROLL INTERNO INDEPENDIENTE) */}
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {tab !== 'bancos' ? (
                        <div className="space-y-4 animate-fade-in">
                            <div className="flex gap-2 sticky top-0 bg-white pb-2 z-10">
                                <input
                                    className="flex-1 bg-gray-50 border-none rounded-xl px-4 text-xs font-bold h-12 outline-none focus:ring-2 focus:ring-brand-dark"
                                    placeholder={`NUEVA CATEGORÍA DE ${tab.toUpperCase()}...`}
                                    value={newValue}
                                    onChange={e => setNewValue(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addCategory()}
                                />
                                <button onClick={addCategory} className="bg-brand-dark text-white w-12 h-12 rounded-xl font-bold text-xl transition-transform active:scale-90">+</button>
                            </div>

                            <div className="grid grid-cols-1 gap-2 mt-2">
                                {config[tab]?.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl group hover:border-gray-200 transition-all shadow-sm">
                                        {editingIndex === idx ? (
                                            <input
                                                autoFocus
                                                className="flex-1 bg-gray-100 border-none rounded-lg px-2 py-1 text-[11px] font-black uppercase outline-none"
                                                value={tempValue}
                                                onChange={e => setTempValue(e.target.value)}
                                                onBlur={() => saveEdit(tab, idx)}
                                                onKeyDown={e => e.key === 'Enter' && saveEdit(tab, idx)}
                                            />
                                        ) : (
                                            <span onClick={() => startEdit(item, idx)} className="text-[11px] font-black text-gray-700 uppercase cursor-pointer hover:text-brand-dark flex-1">
                                                {item}
                                            </span>
                                        )}
                                        <button onClick={() => sync({ ...config, [tab]: config[tab].filter((_, i) => i !== idx) })} className="text-gray-200 hover:text-red-500 ml-4 transition-colors">
                                            <Icon name="Trash" size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-fade-in">
                            <button onClick={() => sync({ ...config, methods: [...(config.methods || []), { name: 'NUEVA CUENTA', isBank: false }] })}
                                className="w-full border-2 border-dashed border-gray-200 p-4 rounded-3xl text-[11px] font-black text-gray-400 hover:border-brand-dark hover:text-brand-dark transition-all sticky top-0 bg-white z-10">
                                + VINCULAR NUEVO MÉTODO
                            </button>

                            <div className="grid grid-cols-1 gap-3 pt-2">
                                {config.methods?.map((m, i) => (
                                    <div key={i} className="p-5 bg-gray-50 rounded-[2rem] space-y-4 border border-transparent hover:border-gray-200 transition-all shadow-sm">
                                        <div className="flex justify-between items-center">
                                            <input
                                                className="bg-transparent border-none p-0 text-[12px] font-black uppercase text-gray-800 focus:ring-0 w-full"
                                                value={m.name}
                                                onChange={e => saveBankEdit(i, 'name', e.target.value)}
                                            />
                                            <button onClick={() => sync({ ...config, methods: config.methods.filter((_, idx) => idx !== i) })} className="text-gray-300 hover:text-red-500">
                                                <Icon name="Trash" size={18} />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between border-t border-gray-200/50 pt-3">
                                            <div className="flex items-center gap-2">
                                                <Checkbox checked={m.isBank} onChange={() => saveBankEdit(i, 'isBank', !m.isBank)} />
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Validar Soporte</span>
                                            </div>
                                            <Icon name={m.isBank ? "CreditCard" : "DollarSign"} size={16} className="text-gray-300" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default FinanceSettingsModal;