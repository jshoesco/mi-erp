import React from 'react';
import Icon from '../../ui/display/Icon';
import Checkbox from '../../ui/Checkbox';

const BankManager = ({ config, sync }) => {

    const saveBankEdit = (idx, field, val) => {
        const list = [...(config.methods || [])];
        list[idx] = { ...list[idx], [field]: field === 'name' ? val.toUpperCase() : val };
        sync({ ...config, methods: list });
    };

    const addMethod = () => {
        const list = [...(config.methods || [])];
        sync({ ...config, methods: [...list, { name: 'NUEVA CUENTA', isBank: false }] });
    };

    const deleteMethod = (idx) => {
        const list = config.methods.filter((_, i) => i !== idx);
        sync({ ...config, methods: list });
    };

    return (
        <div className="space-y-4 animate-fade-in">
            <button
                onClick={addMethod}
                className="w-full border-2 border-dashed border-gray-200 p-4 rounded-3xl text-[11px] font-black text-gray-400 hover:border-brand-dark hover:text-brand-dark transition-all sticky top-0 bg-white z-10"
            >
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
                            <button onClick={() => deleteMethod(i)} className="text-gray-300 hover:text-red-500 transition-colors">
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
    );
};

export default BankManager;