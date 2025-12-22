// src/components/finanzas/components/FinanceSettings.jsx
import React, { useState } from 'react';
import { db, doc, updateDoc } from '../../../lib/firebase';
import { useUI } from '../../../context/UIContext';
import { Input } from '../../ui/Input';
import Button from '../../ui/Button';
import Icon from '../../ui/Icon';
import Checkbox from '../../ui/Checkbox';

const FinanceSettings = ({ config, financeConfigId }) => {
    const { notify } = useUI();
    const [catIngreso, setCatIngreso] = useState('');
    const [catGasto, setCatGasto] = useState('');
    const [payMethod, setPayMethod] = useState({ name: '', isBank: false });

    const updateFirebase = async (newData) => {
        try {
            await updateDoc(doc(db, 'config_finanzas', financeConfigId), newData);
            notify("Preferencias actualizadas");
        } catch (e) { notify(e.message, "error"); }
    };

    const addItem = (type, value) => {
        if (!value) return;
        const list = [...(config[type] || [])];
        if (list.includes(value.toUpperCase())) return notify("Ya existe", "warning");
        updateFirebase({ ...config, [type]: [...list, value.toUpperCase()] });
        type === 'ingresos' ? setCatIngreso('') : setCatGasto('');
    };

    return (
        <div className="space-y-12 animate-fade-in p-2">
            {/* GESTIÓN DE CATEGORÍAS - Ahora con diseño más compacto y funcional */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="space-y-4">
                    <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                        <Icon name="TrendingUp" size={14} /> Categorías de Ingreso
                    </h4>
                    <div className="flex gap-2">
                        <Input value={catIngreso} onChange={e => setCatIngreso(e.target.value)} placeholder="Ej: Venta Mayorista" className="h-10 text-xs" />
                        <Button onClick={() => addItem('ingresos', catIngreso)} className="bg-emerald-600 text-white px-4 h-10"> + </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                        {config.ingresos?.map(c => (
                            <div key={c} className="bg-emerald-50 text-[9px] font-black text-emerald-700 px-2 py-1 rounded-lg border border-emerald-100 flex items-center gap-2">
                                {c} <button onClick={() => updateFirebase({ ...config, ingresos: config.ingresos.filter(x => x !== c) })}><Icon name="X" size={12} /></button>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="space-y-4">
                    <h4 className="text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center gap-2">
                        <Icon name="TrendingDown" size={14} /> Categorías de Gasto
                    </h4>
                    <div className="flex gap-2">
                        <Input value={catGasto} onChange={e => setCatGasto(e.target.value)} placeholder="Ej: Alquiler" className="h-10 text-xs" />
                        <Button onClick={() => addItem('gastos', catGasto)} className="bg-red-600 text-white px-4 h-10"> + </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                        {config.gastos?.map(c => (
                            <div key={c} className="bg-red-50 text-[9px] font-black text-red-700 px-2 py-1 rounded-lg border border-red-100 flex items-center gap-2">
                                {c} <button onClick={() => updateFirebase({ ...config, gastos: config.gastos.filter(x => x !== c) })}><Icon name="X" size={12} /></button>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* MÉTODOS DE PAGO - Mantenemos la estructura pero la hacemos sentir como "Ajustes de Banco" */}
            <section className="pt-8 border-t border-gray-100">
                <h4 className="text-[10px] font-black text-gray-800 uppercase tracking-widest mb-4">Cuentas y Métodos de Cobro</h4>
                <div className="bg-gray-50 p-6 rounded-2xl space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Nombre de la Cuenta" value={payMethod.name} onChange={e => setPayMethod({ ...payMethod, name: e.target.value })} />
                        <div className="flex items-center gap-3 pt-6">
                            <Checkbox checked={payMethod.isBank} onChange={() => setPayMethod({ ...payMethod, isBank: !payMethod.isBank })} />
                            <span className="text-[10px] font-bold text-gray-400 uppercase">¿Validar Comprobante?</span>
                        </div>
                    </div>
                    <Button onClick={() => {
                        const list = [...(config.methods || [])];
                        updateFirebase({ ...config, methods: [...list, { ...payMethod, name: payMethod.name.toUpperCase() }] });
                        setPayMethod({ name: '', isBank: false });
                    }} className="w-full bg-brand-dark text-white">VINCULAR NUEVO MÉTODO</Button>
                </div>
            </section>
        </div>
    );
};

export default FinanceSettings;