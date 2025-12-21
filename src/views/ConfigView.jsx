import React, { useState, useEffect } from 'react';
import useCollection from '../hooks/useCollection';
import { useUI } from '../context/UIContext';
import { db, doc, addDoc, updateDoc, deleteDoc, collection } from '../lib/firebase';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import { Input, NumberInput } from '../components/ui/Input';
import { Select } from '../components/ui/Select'; // <--- NUEVO
import Checkbox from '../components/ui/Checkbox'; // <--- NUEVO

const ConfigView = () => {
    const { data: generalConfig } = useCollection('config_general');
    const { data: providers } = useCollection('proveedores');
    const { data: shipping } = useCollection('tarifas_envios');
    const { data: financeConfig } = useCollection('config_finanzas');
    const { data: lines } = useCollection('config_lineas');
    const { data: anomalyConfigs } = useCollection('config_novedades');
    const { data: remitenteData } = useCollection('config_remitente');

    const [tab, setTab] = useState('remitente');
    const { notify, confirmAction } = useUI();

    // Estados
    const [provForm, setProvForm] = useState({ nombre: '', id_custom: '', contacto: '', lineas: [] });
    const [shipForm, setShipForm] = useState({ ciudad: '', tarifa: '', tiene_acopio: false });
    const [cloudForm, setCloudForm] = useState({ cloud_name: '', upload_preset: '', cloudinary_folder: '', cloudinary_transaction_folder: '', api_key: '', api_secret: '', drive_folder_id: '' });
    const [sender, setSender] = useState({ nombre: '', cedula: '', telefono: '' });
    const [lineName, setLineName] = useState('');
    const [catIngreso, setCatIngreso] = useState('');
    const [catGasto, setCatGasto] = useState('');
    const [payMethod, setPayMethod] = useState({ name: '', isBank: false });
    const [finConfigData, setFinConfigData] = useState({ ingresos: [], gastos: [], methods: [] });
    const [anomForm, setAnomForm] = useState({ motivo: '', accion: 'Devolver a Proveedor' });

    // Effects de carga (Mantengo tu lógica original, solo limpio el código visual)
    useEffect(() => { if (generalConfig?.[0]) setCloudForm(generalConfig[0]); }, [generalConfig]);
    useEffect(() => { if (financeConfig?.[0]) setFinConfigData(financeConfig[0]); }, [financeConfig]);
    useEffect(() => { if (remitenteData?.[0]) setSender(remitenteData[0]); }, [remitenteData]);

    // Funciones de Guardado (Optimizadas)
    const handleSaveSender = async () => {
        try {
            remitenteData?.length
                ? await updateDoc(doc(db, 'config_remitente', remitenteData[0].id), sender)
                : await addDoc(collection(db, 'config_remitente'), sender);
            notify("Remitente guardado");
        } catch (e) { notify(e.message, "error"); }
    };

    const saveLine = async () => {
        if (!lineName) return;
        await addDoc(collection(db, 'config_lineas'), { nombre: lineName.toUpperCase() });
        setLineName(''); notify("Línea agregada");
    };

    const saveProvider = async () => {
        if (!provForm.nombre) return notify("Falta nombre", "error");
        const payload = { ...provForm, id_custom: provForm.id_custom.toUpperCase() };
        provForm.id ? await updateDoc(doc(db, 'proveedores', provForm.id), payload) : await addDoc(collection(db, 'proveedores'), payload);
        setProvForm({ nombre: '', id_custom: '', contacto: '', lineas: [] }); notify("Proveedor guardado");
    };

    const saveShipping = async () => {
        if (!shipForm.ciudad) return notify("Falta ciudad", "error");
        const payload = { ...shipForm, tarifa: Number(shipForm.tarifa) };
        shipForm.id ? await updateDoc(doc(db, 'tarifas_envios', shipForm.id), payload) : await addDoc(collection(db, 'tarifas_envios'), payload);
        setShipForm({ ciudad: '', tarifa: '', tiene_acopio: false }); notify("Tarifa guardada");
    };

    // ... (El resto de tus funciones de guardado se mantienen igual, solo cambia el render)

    const Label = ({ children }) => <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] ml-1 block mb-2">{children}</label>;

    return (
        <div className="p-6 max-w-6xl mx-auto pb-24">
            <h1 className="text-2xl font-black text-gray-900 mb-6 tracking-tight">CONFIGURACIÓN DEL SISTEMA</h1>

            {/* TABS */}
            <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-100 pb-1">
                {[
                    { id: 'remitente', label: 'Remitente', icon: 'User' },
                    { id: 'lines', label: 'Líneas', icon: 'Tag' },
                    { id: 'providers', label: 'Proveedores', icon: 'Truck' },
                    { id: 'shipping', label: 'Envíos', icon: 'MapPin' },
                    { id: 'finance', label: 'Finanzas', icon: 'DollarSign' },
                    { id: 'anomalies', label: 'Novedades', icon: 'AlertTriangle' },
                    { id: 'general', label: 'Sistema', icon: 'Cpu' }
                ].map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-3 rounded-t-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${tab === t.id ? 'bg-brand-dark text-white shadow-lg -translate-y-1' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
                        <Icon name={t.icon} size={14} /> {t.label}
                    </button>
                ))}
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm min-h-[400px]">

                {/* 1. REMITENTE */}
                {tab === 'remitente' && (
                    <div className="max-w-md space-y-5 animate-fade-in">
                        <Input label="Nombre / Razón Social" value={sender.nombre} onChange={e => setSender({ ...sender, nombre: e.target.value })} />
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Cédula / NIT" value={sender.cedula} onChange={e => setSender({ ...sender, cedula: e.target.value })} />
                            <Input label="Teléfono" value={sender.telefono} onChange={e => setSender({ ...sender, telefono: e.target.value })} />
                        </div>
                        <Button onClick={handleSaveSender} className="w-full bg-brand-red text-white">Guardar Datos</Button>
                    </div>
                )}

                {/* 2. PROVEEDORES */}
                {tab === 'providers' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                        <div className="space-y-4">
                            <Input label="Nombre Proveedor" value={provForm.nombre} onChange={e => setProvForm({ ...provForm, nombre: e.target.value.toUpperCase() })} />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="ID Corto (3 letras)" value={provForm.id_custom} onChange={e => setProvForm({ ...provForm, id_custom: e.target.value.toUpperCase() })} maxLength={3} />
                                <Input label="Contacto" value={provForm.contacto} onChange={e => setProvForm({ ...provForm, contacto: e.target.value })} />
                            </div>
                            <div>
                                <Label>Líneas Asociadas</Label>
                                <div className="flex flex-wrap gap-2 p-3 border border-gray-100 rounded-xl bg-gray-50 max-h-40 overflow-y-auto custom-scrollbar">
                                    {lines.map(l => (
                                        <button key={l.id} onClick={() => {
                                            const ls = provForm.lineas.includes(l.nombre) ? provForm.lineas.filter(x => x !== l.nombre) : [...provForm.lineas, l.nombre];
                                            setProvForm({ ...provForm, lineas: ls });
                                        }} className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase transition-all ${provForm.lineas.includes(l.nombre) ? 'bg-brand-red text-white' : 'bg-white border text-gray-400'}`}>
                                            {l.nombre}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <Button onClick={saveProvider} className="w-full">Guardar Proveedor</Button>
                        </div>
                        <div className="lg:col-span-2 space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                            {providers.map(p => (
                                <div key={p.id} className="flex justify-between items-center p-4 border border-gray-100 rounded-xl hover:border-brand-red/30 transition-all bg-gray-50/30 group">
                                    <div>
                                        <div className="font-black text-xs text-gray-800 uppercase">{p.nombre} ({p.id_custom})</div>
                                        <div className="text-[10px] text-gray-400 mt-1">{p.lineas?.join(', ')}</div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="secondary" onClick={() => setProvForm(p)} className="h-8 w-8 !p-0"><Icon name="Edit" size={14} /></Button>
                                        <Button variant="ghost" onClick={() => deleteDoc(doc(db, 'proveedores', p.id))} className="h-8 w-8 !p-0 text-red-500 hover:bg-red-50"><Icon name="Trash" size={14} /></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 3. LÍNEAS */}
                {tab === 'lines' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                        <div className="space-y-4">
                            <Input label="Nueva Línea" value={lineName} onChange={e => setLineName(e.target.value.toUpperCase())} />
                            <Button onClick={saveLine} className="w-full">Agregar Línea</Button>
                        </div>
                        <div className="flex flex-wrap content-start gap-3">
                            {lines.map(l => (
                                <div key={l.id} className="bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg flex items-center gap-2 group">
                                    <span className="text-[10px] font-black uppercase text-gray-600">{l.nombre}</span>
                                    <button onClick={() => deleteDoc(doc(db, 'config_lineas', l.id))} className="text-gray-300 hover:text-red-500"><Icon name="X" size={12} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 4. ENVÍOS */}
                {tab === 'shipping' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                        <div className="space-y-4">
                            <Input label="Ciudad Destino" value={shipForm.ciudad} onChange={e => setShipForm({ ...shipForm, ciudad: e.target.value.toUpperCase() })} />
                            <NumberInput label="Tarifa Estándar" value={shipForm.tarifa} onChange={e => setShipForm({ ...shipForm, tarifa: e.target.value })} />
                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <Checkbox checked={shipForm.tiene_acopio} onChange={() => setShipForm({ ...shipForm, tiene_acopio: !shipForm.tiene_acopio })} />
                                <span className="text-[10px] font-bold text-gray-500 uppercase">¿Tiene Acopio (Bodega)?</span>
                            </div>
                            <Button onClick={saveShipping} className="w-full">Guardar Tarifa</Button>
                        </div>
                        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                            {shipping.sort((a, b) => a.ciudad.localeCompare(b.ciudad)).map(s => (
                                <div key={s.id} onClick={() => setShipForm(s)} className="p-3 border border-gray-100 rounded-xl hover:border-brand-red cursor-pointer transition-all bg-white relative group">
                                    <div className="font-black text-[10px] text-gray-800 uppercase">{s.ciudad}</div>
                                    <div className="text-xs text-brand-red font-bold mt-1">{formatCurrency(s.tarifa)}</div>
                                    {s.tiene_acopio && <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full" title="Acopio"></div>}
                                    <button onClick={(e) => { e.stopPropagation(); deleteDoc(doc(db, 'tarifas_envios', s.id)); }} className="absolute bottom-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Icon name="Trash" size={12} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 5. FINANZAS */}
                {tab === 'finance' && (
                    <div className="space-y-8 animate-fade-in">
                        {/* Categorías */}
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <Label>Categorías de Ingreso</Label>
                                <div className="flex gap-2 mb-3">
                                    <Input value={catIngreso} onChange={e => setCatIngreso(e.target.value)} placeholder="NUEVA..." />
                                    <Button onClick={() => {
                                        if (!catIngreso) return;
                                        const list = [...(finConfigData.ingresos || [])];
                                        if (!list.includes(catIngreso)) updateDoc(doc(db, 'config_finanzas', financeConfig[0].id), { ingresos: [...list, catIngreso] });
                                        setCatIngreso('');
                                    }} icon="Plus" className="w-12" />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {finConfigData.ingresos?.map(c => (
                                        <span key={c} className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold border border-emerald-100 flex items-center gap-2">
                                            {c} <button onClick={() => updateDoc(doc(db, 'config_finanzas', financeConfig[0].id), { ingresos: finConfigData.ingresos.filter(x => x !== c) })}><Icon name="X" size={10} /></button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <Label>Categorías de Gasto</Label>
                                <div className="flex gap-2 mb-3">
                                    <Input value={catGasto} onChange={e => setCatGasto(e.target.value)} placeholder="NUEVA..." />
                                    <Button onClick={() => {
                                        if (!catGasto) return;
                                        const list = [...(finConfigData.gastos || [])];
                                        if (!list.includes(catGasto)) updateDoc(doc(db, 'config_finanzas', financeConfig[0].id), { gastos: [...list, catGasto] });
                                        setCatGasto('');
                                    }} icon="Plus" className="w-12 bg-red-500" />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {finConfigData.gastos?.map(c => (
                                        <span key={c} className="px-2 py-1 bg-red-50 text-red-700 rounded-lg text-[10px] font-bold border border-red-100 flex items-center gap-2">
                                            {c} <button onClick={() => updateDoc(doc(db, 'config_finanzas', financeConfig[0].id), { gastos: finConfigData.gastos.filter(x => x !== c) })}><Icon name="X" size={10} /></button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Métodos de Pago */}
                        <div className="pt-6 border-t border-gray-100">
                            <Label>Métodos de Pago / Bancos</Label>
                            <div className="flex gap-4 items-end mb-4 bg-gray-50 p-4 rounded-xl">
                                <div className="flex-1"><Input label="Nombre Banco/Método" value={payMethod.name} onChange={e => setPayMethod({ ...payMethod, name: e.target.value })} /></div>
                                <div className="pb-3"><div className="flex items-center gap-2"><Checkbox checked={payMethod.isBank} onChange={() => setPayMethod({ ...payMethod, isBank: !payMethod.isBank })} /><span className="text-[10px] font-bold text-gray-500 uppercase">¿Pide Comprobante?</span></div></div>
                                <Button onClick={() => {
                                    if (!payMethod.name) return;
                                    const list = [...(finConfigData.methods || []), payMethod];
                                    updateDoc(doc(db, 'config_finanzas', financeConfig[0].id), { methods: list });
                                    setPayMethod({ name: '', isBank: false });
                                }} className="bg-brand-dark">Agregar Método</Button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {finConfigData.methods?.map((m, i) => (
                                    <div key={i} className="p-3 border rounded-xl flex justify-between items-center bg-white">
                                        <div>
                                            <div className="font-bold text-xs text-gray-800">{m.name}</div>
                                            {m.isBank && <span className="text-[9px] text-indigo-500 bg-indigo-50 px-1.5 rounded">Banco</span>}
                                        </div>
                                        <button onClick={() => {
                                            const list = [...finConfigData.methods];
                                            list.splice(i, 1);
                                            updateDoc(doc(db, 'config_finanzas', financeConfig[0].id), { methods: list });
                                        }} className="text-gray-300 hover:text-red-500"><Icon name="X" size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConfigView;