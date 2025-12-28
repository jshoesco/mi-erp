import React, { useState } from 'react';
import { db, collection, addDoc, updateDoc, deleteDoc, doc } from '../../../lib/firebase';
import { useUI } from '../../../context/UIContext';
import { TOKENS } from '../../../theme/constants';

// --- IMPORTACIONES DEL SISTEMA GENÉRICO ---
import { Input } from '../../ui/forms/Controls';
import { Button } from '../../ui/display/Button';
import Icon from '../../ui/display/Icon';
import { TextLabel, H3 } from '../../ui/display/Typography';

const LinesManager = ({ lines = [], mapping }) => {
    const { notify } = useUI();
    const [newLine, setNewLine] = useState('');
    const [loading, setLoading] = useState(false);

    // Si el mapeo no llega, usamos el default por seguridad
    const collectionName = mapping?.coll_lines || 'config_lineas';

    const handleAdd = async () => {
        if (!newLine.trim()) return;
        setLoading(true);
        try {
            await addDoc(collection(db, collectionName), {
                nombre: newLine.toUpperCase().trim()
            });
            setNewLine('');
            notify("Línea de negocio agregada");
        } catch (e) {
            notify("Error al guardar", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (id, val) => {
        try {
            await updateDoc(doc(db, collectionName, id), {
                nombre: val.toUpperCase()
            });
        } catch (e) {
            notify("Error al actualizar", "error");
        }
    };

    return (
        <div className={`space-y-8 ${TOKENS.animation.fade}`}>

            {/* ENTRADA DE DATOS (ADN TOKENS) */}
            <div className={`bg-brand-light/30 ${TOKENS.spacing.card} ${TOKENS.radius.card} border border-brand-light shadow-inner`}>
                <H3 className="mb-4 text-brand-gray/50">Estructura de Negocio</H3>
                <div className="flex gap-4 items-end">
                    <div className="flex-1">
                        <Input
                            placeholder="EJ: CALZADO DEPORTIVO"
                            value={newLine}
                            onChange={e => setNewLine(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAdd()}
                        />
                    </div>
                    <Button
                        onClick={handleAdd}
                        loading={loading}
                        variant="brand"
                        className="h-12 w-12 p-0"
                        icon="Plus"
                    />
                </div>
            </div>

            {/* LISTADO DE CÁPSULAS DINÁMICAS */}
            <div className="space-y-4">
                <TextLabel className="px-4">Líneas en [{collectionName}] ({lines.length})</TextLabel>

                <div className="flex flex-wrap gap-3">
                    {lines.map((l) => (
                        <div
                            key={l.id}
                            className={`bg-brand-surface border border-brand-light pl-5 pr-3 py-2.5 ${TOKENS.radius.full} flex items-center gap-3 shadow-sm hover:shadow-md hover:border-brand-red/20 transition-all group`}
                        >
                            <input
                                className={`bg-transparent border-none p-0 w-32 focus:ring-0 ${TOKENS.text.tiny} text-brand-dark tracking-tighter`}
                                value={l.nombre || ''}
                                onChange={e => handleUpdate(l.id, e.target.value)}
                            />
                            <button
                                onClick={() => {
                                    if (window.confirm("¿Eliminar línea?")) {
                                        deleteDoc(doc(db, collectionName, l.id));
                                        notify("Línea eliminada");
                                    }
                                }}
                                className={`w-7 h-7 flex items-center justify-center ${TOKENS.radius.full} text-brand-gray/20 hover:bg-brand-red/10 hover:text-brand-red transition-all`}
                            >
                                <Icon name="X" size={14} />
                            </button>
                        </div>
                    ))}

                    {lines.length === 0 && (
                        <div className={`w-full py-10 text-center border-2 border-dashed border-brand-light ${TOKENS.radius.card}`}>
                            <TextLabel className="opacity-20">No hay líneas definidas</TextLabel>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LinesManager;