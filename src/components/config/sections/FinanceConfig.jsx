import React, { useState, useEffect } from 'react';
import useCollection from '../../../hooks/useCollection';
import { db, doc, updateDoc } from '../../../lib/firebase';
import { useUI } from '../../../context/UIContext';
import { TOKENS } from '../../../theme/constants';

// IMPORTACIÓN DEL SISTEMA DE DISEÑO GENÉRICO
import { FormSection } from '../../ui/layout/Containers';
import { H2, TextLabel } from '../../ui/display/Typography';
import { Input } from '../../ui/forms/Controls';
import { Button } from '../../ui/display/Button';
import Icon from '../../ui/display/Icon';
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
        if (list.includes(val.trim())) return notify("La categoría ya existe", "warning");

        const updated = { ...config, [type]: [...list, val.trim()] };
        updateFirebase(updated);
        type === 'ingresos' ? setCatIngreso('') : setCatGasto('');
    };

    const addMethod = () => {
        if (!payMethod.name) return;
        const list = [...(config.methods || [])];
        const updated = { ...config, methods: [...list, { ...payMethod, name: payMethod.name.trim() }] };
        updateFirebase(updated);
        setPayMethod({ name: '', isBank: false });
    };

    return (
        <div className={`space-y-16 ${TOKENS.animation.fade}`}>
            {/* SECCIÓN CATEGORÍAS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                {/* INGRESOS */}
                <div className="space-y-6">
                    <H2>Categorías de Ingreso</H2>
                    <div className={`flex gap-4 items-end bg-brand-light/30 ${TOKENS.spacing.card} ${TOKENS.radius.card} border border-brand-light shadow-inner`}>
                        <Input
                            label="Nueva Categoría"
                            value={catIngreso}
                            onChange={e => setCatIngreso(e.target.value)}
                            placeholder="Ej: Ventas Directas"
                        />
                        <Button onClick={() => addCategory('ingresos')} icon="Plus" className="h-12 shadow-none">Añadir</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {config.ingresos?.map(c => (
                            <div key={c} className={`px-4 py-2 bg-brand-surface border border-brand-light ${TOKENS.radius.inner} flex items-center gap-3 shadow-sm group`}>
                                <span className={TOKENS.text.tiny + " text-brand-gray"}>{c}</span>
                                <button onClick={() => updateFirebase({ ...config, ingresos: config.ingresos.filter(x => x !== c) })} className="text-brand-gray/20 hover:text-brand-red transition-colors">
                                    <Icon name="X" size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* GASTOS */}
                <div className="space-y-6">
                    <H2>Categorías de Gasto</H2>
                    <div className={`flex gap-4 items-end bg-brand-light/30 ${TOKENS.spacing.card} ${TOKENS.radius.card} border border-brand-light shadow-inner`}>
                        <Input
                            label="Nueva Categoría"
                            value={catGasto}
                            onChange={e => setCatGasto(e.target.value)}
                            placeholder="Ej: Nómina"
                        />
                        <Button onClick={() => addCategory('gastos')} icon="Plus" className="h-12 shadow-none">Añadir</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {config.gastos?.map(c => (
                            <div key={c} className={`px-4 py-2 bg-brand-surface border border-brand-light ${TOKENS.radius.inner} flex items-center gap-3 shadow-sm group`}>
                                <span className={TOKENS.text.tiny + " text-brand-gray"}>{c}</span>
                                <button onClick={() => updateFirebase({ ...config, gastos: config.gastos.filter(x => x !== c) })} className="text-brand-gray/20 hover:text-brand-red transition-colors">
                                    <Icon name="X" size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* SECCIÓN MÉTODOS DE PAGO */}
            <div className={`space-y-8 pt-10 border-t border-brand-light`}>
                <H2>Bancos y Métodos de Pago</H2>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* FORMULARIO */}
                    <div className="lg:col-span-1">
                        <FormSection columns={1} title="Nuevo Método">
                            <Input label="Nombre del Método" value={payMethod.name} onChange={e => setPayMethod({ ...payMethod, name: e.target.value })} />
                            <div className={`flex items-center gap-4 bg-brand-light/20 p-4 ${TOKENS.radius.inner} border border-brand-light mt-2`}>
                                <Checkbox checked={payMethod.isBank} onChange={() => setPayMethod({ ...payMethod, isBank: !payMethod.isBank })} />
                                <TextLabel>Requiere comprobante</TextLabel>
                            </div>
                            <Button onClick={addMethod} variant="brand" className="w-full mt-4 h-14">Registrar Método</Button>
                        </FormSection>
                    </div>

                    {/* LISTADO */}
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
                        {config.methods?.map((m, i) => (
                            <div key={i} className={`p-5 bg-brand-surface border border-brand-light ${TOKENS.radius.card} flex justify-between items-center group hover:border-brand-red/30 transition-all shadow-sm`}>
                                <div>
                                    <div className={TOKENS.text.h3}>{m.name}</div>
                                    {m.isBank && (
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <div className="w-1.5 h-1.5 bg-brand-red rounded-full animate-pulse" />
                                            <span className={`${TOKENS.text.tiny} text-brand-gray/40`}>Validación Requerida</span>
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => {
                                    const list = [...config.methods];
                                    list.splice(i, 1);
                                    updateFirebase({ ...config, methods: list });
                                }} className={`p-2 text-brand-gray/20 hover:text-brand-red hover:bg-brand-red/5 ${TOKENS.radius.inner} transition-all`}>
                                    <Icon name="Trash" size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinanceConfig;