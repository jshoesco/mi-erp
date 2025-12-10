import React, { useState, useEffect } from 'react';
import useCollection from '../hooks/useCollection';
import { useUI } from '../context/UIContext';
import { db, doc, addDoc, updateDoc, deleteDoc, collection } from '../lib/firebase';
import { formatCurrency } from '../lib/utils';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { Input, NumberInput } from '../components/Inputs';

const ConfigView = () => {
    const { data: generalConfig } = useCollection('config_general');
    const { data: providers } = useCollection('proveedores');
    const { data: shipping } = useCollection('tarifas_envios');
    const { data: financeConfig } = useCollection('config_finanzas');
    const { data: lines } = useCollection('config_lineas');
    const { data: anomalyConfigs } = useCollection('config_novedades');

    const [tab, setTab] = useState('providers');
    const { notify, confirmAction } = useUI();

    // Estados de Formularios
    const [provForm, setProvForm] = useState({ nombre: '', id_custom: '', contacto: '', lineas: [] });
    const [shipForm, setShipForm] = useState({ ciudad: '', tarifa: '', tiene_acopio: false });
    const [cloudForm, setCloudForm] = useState({ cloud_name: '', upload_preset: '', cloudinary_folder: '', cloudinary_transaction_folder: '', api_key: '', api_secret: '', drive_folder_id: '' });
    const [lineName, setLineName] = useState('');
    const [catIngreso, setCatIngreso] = useState('');
    const [catGasto, setCatGasto] = useState('');
    const [payMethod, setPayMethod] = useState({ name: '', isBank: false });
    const [finConfigData, setFinConfigData] = useState({ ingresos: [], gastos: [], methods: [] });
    const [anomForm, setAnomForm] = useState({ motivo: '', accion: 'Devolver a Proveedor' });

    useEffect(() => { if (generalConfig.length) setCloudForm(generalConfig[0]); }, [generalConfig]);
    useEffect(() => { if (financeConfig.length) setFinConfigData(financeConfig[0]); }, [financeConfig]);

    // --- FUNCIONES DE GUARDADO ---
    const saveLine = async () => { if (!lineName) return notify("Escribe un nombre", "error"); try { await addDoc(collection(db, 'config_lineas'), { nombre: lineName }); setLineName(''); notify("Línea agregada"); } catch (e) { notify(e.message, "error"); } };
    const deleteLine = (id) => confirmAction({ title: "Borrar Línea", message: "¿Seguro?", onConfirm: async () => { await deleteDoc(doc(db, 'config_lineas', id)); notify("Eliminada"); } });
    const toggleProvLine = (linea) => { const currentLines = Array.isArray(provForm.lineas) ? provForm.lineas : []; if (currentLines.includes(linea)) setProvForm({ ...provForm, lineas: currentLines.filter(l => l !== linea) }); else setProvForm({ ...provForm, lineas: [...currentLines, linea] }); };
    const saveProvider = async () => { if (!provForm.nombre || !provForm.id_custom) return notify("Incompleto", "error"); try { const payload = { nombre: provForm.nombre, id_custom: provForm.id_custom.toUpperCase(), contacto: provForm.contacto, lineas: provForm.lineas }; if (provForm.id) await updateDoc(doc(db, 'proveedores', provForm.id), payload); else await addDoc(collection(db, 'proveedores'), payload); setProvForm({ nombre: '', id_custom: '', contacto: '', lineas: [] }); notify("Guardado"); } catch (e) { notify(e.message, "error"); } };
    const deleteProvider = (id) => confirmAction({ title: "Eliminar", message: "¿Seguro?", onConfirm: async () => { await deleteDoc(doc(db, 'proveedores', id)); notify("Eliminado"); } });
    const saveShipping = async () => { if (!shipForm.ciudad || !shipForm.tarifa) return notify("Incompleto", "error"); try { const payload = { ciudad: shipForm.ciudad, tarifa: Number(shipForm.tarifa), tiene_acopio: shipForm.tiene_acopio }; if (shipForm.id) await updateDoc(doc(db, 'tarifas_envios', shipForm.id), payload); else await addDoc(collection(db, 'tarifas_envios'), payload); setShipForm({ ciudad: '', tarifa: '', tiene_acopio: false }); notify("Guardado"); } catch (e) { notify(e.message, "error"); } };
    const deleteShipping = (id) => confirmAction({ title: "Eliminar", message: "¿Seguro?", onConfirm: async () => { await deleteDoc(doc(db, 'tarifas_envios', id)); notify("Eliminado"); } });
    const saveGeneral = async () => { try { const payload = { cloud_name: cloudForm.cloud_name, upload_preset: cloudForm.upload_preset, cloudinary_folder: cloudForm.cloudinary_folder, cloudinary_transaction_folder: cloudForm.cloudinary_transaction_folder, api_key: cloudForm.api_key, api_secret: cloudForm.api_secret, drive_folder_id: cloudForm.drive_folder_id }; if (generalConfig.length) await updateDoc(doc(db, 'config_general', generalConfig[0].id), payload); else await addDoc(collection(db, 'config_general'), payload); notify("Guardado"); } catch (e) { notify(e.message, "error"); } };
    const updateFinConfig = async (newData) => { try { if (financeConfig.length) await updateDoc(doc(db, 'config_finanzas', financeConfig[0].id), newData); else await addDoc(collection(db, 'config_finanzas'), newData); } catch (e) { notify(e.message, "error"); } };
    const addCategory = (type, val) => { if (!val) return; const list = type === 'ingreso' ? [...(finConfigData.ingresos || [])] : [...(finConfigData.gastos || [])]; if (!list.includes(val)) { list.push(val); updateFinConfig(type === 'ingreso' ? { ingresos: list } : { gastos: list }); } if (type === 'ingreso') setCatIngreso(''); else setCatGasto(''); };
    const removeCategory = (type, val) => { const list = type === 'ingreso' ? (finConfigData.ingresos || []) : (finConfigData.gastos || []); updateFinConfig(type === 'ingreso' ? { ingresos: list.filter(x => x !== val) } : { gastos: list.filter(x => x !== val) }); };
    const addMethod = () => { if (!payMethod.name) return; const list = [...(finConfigData.methods || [])]; list.push(payMethod); updateFinConfig({ methods: list }); setPayMethod({ name: '', isBank: false }); };
    const removeMethod = (idx) => { const list = [...(finConfigData.methods || [])]; list.splice(idx, 1); updateFinConfig({ methods: list }); };
    
    // Novedades
    const saveAnomaly = async () => {
        if (!anomForm.motivo) return notify("Falta el motivo", "error");
        try {
            await addDoc(collection(db, 'config_novedades'), anomForm);
            setAnomForm({ ...anomForm, motivo: '' });
            notify("Motivo agregado");
        } catch (e) { notify("Error al guardar", "error"); }
    };
    const deleteAnomaly = (id) => confirmAction({ title: "Eliminar Motivo", message: "¿Seguro?", onConfirm: async () => { await deleteDoc(doc(db, 'config_novedades', id)); notify("Eliminado"); } });

    // Cierre de sesión auxiliar
    const handleLogout = async () => { 
        try {
            const { signOut, auth } = await import('../lib/firebase');
            await signOut(auth);
        } catch(e) { console.error(e); }
    };

    return (
        <div className="flex flex-col fade-in space-y-6 pb-24 md:pb-0 w-full">
            {/* NAVIGATION TABS */}
            <div className="sticky top-0 bg-brand-light z-30 flex gap-2 border-b border-gray-200 pb-1 overflow-x-auto w-full scrollbar-hide pt-2">
                {[
                    { id: 'providers', label: 'Proveedores', icon: 'Truck' },
                    { id: 'lines', label: 'Líneas', icon: 'Tag' },
                    { id: 'shipping', label: 'Envíos', icon: 'Map' },
                    { id: 'finance', label: 'Finanzas', icon: 'DollarSign' },
                    { id: 'anomalies', label: 'Novedades', icon: 'AlertTriangle' },
                    { id: 'general', label: 'Sistema', icon: 'Cpu' }
                ].map(t => (
                    <button 
                        key={t.id} 
                        onClick={() => setTab(t.id)} 
                        className={`
                            px-4 py-2 whitespace-nowrap font-semibold text-sm border-b-2 flex items-center gap-2 transition-all
                            ${tab === t.id 
                                ? 'border-brand-red text-brand-red bg-white rounded-t-lg shadow-sm' 
                                : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-t-lg'
                            }
                        `}
                    >
                        <Icon name={t.icon} size={16}/> {t.label}
                    </button>
                ))}
            </div>

            {/* SECCIÓN: LÍNEAS */}
            {tab === 'lines' && (
                <div className="max-w-lg mx-auto bg-white p-6 rounded-xl shadow-card border border-gray-100">
                    <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center gap-2"><Icon name="Tag" className="text-brand-red"/> Gestión de Líneas</h3>
                    <div className="flex gap-2 mb-6">
                        <Input placeholder="Nueva Línea (Ej: Calzado)" value={lineName} onChange={e => setLineName(e.target.value)} />
                        <Button onClick={saveLine} icon="Plus">Agregar</Button>
                    </div>
                    <ul className="space-y-2 divide-y divide-gray-100">
                        {lines.map(l => (
                            <li key={l.id} className="flex justify-between items-center py-2 group">
                                <span className="font-medium text-gray-700">{l.nombre}</span>
                                <button onClick={() => deleteLine(l.id)} className="text-gray-300 hover:text-brand-red transition-colors"><Icon name="Trash2" size={16} /></button>
                            </li>
                        ))}
                        {lines.length === 0 && <li className="text-gray-400 italic text-sm text-center py-4">No hay líneas registradas.</li>}
                    </ul>
                </div>
            )}

            {/* SECCIÓN: PROVEEDORES */}
            {tab === 'providers' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-card border border-gray-100 h-fit">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-800"><Icon name={provForm.id ? 'Edit' : 'PlusCircle'} className="text-brand-red" /> {provForm.id ? 'Editar' : 'Nuevo'} Proveedor</h3>
                        <div className="space-y-4">
                            <Input label="Nombre Empresa" value={provForm.nombre} onChange={e => setProvForm({ ...provForm, nombre: e.target.value })} />
                            <div className="grid grid-cols-2 gap-3">
                                <Input label="ID (4 letras)" value={provForm.id_custom} onChange={e => setProvForm({ ...provForm, id_custom: e.target.value })} maxLength={4} className="font-mono uppercase" />
                                <Input label="Teléfono" value={provForm.contacto} onChange={e => setProvForm({ ...provForm, contacto: e.target.value })} />
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Líneas Asociadas</label>
                                <div className="flex flex-wrap gap-2">
                                    {lines.map(l => (
                                        <button 
                                            key={l.id} 
                                            onClick={() => toggleProvLine(l.nombre)} 
                                            className={`px-2 py-1 rounded text-xs border transition-all ${provForm.lineas.includes(l.nombre) ? 'bg-brand-red text-white border-brand-red' : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'}`}
                                        >
                                            {l.nombre}
                                        </button>
                                    ))}
                                    {lines.length === 0 && <span className="text-xs text-brand-red">Crea líneas primero.</span>}
                                </div>
                            </div>
                        </div>
                        <Button onClick={saveProvider} className="w-full mt-6 bg-brand-dark hover:bg-black">Guardar Proveedor</Button>
                    </div>
                    
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden flex flex-col">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 font-bold text-gray-500 text-xs uppercase">
                                    <tr>
                                        <th className="p-4">ID</th>
                                        <th className="p-4">Nombre</th>
                                        <th className="p-4">Líneas</th>
                                        <th className="p-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {providers.map(p => (
                                        <tr key={p.id} className="hover:bg-gray-50 group transition-colors">
                                            <td className="p-4 font-mono font-bold text-brand-red">{p.id_custom}</td>
                                            <td className="p-4 font-medium text-gray-800">{p.nombre}</td>
                                            <td className="p-4 text-xs text-gray-500 max-w-xs truncate">{Array.isArray(p.lineas) ? p.lineas.join(', ') : p.lineas}</td>
                                            <td className="p-4 text-right flex gap-2 justify-end">
                                                <button onClick={() => setProvForm(p)} className="text-gray-400 hover:text-brand-dark"><Icon name="Edit" size={18} /></button>
                                                <button onClick={() => deleteProvider(p.id)} className="text-gray-400 hover:text-brand-red"><Icon name="Trash2" size={18} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* SECCIÓN: ENVÍOS */}
            {tab === 'shipping' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-card border border-gray-100 h-fit">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-800"><Icon name="Map" className="text-brand-red" /> {shipForm.id ? 'Editar' : 'Nueva'} Cobertura</h3>
                        <div className="space-y-4">
                            <Input label="Ciudad Destino" value={shipForm.ciudad} onChange={e => setShipForm({ ...shipForm, ciudad: e.target.value })} />
                            <NumberInput label="Tarifa Estándar" value={shipForm.tarifa} onChange={e => setShipForm({ ...shipForm, tarifa: e.target.value })} />
                            <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                                <input type="checkbox" id="acopioCheck" checked={shipForm.tiene_acopio} onChange={e => setShipForm({ ...shipForm, tiene_acopio: e.target.checked })} className="w-5 h-5 accent-brand-red cursor-pointer" />
                                <label htmlFor="acopioCheck" className="text-sm font-medium text-gray-700 cursor-pointer select-none">¿Tenemos Acopio aquí?</label>
                            </div>
                        </div>
                        <Button onClick={saveShipping} className="w-full mt-6 bg-brand-dark hover:bg-black">Guardar Tarifa</Button>
                    </div>
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 font-bold text-gray-500 text-xs uppercase">
                                    <tr><th className="p-4">Ciudad</th><th className="p-4 text-right">Tarifa</th><th className="p-4 text-center">Acopio</th><th className="p-4"></th></tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {shipping.map(s => (
                                        <tr key={s.id} className="hover:bg-gray-50 group">
                                            <td className="p-4 font-medium text-gray-800">{s.ciudad}</td>
                                            <td className="p-4 text-right font-mono text-gray-600">{formatCurrency(s.tarifa)}</td>
                                            <td className="p-4 text-center">
                                                {s.tiene_acopio ? <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-[10px] font-bold uppercase">Disponible</span> : <span className="text-gray-300">-</span>}
                                            </td>
                                            <td className="p-4 text-right flex gap-2 justify-end">
                                                <button onClick={() => setShipForm(s)} className="text-gray-400 hover:text-brand-dark"><Icon name="Edit" size={18} /></button>
                                                <button onClick={() => deleteShipping(s.id)} className="text-gray-400 hover:text-brand-red"><Icon name="Trash2" size={18} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* SECCIÓN: FINANZAS */}
            {tab === 'finance' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-card border border-gray-100 space-y-6">
                        <div>
                            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Icon name="ArrowUpCircle" className="text-emerald-500" /> Categorías de Ingreso</h4>
                            <div className="flex gap-2 mb-3">
                                <Input placeholder="Ej: Venta Directa..." value={catIngreso} onChange={e => setCatIngreso(e.target.value)} />
                                <Button onClick={() => addCategory('ingreso', catIngreso)} icon="Plus" className="bg-emerald-600 hover:bg-emerald-700" />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {(finConfigData.ingresos || []).map(c => (
                                    <span key={c} className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
                                        {c} <button onClick={() => removeCategory('ingreso', c)} className="hover:text-emerald-900"><Icon name="X" size={12} /></button>
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="border-t border-gray-100 pt-6">
                            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Icon name="ArrowDownCircle" className="text-brand-red" /> Categorías de Gasto</h4>
                            <div className="flex gap-2 mb-3">
                                <Input placeholder="Ej: Nómina, Arriendo..." value={catGasto} onChange={e => setCatGasto(e.target.value)} />
                                <Button onClick={() => addCategory('gasto', catGasto)} icon="Plus" className="bg-brand-red hover:bg-red-700" />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {(finConfigData.gastos || []).map(c => (
                                    <span key={c} className="bg-red-50 text-brand-red border border-red-100 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
                                        {c} <button onClick={() => removeCategory('gasto', c)} className="hover:text-red-900"><Icon name="X" size={12} /></button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-card border border-gray-100 h-fit">
                        <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Icon name="CreditCard" className="text-indigo-600"/> Métodos de Pago</h4>
                        <div className="space-y-3 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <Input placeholder="Nombre (Ej: Bancolombia)" value={payMethod.name} onChange={e => setPayMethod({ ...payMethod, name: e.target.value })} />
                            <div className="flex items-center gap-3">
                                <input type="checkbox" id="isBank" checked={payMethod.isBank} onChange={e => setPayMethod({ ...payMethod, isBank: e.target.checked })} className="w-5 h-5 accent-indigo-600 cursor-pointer" />
                                <label htmlFor="isBank" className="text-sm font-medium text-gray-700 cursor-pointer select-none">Es Cuenta Bancaria (Requiere Comprobante)</label>
                            </div>
                            <Button onClick={addMethod} className="w-full bg-brand-dark">Agregar Método</Button>
                        </div>
                        <ul className="space-y-1">
                            {(finConfigData.methods || []).map((m, i) => (
                                <li key={i} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg group transition-colors">
                                    <span className="flex items-center gap-2 font-medium text-gray-700">
                                        {m.isBank ? <Icon name="Landmark" size={16} className="text-indigo-500" /> : <Icon name="Wallet" size={16} className="text-gray-400" />}
                                        {m.name}
                                    </span>
                                    <button onClick={() => removeMethod(i)} className="text-gray-300 hover:text-brand-red"><Icon name="X" size={16} /></button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* SECCIÓN: NOVEDADES */}
            {tab === 'anomalies' && (
                <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-card border border-gray-100 w-full">
                    <h3 className="font-bold mb-6 text-gray-800 flex items-center gap-2"><Icon name="AlertTriangle" className="text-amber-500" /> Configuración de Devoluciones</h3>
                    
                    <div className="flex flex-col md:flex-row gap-4 mb-8 bg-gray-50 p-5 rounded-xl border border-gray-200 items-end">
                        <div className="flex-1 w-full">
                            <Input label="Motivo de Devolución" placeholder="Ej: No le gustó..." value={anomForm.motivo} onChange={e => setAnomForm({ ...anomForm, motivo: e.target.value })} />
                        </div>
                        <div className="w-full md:w-56">
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Acción Automática</label>
                            <select className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-500 bg-white" value={anomForm.accion || 'Devolver a Proveedor'} onChange={e => setAnomForm({ ...anomForm, accion: e.target.value })}>
                                <option value="Devolver a Proveedor">Devolver a Proveedor</option>
                                <option value="Stock (Revender)">Regresa a Stock</option>
                                <option value="Desechar">Desechar / Pérdida</option>
                            </select>
                        </div>
                        <Button onClick={saveAnomaly} icon="Plus" className="h-[42px] bg-brand-dark">Agregar</Button>
                    </div>

                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="bg-gray-100 px-5 py-3 border-b border-gray-200 font-bold text-gray-500 text-xs uppercase tracking-wider flex justify-between">
                            <span>Motivo</span>
                            <span>Acción Default</span>
                        </div>
                        <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                            {anomalyConfigs.map(c => (
                                <div key={c.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors group">
                                    <div className="font-medium text-gray-800">{c.motivo}</div>
                                    <div className="flex items-center gap-4">
                                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${c.accion?.includes('Stock') ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-red-50 text-brand-red border-red-100'}`}>
                                            {c.accion}
                                        </span>
                                        <button onClick={() => deleteAnomaly(c.id)} className="text-gray-300 hover:text-brand-red transition-colors"><Icon name="Trash2" size={16} /></button>
                                    </div>
                                </div>
                            ))}
                            {anomalyConfigs.length === 0 && <div className="p-8 text-center text-sm text-gray-400 italic">No hay motivos configurados aún.</div>}
                        </div>
                    </div>
                </div>
            )}

            {/* SECCIÓN: GENERAL */}
            {tab === 'general' && (
                <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-card border border-gray-100">
                    <h3 className="font-bold mb-6 flex items-center gap-2 text-gray-800 text-lg"><Icon name="Cloud" className="text-indigo-500"/> Conexión a la Nube</h3>
                    <div className="space-y-5">
                        <Input label="Cloudinary Cloud Name" value={cloudForm.cloud_name} onChange={e => setCloudForm({ ...cloudForm, cloud_name: e.target.value })} />
                        <Input label="Upload Preset" value={cloudForm.upload_preset} onChange={e => setCloudForm({ ...cloudForm, upload_preset: e.target.value })} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Folder Inventario" value={cloudForm.cloudinary_folder} onChange={e => setCloudForm({ ...cloudForm, cloudinary_folder: e.target.value })} />
                            <Input label="Folder Pagos" value={cloudForm.cloudinary_transaction_folder} onChange={e => setCloudForm({ ...cloudForm, cloudinary_transaction_folder: e.target.value })} />
                        </div>
                        <div className="pt-4 border-t border-gray-100">
                            <p className="text-xs text-gray-400 mb-3 uppercase font-bold tracking-widest">Zona de Peligro (API Keys)</p>
                            <div className="space-y-4">
                                <Input label="API Key (Para borrar fotos)" value={cloudForm.api_key} onChange={e => setCloudForm({ ...cloudForm, api_key: e.target.value })} type="password" />
                                <Input label="API Secret" value={cloudForm.api_secret} onChange={e => setCloudForm({ ...cloudForm, api_secret: e.target.value })} type="password" />
                            </div>
                        </div>
                    </div>
                    <Button onClick={saveGeneral} className="w-full mt-8 bg-brand-dark h-12">Guardar Configuración</Button>
                    
                    <div className="border-t border-gray-100 pt-6 mt-6">
                        <Button onClick={handleLogout} variant="danger" className="w-full h-12" icon="LogOut">Cerrar Sesión del Sistema</Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConfigView;