import React, { useState, useEffect } from 'react';
import useCollection from '../../../hooks/useCollection';
import { db, doc, updateDoc, addDoc, collection } from '../../../lib/firebase';
import { useUI } from '../../../context/UIContext';
import { TOKENS } from '../../../theme/constants';

// COMPONENTES DE DISEÑO
import { Input } from '../../ui/forms/Controls';
import { Button } from '../../ui/display/Button';
import Icon from '../../ui/display/Icon';
import { TextLabel, H1, H2 } from '../../ui/display/Typography';

// SUB-COMPONENTES DE SECCIÓN
import DatabaseMapping from './components/DatabaseMapping';

const SystemConfig = () => {
    const { data: generalConfig } = useCollection('config_general');
    const { notify } = useUI();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        cloud_name: '',
        upload_preset: '',
        cloudinary_folder: '',
        cloudinary_transaction_folder: '',
        api_key: '',
        api_secret: '',
        mapping: {
            coll_providers: '',
            coll_lines: '',
            coll_products: ''
        }
    });

    useEffect(() => {
        if (generalConfig?.[0]) {
            setFormData(generalConfig[0]);
        }
    }, [generalConfig]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const configId = generalConfig[0]?.id;
            configId
                ? await updateDoc(doc(db, 'config_general', configId), formData)
                : await addDoc(collection(db, 'config_general'), formData);

            notify("Infraestructura y Mapeo sincronizados");
            // Opcional: Recargar para que los hooks tomen los nuevos nombres de tablas
            // setTimeout(() => window.location.reload(), 1000);
        } catch (e) {
            notify(e.message, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`max-w-4xl mx-auto py-12 ${TOKENS.animation.fade} space-y-12`}>

            <div className="flex flex-col items-center text-center space-y-4">
                <div className={`w-20 h-20 bg-brand-dark ${TOKENS.radius.card} flex items-center justify-center text-white shadow-xl`}>
                    <Icon name="Settings" size={32} />
                </div>
                <div>
                    <H1>Núcleo del Sistema</H1>
                    <TextLabel>Control de infraestructura y enrutamiento de datos</TextLabel>
                </div>
            </div>

            <div className={`bg-brand-surface ${TOKENS.spacing.view} ${TOKENS.radius.container} border border-brand-light shadow-card space-y-12 relative overflow-hidden`}>

                <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                    <Icon name="ShieldCheck" size={180} />
                </div>

                {/* SECCIÓN 1: MAPEO DE BASE DE DATOS (NUEVA ESTRATEGIA) */}
                <DatabaseMapping
                    mapping={formData.mapping}
                    onChange={(newMap) => setFormData({ ...formData, mapping: newMap })}
                />

                {/* SECCIÓN 2: CLOUDINARY */}
                <section className="space-y-6 relative z-10 pt-6 border-t border-brand-light">
                    <div className="flex items-center gap-3 border-b border-brand-light pb-4">
                        <Icon name="Cloud" size={18} className="text-brand-red" />
                        <H2 className="text-sm">Servicios Cloud</H2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Input
                            label="Cloud Name"
                            value={formData.cloud_name}
                            onChange={e => setFormData({ ...formData, cloud_name: e.target.value })}
                        />
                        <Input
                            label="Upload Preset"
                            value={formData.upload_preset}
                            onChange={e => setFormData({ ...formData, upload_preset: e.target.value })}
                        />
                    </div>
                </section>

                {/* SECCIÓN 3: SEGURIDAD API */}
                <section className={`p-8 bg-brand-light/20 ${TOKENS.radius.card} border border-brand-light relative z-10`}>
                    <div className="flex items-center gap-3 mb-6">
                        <Icon name="Lock" size={18} className="text-brand-dark" />
                        <H2 className="text-sm uppercase tracking-widest">Protocolos de Acceso</H2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Input
                            label="API Key"
                            value={formData.api_key}
                            onChange={e => setFormData({ ...formData, api_key: e.target.value })}
                        />
                        <Input
                            label="API Secret"
                            type="password"
                            value={formData.api_secret}
                            onChange={e => setFormData({ ...formData, api_secret: e.target.value })}
                        />
                    </div>
                </section>

                <Button
                    onClick={handleSave}
                    loading={loading}
                    variant="brand"
                    className="w-full h-16 shadow-float"
                    icon="Save"
                >
                    ACTUALIZAR NÚCLEO
                </Button>
            </div>
        </div>
    );
};

export default SystemConfig;