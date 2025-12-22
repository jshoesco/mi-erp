import React, { useState, useEffect } from 'react';
import useCollection from '../../../hooks/useCollection';
import { db, doc, addDoc, updateDoc, deleteDoc, collection } from '../../../lib/firebase';
import { useUI } from '../../../context/UIContext';
import { Input, NumberInput } from '../../ui/Input';
import Button from '../../ui/Button';
import Icon from '../../ui/Icon';
import Checkbox from '../../ui/Checkbox';
import Dropzone from '../../ui/Dropzone';
import { formatCurrency } from '../../../lib/utils';

const LogisticsConfig = () => {
    const { data: remitenteData } = useCollection('config_remitente');
    const { data: shipping } = useCollection('tarifas_envios');
    const { notify } = useUI();

    const [sender, setSender] = useState({ nombre: '', cedula: '', telefono: '', logo: '' });
    const [shipForm, setShipForm] = useState({ ciudad: '', tarifa: '', tiene_acopio: false });

    useEffect(() => { if (remitenteData?.[0]) setSender(remitenteData[0]); }, [remitenteData]);

    const handleSaveSender = async () => {
        try {
            remitenteData?.length
                ? await updateDoc(doc(db, 'config_remitente', remitenteData[0].id), sender)
                : await addDoc(collection(db, 'config_remitente'), sender);
            notify("Remitente actualizado");
        } catch (e) { notify(e.message, "error"); }
    };

    const saveShipping = async () => {
        if (!shipForm.ciudad) return notify("Falta ciudad", "error");
        const payload = { ...shipForm, tarifa: Number(shipForm.tarifa) };
        shipForm.id
            ? await updateDoc(doc(db, 'tarifas_envios', shipForm.id), payload)
            : await addDoc(collection(db, 'tarifas_envios'), payload);
        setShipForm({ ciudad: '', tarifa: '', tiene_acopio: false });
        notify("Tarifa guardada");
    };

    return (
        <div className="max-w-3xl mx-auto space-y-16 animate-fade-in">
            {/* BLOQUE 1: REMITENTE */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                    <div className="bg-brand-red w-2 h-6 rounded-full"></div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-800">Identidad del Remitente</h3>
                </div>
                <div className="bg-gray-50/50 p-8 rounded-3xl border border-gray-100 space-y-6 shadow-inner">
                    <div className="max-w-xs mx-auto">
                        <Dropzone value={sender.logo} onChange={url => setSender({ ...sender, logo: url })} label="Logo Corporativo" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="Razón Social" value={sender.nombre} onChange={e => setSender({ ...sender, nombre: e.target.value })} />
                        <Input label="NIT / Cédula" value={sender.cedula} onChange={e => setSender({ ...sender, cedula: e.target.value })} />
                        <Input label="Teléfono de Contacto" value={sender.telefono} onChange={e => setSender({ ...sender, telefono: e.target.value })} />
                        <div className="flex items-end">
                            <Button onClick={handleSaveSender} className="w-full bg-brand-dark h-12 text-white">GUARDAR IDENTIDAD</Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* BLOQUE 2: TARIFAS */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                    <div className="bg-brand-dark w-2 h-6 rounded-full"></div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-800">Cobertura y Tarifas</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 space-y-4 shadow-sm">
                    <div className="grid grid-cols-3 gap-4">
                        <Input placeholder="CIUDAD" value={shipForm.ciudad} onChange={e => setShipForm({ ...shipForm, ciudad: e.target.value.toUpperCase() })} />
                        <NumberInput placeholder="TARIFA" value={shipForm.tarifa} onChange={e => setShipForm({ ...shipForm, tarifa: e.target.value })} />
                        <Button onClick={saveShipping} className="bg-brand-red text-white h-11">AGREGAR DESTINO</Button>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-xl">
                        <Checkbox checked={shipForm.tiene_acopio} onChange={() => setShipForm({ ...shipForm, tiene_acopio: !shipForm.tiene_acopio })} />
                        <span className="text-[10px] font-black text-gray-500 uppercase">Marcar ciudad como punto de acopio</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
                    {shipping.sort((a, b) => a.ciudad.localeCompare(b.ciudad)).map(s => (
                        <div key={s.id} className="p-4 border border-gray-100 rounded-2xl flex justify-between items-center bg-white hover:border-brand-red transition-all group">
                            <span className="text-[10px] font-black uppercase text-gray-700">{s.ciudad} — <span className="text-brand-red">{formatCurrency(s.tarifa)}</span></span>
                            <button onClick={() => deleteDoc(doc(db, 'tarifas_envios', s.id))} className="text-gray-300 hover:text-red-500"><Icon name="Trash" size={16} /></button>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default LogisticsConfig;