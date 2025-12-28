import React, { useState, useEffect } from 'react';
import useCollection from '../../../hooks/useCollection';
import { db, doc, addDoc, updateDoc, deleteDoc, collection } from '../../../lib/firebase';
import { useUI } from '../../../context/UIContext';
import { TOKENS } from '../../../theme/constants';

// IMPORTACIÓN DEL SISTEMA DE DISEÑO GENÉRICO
import { FormSection } from '../../ui/layout/Containers';
import { H2, TextLabel, PriceText } from '../../ui/display/Typography';
import { Input, NumberInput } from '../../ui/forms/Controls';
import { Button } from '../../ui/display/Button';
import Icon from '../../ui/display/Icon';
import Checkbox from '../../ui/Checkbox';
import Dropzone from '../../ui/Dropzone';

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
            notify("Identidad de marca actualizada");
        } catch (e) { notify(e.message, "error"); }
    };

    const saveShipping = async () => {
        if (!shipForm.ciudad) return notify("Indica la ciudad", "error");
        const payload = {
            ...shipForm,
            tarifa: Number(shipForm.tarifa),
            ciudad: shipForm.ciudad.toUpperCase().trim()
        };
        try {
            shipForm.id
                ? await updateDoc(doc(db, 'tarifas_envios', shipForm.id), payload)
                : await addDoc(collection(db, 'tarifas_envios'), payload);
            setShipForm({ ciudad: '', tarifa: '', tiene_acopio: false });
            notify("Cobertura sincronizada");
        } catch (e) { notify("Error al guardar tarifa", "error"); }
    };

    return (
        <div className={`space-y-16 ${TOKENS.animation.fade}`}>

            {/* SECCIÓN 1: IDENTIDAD */}
            <div className="space-y-8">
                <H2>Identidad del Remitente</H2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
                    <div className="lg:col-span-1">
                        <Dropzone
                            label="Logo / Firma"
                            value={sender.logo}
                            onChange={url => setSender({ ...sender, logo: url })}
                        />
                    </div>
                    <div className="lg:col-span-2">
                        <div className={`bg-brand-light/30 ${TOKENS.spacing.card} ${TOKENS.radius.card} border border-brand-light shadow-inner`}>
                            <FormSection columns={2}>
                                <Input label="Razón Social" value={sender.nombre} onChange={e => setSender({ ...sender, nombre: e.target.value })} />
                                <Input label="NIT / Cédula" value={sender.cedula} onChange={e => setSender({ ...sender, cedula: e.target.value })} />
                                <Input label="Teléfono" value={sender.telefono} onChange={e => setSender({ ...sender, telefono: e.target.value })} />
                                <div className="flex items-end">
                                    <Button onClick={handleSaveSender} variant="brand" className="w-full h-12" icon="Save">
                                        ACTUALIZAR IDENTIDAD
                                    </Button>
                                </div>
                            </FormSection>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 2: TARIFAS */}
            <div className={`space-y-8 pt-10 border-t border-brand-light`}>
                <H2>Cobertura y Tarifas de Envío ({shipping.length})</H2>

                <div className={`bg-brand-light/30 ${TOKENS.spacing.card} ${TOKENS.radius.card} border border-brand-light shadow-inner`}>
                    <FormSection columns={3}>
                        <Input label="Ciudad" placeholder="EJ: MEDELLÍN" value={shipForm.ciudad} onChange={e => setShipForm({ ...shipForm, ciudad: e.target.value })} />
                        <NumberInput label="Tarifa Base" value={shipForm.tarifa} onChange={e => setShipForm({ ...shipForm, tarifa: e.target.value })} />
                        <div className="flex items-end">
                            <Button onClick={saveShipping} className="w-full h-12" icon="Plus">AÑADIR COBERTURA</Button>
                        </div>
                        <div className={`md:col-span-3 flex items-center gap-4 p-4 bg-brand-surface ${TOKENS.radius.inner} border border-brand-light mt-2`}>
                            <Checkbox checked={shipForm.tiene_acopio} onChange={() => setShipForm({ ...shipForm, tiene_acopio: !shipForm.tiene_acopio })} />
                            <TextLabel>MARCAR COMO PUNTO DE ACOPIO LOCAL (TRANSBORDO)</TextLabel>
                        </div>
                    </FormSection>
                </div>

                {/* LISTA DE DESTINOS (CÁPSULAS) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {shipping.sort((a, b) => a.ciudad.localeCompare(b.ciudad)).map(s => (
                        <div key={s.id} className={`p-6 bg-brand-surface border border-brand-light ${TOKENS.radius.card} flex justify-between items-center group hover:border-brand-red/30 transition-all shadow-sm`}>
                            <div className="flex flex-col">
                                <span className={TOKENS.text.h3}>{s.ciudad}</span>
                                <div className="mt-1 flex items-center gap-2">
                                    <PriceText value={s.tarifa} className="text-brand-red text-sm" />
                                    {s.tiene_acopio && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Acopio" />}
                                </div>
                            </div>
                            <button
                                onClick={() => deleteDoc(doc(db, 'tarifas_envios', s.id))}
                                className={`p-3 text-brand-gray/20 hover:text-brand-red hover:bg-red-50 ${TOKENS.radius.inner} transition-all`}
                            >
                                <Icon name="Trash" size={16} />
                            </button>
                        </div>
                    ))}
                </div>

                {shipping.length === 0 && (
                    <div className={`p-20 text-center border-2 border-dashed border-brand-light ${TOKENS.radius.card} opacity-30`}>
                        <Icon name="Truck" size={40} className="mx-auto mb-4 text-brand-gray" />
                        <TextLabel>NO HAY TARIFAS CONFIGURADAS</TextLabel>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LogisticsConfig;