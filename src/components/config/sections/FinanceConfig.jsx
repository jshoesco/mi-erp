import React, { useState, useEffect } from 'react';
import useCollection from '../../../hooks/useCollection';
import { db, doc, updateDoc } from '../../../lib/firebase';
import { useUI } from '../../../context/UIContext';
import { Input } from '../../ui/Input';
import Button from '../../ui/Button';
import Icon from '../../ui/Icon';
import Checkbox from '../../ui/Checkbox';

const FinanceConfig = () => {
    const { data: financeConfig } = useCollection('config_finanzas');
    const { notify } = useUI();

    const [catIngreso, setCatIngreso] = useState('');
    const [catGasto, setCatGasto] = useState('');
    const [payMethod, setPayMethod] = useState({ name: '', isBank: false });
    const [config, setConfig] = useState({ ingresos: [], gastos: [], methods: [] });

    useEffect(() => { if (financeConfig?.[0]) setConfig(financeConfig[0]); }, [financeConfig]);

    const updateFirebase = async (newData) => {
        try {
            await updateDoc(doc(db, 'config_finanzas', financeConfig[0].id), newData);
            notify("Configuración financiera actualizada");
        } catch (e) { notify(e.message, "error"); }
    };

    const addCategory = (type) => {
        const val = type === 'ingresos' ? catIngreso : catGasto;
        if (!val) return;
        const list = [...(config[type] || [])];
        if (list.includes(val.toUpperCase())) return notify("La categoría ya existe", "warning");

        const updated = { ...config, [type]: [...list, val.toUpperCase()] };
        updateFirebase(updated);
        type === 'ingresos' ? setCatIngreso('') : setCatGasto('');
    };

    const addMethod = () => {
        if (!payMethod.name) return;
        const list = [...(config.methods || [])];
        const updated = { ...config, methods: [...list, { ...payMethod, name: payMethod.name.toUpperCase() }] };
        updateFirebase(updated);
        setPayMethod({ name: '', isBank: false });
    };

    return (
        <div className="max-w-3xl mx-auto space-y-16 animate-fade-in">
            {/* BLOQUE CATEGORÍAS */}
            <div className="grid grid-cols-1 gap-12">
                {/* INGRESOS */}
                <div className="space-y-6">
                    <h3 className="text-sm font-black uppercase text-emerald-600 border-b border-emerald-100 pb-4">Categorías de Ingreso</h3>
                    <div className="bg-emerald-50/30 p-6 rounded-3xl border border-emerald-100 flex gap-4">
                        <Input value={catIngreso} onChange={e => setCatIngreso(e.target.value)} placeholder="EJ: VENTAS WEB" />
                        <Button onClick={() => addCategory('ingresos')} className="bg-emerald-600 text-white px-8">AÑADIR</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {config.ingresos?.map(c => (
                            <span key={c} className="px-4 py-2 bg-white text-emerald-700 rounded-xl text-[10px] font-black border border-emerald-100 shadow-sm flex items-center gap-3">
                                {c} <button onClick={() => updateFirebase({ ...config, ingresos: config.ingresos.filter(x => x !== c) })} className="hover:text-red-500"><Icon name="X" size={14} /></button>
                            </span>
                        ))}
                    </div>
                </div>

                {/* GASTOS */}
                <div className="space-y-6">
                    <h3 className="text-sm font-black uppercase text-red-600 border-b border-red-100 pb-4">Categorías de Gasto</h3>
                    <div className="bg-red-50/30 p-6 rounded-3xl border border-red-100 flex gap-4">
                        <Input value={catGasto} onChange={e => setCatGasto(e.target.value)} placeholder="EJ: NÓMINA" />
                        <Button onClick={() => addCategory('gastos')} className="bg-red-600 text-white px-8">AÑADIR</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {config.gastos?.map(c => (
                            <span key={c} className="px-4 py-2 bg-white text-red-700 rounded-xl text-[10px] font-black border border-red-100 shadow-sm flex items-center gap-3">
                                {c} <button onClick={() => updateFirebase({ ...config, gastos: config.gastos.filter(x => x !== c) })} className="hover:text-red-500"><Icon name="X" size={14} /></button>
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* BLOQUE BANCOS */}
            <div className="space-y-6 pt-10 border-t border-gray-100">
                <h3 className="text-sm font-black uppercase text-gray-800 border-b border-gray-100 pb-4">Bancos y Métodos de Pago</h3>
                <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 space-y-6">
                    <Input label="Nombre del Banco o Método" value={payMethod.name} onChange={e => setPayMethod({ ...payMethod, name: e.target.value })} />
                    <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100">
                        <Checkbox checked={payMethod.isBank} onChange={() => setPayMethod({ ...payMethod, isBank: !payMethod.isBank })} />
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Este método requiere comprobante de transacción</span>
                    </div>
                    <Button onClick={addMethod} className="w-full bg-brand-dark h-14 text-white uppercase font-black">REGISTRAR MÉTODO DE PAGO</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {config.methods?.map((m, i) => (
                        <div key={i} className="p-5 border border-gray-100 rounded-2xl flex justify-between items-center bg-white shadow-sm hover:shadow-md transition-all">
                            <div>
                                <div className="font-black text-xs uppercase text-gray-800">{m.name}</div>
                                {m.isBank && <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1 mt-1"><Icon name="Check" size={10} /> Requiere Comprobante</span>}
                            </div>
                            <button onClick={() => {
                                const list = [...config.methods];
                                list.splice(i, 1);
                                updateFirebase({ ...config, methods: list });
                            }} className="text-gray-300 hover:text-red-500"><Icon name="Trash" size={18} /></button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FinanceConfig;