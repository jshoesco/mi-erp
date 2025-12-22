import React, { useState } from 'react';
import Icon from '../../ui/Icon';
import { db, collection, addDoc, updateDoc, deleteDoc, doc } from '../../../lib/firebase';

const LinesManager = ({ lines = [] }) => {
    const [newLine, setNewLine] = useState('');

    const handleAdd = async () => {
        if (!newLine) return;
        await addDoc(collection(db, 'config_lineas'), { nombre: newLine.toUpperCase() });
        setNewLine('');
    };

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex gap-2 sticky top-0 bg-white pb-4 z-10 border-b border-gray-50">
                <input
                    className="flex-1 bg-gray-50 border-none rounded-xl px-4 text-xs font-bold h-12 text-gray-900 outline-none focus:ring-2 focus:ring-brand-dark transition-all"
                    placeholder="NUEVA LÍNEA..."
                    value={newLine}
                    onChange={e => setNewLine(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                />
                <button
                    onClick={handleAdd}
                    className="bg-brand-dark text-white w-12 h-12 rounded-xl font-bold text-xl shadow-lg shadow-gray-200 hover:scale-105 transition-transform"
                >
                    +
                </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
                {lines.map((l) => (
                    <div key={l.id} className="bg-white border border-gray-100 px-4 py-2 rounded-full flex items-center gap-2 shadow-sm hover:border-brand-dark transition-all group">
                        <input
                            className="text-[10px] font-black text-gray-900 uppercase border-none p-0 w-24 bg-transparent focus:ring-0"
                            value={l.nombre || ''}
                            onChange={e => updateDoc(doc(db, 'config_lineas', l.id), { nombre: e.target.value.toUpperCase() })}
                        />
                        <button
                            onClick={() => deleteDoc(doc(db, 'config_lineas', l.id))}
                            className="text-gray-300 hover:text-red-500 transition-colors"
                        >
                            <Icon name="X" size={12} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LinesManager;