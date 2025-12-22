import React, { useState } from 'react';
import Icon from '../../ui/Icon';
import { db, collection, addDoc, updateDoc, deleteDoc, doc } from '../../../lib/firebase';

const ProvidersManager = ({ providers = [], notify }) => {
    const [newProv, setNewProv] = useState({ nombre: '', id_custom: '' });

    const handleAdd = async () => {
        if (!newProv.nombre || !newProv.id_custom) return notify("Faltan datos", "error");
        try {
            await addDoc(collection(db, 'proveedores'), {
                nombre: newProv.nombre.toUpperCase(),
                id_custom: newProv.id_custom.toUpperCase().slice(0, 3)
            });
            setNewProv({ nombre: '', id_custom: '' });
            notify("Proveedor agregado");
        } catch (e) { notify("Error al guardar", "error"); }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 space-y-3 sticky top-0 z-10 shadow-sm">
                <input
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-brand-dark transition-all"
                    placeholder="NOMBRE PROVEEDOR"
                    value={newProv.nombre}
                    onChange={e => setNewProv({ ...newProv, nombre: e.target.value })}
                />
                <div className="flex gap-2">
                    <input
                        className="flex-1 bg-white border border-gray-200 rounded-xl p-3 text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-brand-dark transition-all"
                        placeholder="SKU (3 LETRAS)"
                        maxLength={3}
                        value={newProv.id_custom}
                        onChange={e => setNewProv({ ...newProv, id_custom: e.target.value })}
                    />
                    <button
                        onClick={handleAdd}
                        className="bg-brand-dark text-white px-8 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-gray-200 hover:scale-105 transition-transform"
                    >
                        Vincular
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-2">
                {providers.map((p) => (
                    <div key={p.id} className="p-4 bg-white border border-gray-100 rounded-2xl flex justify-between items-center shadow-sm hover:shadow-md transition-all">
                        <div className="flex-1">
                            <input
                                className="font-black uppercase text-[11px] text-gray-900 focus:ring-0 border-none p-0 w-full bg-transparent"
                                value={p.nombre || ''}
                                onChange={e => updateDoc(doc(db, 'proveedores', p.id), { nombre: e.target.value.toUpperCase() })}
                            />
                            <div className="text-[8px] font-bold text-gray-400 uppercase mt-1 tracking-widest">SKU: {p.id_custom}</div>
                        </div>
                        <button
                            onClick={() => deleteDoc(doc(db, 'proveedores', p.id))}
                            className="text-gray-300 hover:text-red-500 ml-4 transition-colors"
                        >
                            <Icon name="Trash" size={18} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProvidersManager;