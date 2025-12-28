import React, { useState } from 'react';
import useCollection from '../../../hooks/useCollection';
import { db, doc, addDoc, updateDoc, deleteDoc, collection } from '../../../lib/firebase';
import { useUI } from '../../../context/UIContext';
import { TOKENS } from '../../../theme/constants';

import { FormSection } from '../../ui/layout/Containers';
import { H2, TextLabel } from '../../ui/display/Typography';
import { Input } from '../../ui/forms/Controls';
import { Button } from '../../ui/display/Button';
import Icon, { Spinner } from '../../ui/display/Icon';

const SupplyConfig = () => {
    const { notify } = useUI();

    // OBTENEMOS EL MAPEO PRIMERO
    const { data: generalConfig } = useCollection('config_general');
    const mapping = generalConfig?.[0]?.mapping || { coll_providers: 'proveedores', coll_lines: 'config_lineas' };

    // LLAMADA DINÁMICA
    const { data: lines, loading: loadingLines } = useCollection(mapping.coll_lines);
    const { data: providers, loading: loadingProviders } = useCollection(mapping.coll_providers);

    const [lineName, setLineName] = useState('');
    const [provForm, setProvForm] = useState({ nombre: '', id_custom: '', contacto: '', lineas: [] });

    const saveLine = async () => {
        if (!lineName.trim()) return;
        try {
            await addDoc(collection(db, mapping.coll_lines), { nombre: lineName.toUpperCase() });
            setLineName('');
            notify("Línea creada");
        } catch (e) { notify("Error", "error"); }
    };

    const saveProvider = async () => {
        if (!provForm.nombre || !provForm.id_custom) return notify("Faltan datos", "error");
        try {
            provForm.id
                ? await updateDoc(doc(db, mapping.coll_providers, provForm.id), provForm)
                : await addDoc(collection(db, mapping.coll_providers), { ...provForm, lineas: provForm.lineas || [] });
            setProvForm({ nombre: '', id_custom: '', contacto: '', lineas: [] });
            notify("Proveedor guardado");
        } catch (e) { notify("Error", "error"); }
    };

    if (loadingLines || loadingProviders) return <Spinner />;

    return (
        <div className={`space-y-16 ${TOKENS.animation.fade}`}>
            <section className="space-y-6">
                <H2>Estructura de Líneas ({lines.length})</H2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className={`bg-brand-light/30 ${TOKENS.spacing.card} ${TOKENS.radius.card} border border-brand-light shadow-inner`}>
                        <Input label="Nueva Línea" value={lineName} onChange={e => setLineName(e.target.value)} />
                        <Button onClick={saveLine} variant="brand" className="w-full mt-4" icon="Plus">AÑADIR</Button>
                    </div>
                    <div className="lg:col-span-2 flex flex-wrap gap-2">
                        {lines.map(l => (
                            <div key={l.id} className={`px-4 py-2 bg-brand-surface border border-brand-light ${TOKENS.radius.inner} flex items-center gap-3`}>
                                <span className={TOKENS.text.body}>{l.nombre}</span>
                                <button onClick={() => deleteDoc(doc(db, mapping.coll_lines, l.id))} className="text-brand-gray/20 hover:text-brand-red"><Icon name="X" size={14} /></button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="space-y-8 pt-10 border-t border-brand-light">
                <H2>Proveedores Activos ({providers.length})</H2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <FormSection title="Gestión de Proveedor">
                        <Input label="Razón Social" value={provForm.nombre} onChange={e => setProvForm({ ...provForm, nombre: e.target.value })} />
                        <Input label="SKU Prefijo" value={provForm.id_custom} onChange={e => setProvForm({ ...provForm, id_custom: e.target.value.toUpperCase() })} />
                        <Button onClick={saveProvider} variant="brand" className="w-full mt-4" icon="Save">GUARDAR</Button>
                    </FormSection>

                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {providers.map(p => (
                            <div key={p.id} className={`p-5 bg-brand-surface border border-brand-light ${TOKENS.radius.card} flex justify-between items-center shadow-sm`}>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <span className="px-2 py-0.5 bg-brand-dark text-white text-[9px] rounded-md">{p.id_custom}</span>
                                        <span className={TOKENS.text.h3}>{p.nombre}</span>
                                    </div>
                                    <TextLabel className="mt-1">{p.contacto || 'Sin contacto'}</TextLabel>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setProvForm(p)} className="p-3 text-brand-gray/20 hover:text-brand-dark"><Icon name="Edit" size={18} /></button>
                                    <button onClick={() => deleteDoc(doc(db, mapping.coll_providers, p.id))} className="p-3 text-brand-gray/20 hover:text-brand-red"><Icon name="Trash" size={18} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default SupplyConfig;