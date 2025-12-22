import React, { useState, useEffect } from 'react';
import useCollection from '../../../hooks/useCollection';
import { db, doc, addDoc, updateDoc, collection } from '../../../lib/firebase';
import { useUI } from '../../../context/UIContext';
import { Input } from '../../ui/Input';
import Button from '../../ui/Button';
import Icon from '../../ui/Icon';

const SystemConfig = () => {
    const { data: generalConfig } = useCollection('config_general');
    const { notify } = useUI();

    const [cloudForm, setCloudForm] = useState({
        cloud_name: '',
        upload_preset: '',
        cloudinary_folder: '',
        cloudinary_transaction_folder: '',
        api_key: '',
        api_secret: ''
    });

    useEffect(() => {
        if (generalConfig?.[0]) setCloudForm(generalConfig[0]);
    }, [generalConfig]);

    const saveCloudinary = async () => {
        try {
            generalConfig?.length
                ? await updateDoc(doc(db, 'config_general', generalConfig[0].id), cloudForm)
                : await addDoc(collection(db, 'config_general'), cloudForm);
            notify("Credenciales de sistema actualizadas");
        } catch (e) { notify(e.message, "error"); }
    };

    return (
        <div className="max-w-2xl mx-auto py-8 animate-fade-in">
            {/* Encabezado de Sección */}
            <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-50 rounded-3xl text-indigo-600 mb-4 shadow-sm">
                    <Icon name="Settings" size={32} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-800">Infraestructura Cloud</h3>
                <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-widest">Configuración Maestra de Cloudinary</p>
            </div>

            <div className="bg-gray-50/50 p-10 rounded-[2.5rem] border border-gray-100 shadow-inner space-y-8">
                {/* Identificadores Principales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="Cloud Name"
                        value={cloudForm.cloud_name}
                        onChange={e => setCloudForm({ ...cloudForm, cloud_name: e.target.value })}
                        placeholder="Nombre de tu nube"
                    />
                    <Input
                        label="Upload Preset"
                        value={cloudForm.upload_preset}
                        onChange={e => setCloudForm({ ...cloudForm, upload_preset: e.target.value })}
                        placeholder="Preset de subida"
                    />
                </div>

                {/* Rutas de Almacenamiento */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="Carpeta Productos"
                        value={cloudForm.cloudinary_folder}
                        onChange={e => setCloudForm({ ...cloudForm, cloudinary_folder: e.target.value })}
                        placeholder="Ej: erp/products"
                    />
                    <Input
                        label="Carpeta Finanzas"
                        value={cloudForm.cloudinary_transaction_folder}
                        onChange={e => setCloudForm({ ...cloudForm, cloudinary_transaction_folder: e.target.value })}
                        placeholder="Ej: erp/payments"
                    />
                </div>

                {/* Seguridad (API Keys) */}
                <div className="pt-6 border-t border-gray-200/60 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="API Key"
                            value={cloudForm.api_key}
                            onChange={e => setCloudForm({ ...cloudForm, api_key: e.target.value })}
                        />
                        <Input
                            label="API Secret"
                            type="password"
                            value={cloudForm.api_secret}
                            onChange={e => setCloudForm({ ...cloudForm, api_secret: e.target.value })}
                        />
                    </div>
                </div>

                {/* Botón de Acción Principal */}
                <div className="pt-4">
                    <Button
                        onClick={saveCloudinary}
                        className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-100 uppercase font-black tracking-[0.2em] text-[11px] rounded-2xl transition-all active:scale-95"
                    >
                        Sincronizar Credenciales
                    </Button>
                </div>
            </div>

            <div className="mt-8 p-4 bg-orange-50 border border-orange-100 rounded-2xl flex gap-4 items-center">
                <Icon name="AlertTriangle" size={20} className="text-orange-500 shrink-0" />
                <p className="text-[9px] text-orange-700 font-black uppercase leading-relaxed">
                    Atención: Estos valores son críticos. Si las credenciales no son correctas, la subida de imágenes en todo el sistema dejará de funcionar inmediatamente.
                </p>
            </div>
        </div>
    );
};

export default SystemConfig;