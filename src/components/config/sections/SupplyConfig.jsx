import React, { useState } from 'react';
import useCollection from '../../../hooks/useCollection';
import { db, doc, addDoc, updateDoc, deleteDoc, collection } from '../../../lib/firebase';
import { useUI } from '../../../context/UIContext';
import { Input } from '../../ui/Input';
import Button from '../../ui/Button';
import Icon from '../../ui/Icon';

const SupplyConfig = () => {
    const { data: lines } = useCollection('config_lineas');
    const { data: providers } = useCollection('proveedores');
    const { notify } = useUI();
    const [lineName, setLineName] = useState('');
    const [provForm, setProvForm] = useState({ nombre: '', id_custom: '', contacto: '', lineas: [] });

    const saveLine = async () => {
        if (!lineName) return;
        await addDoc(collection(db, 'config_lineas'), { nombre: lineName.toUpperCase() });
        setLineName(''); notify("Línea creada");
    };

    const saveProvider = async () => {
        if (!provForm.nombre || !provForm.id_custom) return notify("Faltan datos", "error");
        provForm.id
            ? await updateDoc(doc(db, 'proveedores', provForm.id), provForm)
            : await addDoc(collection(db, 'proveedores'), provForm);
        setProvForm({ nombre: '', id_custom: '', contacto: '', lineas: [] });
        notify("Proveedor guardado");
    };

    return (
        <div className="max-w-3xl mx-auto space-y-16 animate-fade-in">
            {/* BLOQUE 1: LÍNEAS */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                    <div className="bg-brand-red w-2 h-6 rounded-full"></div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-800">1. Líneas de Negocio</h3>
                </div>
                <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 flex gap-4 shadow-inner">
                    <Input
                        value={lineName}
                        onChange={e => setLineName(e.target.value)}
                        placeholder="NUEVA LÍNEA (EJ: CALZADO)"
                    />
                    <Button onClick={saveLine} className="bg-brand-dark px-8 text-white h-11">AÑADIR</Button>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                    {lines.map(l => (
                        <div key={l.id} className="bg-white border px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm group">
                            <span className="text-[10px] font-black text-gray-600 uppercase">{l.nombre}</span>
                            <button onClick={() => deleteDoc(doc(db, 'config_lineas', l.id))} className="text-gray-300 hover:text-red-500 transition-colors">
                                <Icon name="X" size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* BLOQUE 2: PROVEEDORES */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                    <div className="bg-brand-dark w-2 h-6 rounded-full"></div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-800">2. Directorio de Proveedores</h3>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-gray-100 space-y-6 shadow-sm">
                    <Input label="Nombre del Proveedor" value={provForm.nombre} onChange={e => setProvForm({ ...provForm, nombre: e.target.value.toUpperCase() })} />
                    <div className="grid grid-cols-2 gap-6">
                        <Input label="ID Corto (SKU)" value={provForm.id_custom} onChange={e => setProvForm({ ...provForm, id_custom: e.target.value.toUpperCase() })} maxLength={3} />
                        <Input label="WhatsApp / Contacto" value={provForm.contacto} onChange={e => setProvForm({ ...provForm, contacto: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-3 ml-1">Vincular a Líneas de Producto</label>
                        <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            {lines.map(l => (
                                <button
                                    key={l.id}
                                    onClick={() => {
                                        const active = provForm.lineas.includes(l.nombre);
                                        setProvForm({ ...provForm, lineas: active ? provForm.lineas.filter(x => x !== l.nombre) : [...provForm.lineas, l.nombre] });
                                    }}
                                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all shadow-sm ${provForm.lineas.includes(l.nombre) ? 'bg-brand-red text-white' : 'bg-white border text-gray-400'}`}
                                >
                                    {l.nombre}
                                </button>
                            ))}
                        </div>
                    </div>
                    <Button onClick={saveProvider} className="w-full bg-brand-dark h-14 text-white uppercase font-black tracking-widest">
                        {provForm.id ? 'ACTUALIZAR PROVEEDOR' : 'REGISTRAR PROVEEDOR'}
                    </Button>
                </div>

                {/* Lista de Proveedores Registrados */}
                <div className="grid grid-cols-1 gap-3">
                    {providers.map(p => (
                        <div key={p.id} className="flex justify-between items-center p-5 border border-gray-100 rounded-2xl bg-white hover:border-brand-red transition-all group shadow-sm">
                            <div>
                                <div className="font-black text-xs text-gray-800 uppercase">{p.nombre} <span className="text-gray-300 ml-2">#{p.id_custom}</span></div>
                                <div className="text-[9px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">{p.lineas?.join(' • ')}</div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="secondary" onClick={() => setProvForm(p)} className="h-9 w-9 !p-0"><Icon name="Edit" size={16} /></Button>
                                <Button variant="ghost" onClick={() => deleteDoc(doc(db, 'proveedores', p.id))} className="h-9 w-9 !p-0 text-red-500 hover:bg-red-50"><Icon name="Trash" size={16} /></Button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default SupplyConfig;