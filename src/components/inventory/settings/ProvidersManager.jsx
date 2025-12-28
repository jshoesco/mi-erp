import React, { useState } from 'react';
import { db, collection, addDoc, updateDoc, deleteDoc, doc } from '../../../lib/firebase';
import { TOKENS } from '../../../theme/constants';
import { Input } from '../../ui/forms/Controls';
import { Select } from '../../ui/forms/Select'; // <--- USAMOS EL NUEVO SELECT
import { Button } from '../../ui/display/Button';
import Icon from '../../ui/display/Icon';
import { TextLabel, H3 } from '../../ui/display/Typography';

const ProvidersManager = ({ providers = [], lines = [], notify, mapping }) => {
    const [newProv, setNewProv] = useState({ nombre: '', id_custom: '', lineas: [] });
    const [loading, setLoading] = useState(false);
    const collectionName = mapping?.coll_providers || 'proveedores';

    const handleAdd = async () => {
        if (!newProv.nombre || !newProv.id_custom || newProv.lineas.length === 0)
            return notify("Nombre, Prefijo y al menos una Línea son obligatorios", "error");

        setLoading(true);
        try {
            await addDoc(collection(db, collectionName), {
                nombre: newProv.nombre.toUpperCase().trim(),
                id_custom: newProv.id_custom.toUpperCase().trim().slice(0, 3),
                lineas: newProv.lineas // Se guarda como Array
            });
            setNewProv({ nombre: '', id_custom: '', lineas: [] });
            notify("Proveedor vinculado con éxito");
        } catch (e) { notify("Error al guardar", "error"); }
        finally { setLoading(false); }
    };

    return (
        <div className={`space-y-8 ${TOKENS.animation.fade}`}>
            <div className={`bg-brand-light/30 ${TOKENS.spacing.card} ${TOKENS.radius.card} border border-brand-light space-y-6 shadow-inner`}>
                <H3 className="text-brand-gray/50">Vincular Nuevo Aliado</H3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Razón Social" value={newProv.nombre} onChange={e => setNewProv({ ...newProv, nombre: e.target.value })} />
                    <Input label="Prefijo SKU" maxLength={3} value={newProv.id_custom} onChange={e => setNewProv({ ...newProv, id_custom: e.target.value })} />
                </div>

                <Select
                    label="Líneas Autorizadas"
                    isMulti={true} // <--- ACTIVAMOS EL MODO MÚLTIPLE
                    options={lines.map(l => ({ label: l.nombre, value: l.nombre }))}
                    value={newProv.lineas}
                    onChange={(e) => setNewProv({ ...newProv, lineas: e.target.value })}
                    placeholder="Selecciona una o varias líneas..."
                />

                <Button onClick={handleAdd} loading={loading} variant="brand" className="w-full h-12" icon="Plus">Vincular</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {providers.map((p) => (
                    <div key={p.id} className={`bg-brand-surface p-6 ${TOKENS.radius.card} border border-brand-light flex justify-between items-center shadow-sm`}>
                        <div className="space-y-1">
                            <span className={TOKENS.text.h3}>{p.nombre}</span>
                            <div className="flex flex-wrap gap-1">
                                {p.lineas?.map(l => (
                                    <span key={l} className="text-[8px] px-1.5 py-0.5 bg-brand-light text-brand-dark rounded font-bold">{l}</span>
                                ))}
                            </div>
                        </div>
                        <button onClick={() => deleteDoc(doc(db, collectionName, p.id))} className="text-brand-gray/20 hover:text-brand-red"><Icon name="Trash2" size={18} /></button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProvidersManager;