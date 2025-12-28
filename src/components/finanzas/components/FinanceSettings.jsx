import React, { useState } from 'react';
import { db, doc, updateDoc } from '../../../lib/firebase';
import { useUI } from '../../../context/UIContext';

// --- IMPORTACIONES DEL SISTEMA GENÉRICO (ADN BLINDADO) ---
import { Input } from '../../ui/forms/Controls';
import Checkbox from '../../ui/Checkbox';
import { Button } from '../../ui/display/Button';
import Icon from '../../ui/display/Icon';
import { TextLabel, H3 } from '../../ui/display/Typography';

const FinanceSettings = ({ config, financeConfigId }) => {
    const { notify } = useUI();
    const [catIngreso, setCatIngreso] = useState('');
    const [catGasto, setCatGasto] = useState('');
    const [payMethod, setPayMethod] = useState({ name: '', isBank: false });
    const [loading, setLoading] = useState(false);

    const updateFirebase = async (newData) => {
        setLoading(true);
        try {
            await updateDoc(doc(db, 'config_finanzas', financeConfigId), newData);
            notify("Preferencias de tesorería actualizadas");
        } catch (e) { notify(e.message, "error"); }
        finally { setLoading(false); }
    };

    const addItem = (type, value) => {
        if (!value.trim()) return;
        const list = [...(config[type] || [])];
        if (list.includes(value.toUpperCase().trim())) return notify("Este ítem ya existe", "warning");
        updateFirebase({ ...config, [type]: [...list, value.toUpperCase().trim()] });
        type === 'ingresos' ? setCatIngreso('') : setCatGasto('');
    };

    return (
        <div className="space-y-12 animate-fade-in">

            {/* GESTIÓN DE CATEGORÍAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* INGRESOS */}
                <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                            <Icon name="TrendingUp" size={18} />
                        </div>
                        <H3 className="text-sm">Fuentes de Ingreso</H3>
                    </div>

                    <div className="flex gap-3 items-end">
                        <div className="flex-1">
                            <Input
                                placeholder="EJ: VENTA DIRECTA"
                                value={catIngreso}
                                onChange={e => setCatIngreso(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addItem('ingresos', catIngreso)}
                            />
                        </div>
                        <Button onClick={() => addItem('ingresos', catIngreso)} variant="brand" className="h-12 w-12 p-0" icon="Plus" />
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                        {config.ingresos?.map(c => (
                            <div key={c} className="group bg-slate-50 hover:bg-emerald-50 px-4 py-2 rounded-full border border-slate-100 transition-all flex items-center gap-3">
                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">{c}</span>
                                <button
                                    onClick={() => updateFirebase({ ...config, ingresos: config.ingresos.filter(x => x !== c) })}
                                    className="text-slate-300 hover:text-brand-red transition-colors"
                                >
                                    <Icon name="X" size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* GASTOS */}
                <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                            <Icon name="TrendingDown" size={18} />
                        </div>
                        <H3 className="text-sm">Categorías de Gasto</H3>
                    </div>

                    <div className="flex gap-3 items-end">
                        <div className="flex-1">
                            <Input
                                placeholder="EJ: NÓMINA"
                                value={catGasto}
                                onChange={e => setCatGasto(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addItem('gastos', catGasto)}
                            />
                        </div>
                        <Button onClick={() => addItem('gastos', catGasto)} variant="brand" className="h-12 w-12 p-0" icon="Plus" />
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                        {config.gastos?.map(c => (
                            <div key={c} className="group bg-slate-50 hover:bg-red-50 px-4 py-2 rounded-full border border-slate-100 transition-all flex items-center gap-3">
                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">{c}</span>
                                <button
                                    onClick={() => updateFirebase({ ...config, gastos: config.gastos.filter(x => x !== c) })}
                                    className="text-slate-300 hover:text-brand-red transition-colors"
                                >
                                    <Icon name="X" size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* MÉTODOS DE PAGO */}
            <section className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                <div className="absolute right-[-20px] top-[-20px] opacity-10 rotate-12">
                    <Icon name="CreditCard" size={150} className="text-white" />
                </div>

                <div className="relative z-10 space-y-8">
                    <div className="space-y-2">
                        <H3 className="text-white">Cuentas y Métodos de Cobro</H3>
                        <TextLabel className="text-slate-400">Configura los canales por donde fluye el capital del negocio.</TextLabel>
                    </div>

                    <div className="bg-white/5 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/10 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                            <Input
                                label="Nombre de la Cuenta / Método"
                                placeholder="EJ: BANCOLOMBIA AHORROS"
                                value={payMethod.name}
                                onChange={e => setPayMethod({ ...payMethod, name: e.target.value })}
                                className="dark-theme" // Si tuvieras un preset oscuro, pero el Input genérico ya sirve
                            />
                            <div className="flex items-center gap-4 h-12 pb-1">
                                <Checkbox
                                    checked={payMethod.isBank}
                                    onChange={() => setPayMethod({ ...payMethod, isBank: !payMethod.isBank })}
                                    label="Validar Comprobante"
                                    className="text-white"
                                />
                            </div>
                        </div>

                        <Button
                            onClick={() => {
                                if (!payMethod.name) return notify("Ingresa un nombre para el método", "warning");
                                const list = [...(config.methods || [])];
                                updateFirebase({ ...config, methods: [...list, { ...payMethod, name: payMethod.name.toUpperCase().trim() }] });
                                setPayMethod({ name: '', isBank: false });
                            }}
                            loading={loading}
                            variant="brand"
                            className="w-full h-14 rounded-2xl shadow-xl shadow-brand-red/20"
                            icon="Link"
                        >
                            VINCULAR MÉTODO DE PAGO
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {config.methods?.map((m, i) => (
                            <div key={i} className="bg-white/10 border border-white/10 p-5 rounded-[1.8rem] flex justify-between items-center group hover:bg-white/20 transition-all">
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black text-white uppercase tracking-tight">{m.name}</div>
                                    <TextLabel className="text-slate-500 text-[8px]">{m.isBank ? 'EXIGE COMPROBANTE' : 'PAGO DIRECTO'}</TextLabel>
                                </div>
                                <button
                                    onClick={() => updateFirebase({ ...config, methods: config.methods.filter((_, idx) => idx !== i) })}
                                    className="text-white/20 hover:text-brand-red transition-colors"
                                >
                                    <Icon name="Trash2" size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default FinanceSettings;