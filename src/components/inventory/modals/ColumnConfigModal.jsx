import React, { useState, useEffect, useRef } from 'react';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { IconTrash, IconPlus, IconGripVertical } from '@tabler/icons-react';
import { useShortcuts } from '../../../hooks/useShortcuts';

const ColumnConfigModal = ({ isOpen, onClose, columns, setColumns, availableKeys }) => {
    const [localCols, setLocalCols] = useState([]);
    const [draggedItemIndex, setDraggedItemIndex] = useState(null);
    const scrollContainerRef = useRef(null);

    useShortcuts({
        'Enter': (e) => {
            if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') {
                e.preventDefault();
                addColumn();
            }
        },
        'Escape': () => onClose(),
        's': (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                handleSave();
            }
        }
    }, isOpen);

    useEffect(() => {
        if (isOpen) setLocalCols([...columns]);
    }, [isOpen, columns]);

    const addColumn = () => {
        const newCol = { id: Date.now().toString(), label: '', key: availableKeys[0] || '', visible: true };
        setLocalCols([...localCols, newCol]);
    };

    const handleSave = () => {
        setColumns(localCols);
        onClose();
    };

    const handleReorder = (startIndex, endIndex) => {
        const result = Array.from(localCols);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        setLocalCols(result);
    };

    // SCROLL CONTROLADO: No más saltos al infinito
    const handleDragOverContainer = (e) => {
        e.preventDefault();
        const container = scrollContainerRef.current;
        if (!container || draggedItemIndex === null) return;

        const rect = container.getBoundingClientRect();
        const threshold = 50; // Área de activación pequeña para evitar disparos accidentales

        const relativeY = e.clientY - rect.top;
        const bottomThreshold = rect.height - threshold;

        if (relativeY < threshold) {
            // Sube suavemente: entre 2 y 10px dependiendo de la cercanía
            const speed = Math.max(2, (1 - relativeY / threshold) * 12);
            container.scrollTop -= speed;
        } else if (relativeY > bottomThreshold) {
            // Baja suavemente
            const diff = relativeY - bottomThreshold;
            const speed = Math.max(2, (diff / threshold) * 12);
            container.scrollTop += speed;
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="CONFIGURACIÓN DE COLUMNAS">
            <div className="flex flex-col h-[600px] w-full max-w-2xl bg-white overflow-hidden">
                <div
                    ref={scrollContainerRef}
                    onDragOver={handleDragOverContainer}
                    className="flex-1 overflow-y-auto overflow-x-hidden p-8 space-y-6 custom-scrollbar"
                >
                    {localCols.map((col, index) => (
                        <div
                            key={col.id}
                            draggable
                            onDragStart={() => setDraggedItemIndex(index)}
                            onDragEnd={() => setDraggedItemIndex(null)}
                            onDragOver={(e) => {
                                e.preventDefault();
                                if (draggedItemIndex !== index && draggedItemIndex !== null) {
                                    handleReorder(draggedItemIndex, index);
                                    setDraggedItemIndex(index);
                                }
                            }}
                            className={`
                                flex items-center gap-6 p-5 bg-white border rounded-2xl transition-all
                                ${draggedItemIndex === index ? 'opacity-40 border-brand-red scale-[0.98]' : 'border-gray-100 shadow-sm'}
                            `}
                        >
                            <div className="cursor-grab text-gray-300 active:cursor-grabbing">
                                <IconGripVertical size={24} />
                            </div>

                            <div className="flex-1 flex items-center gap-4">
                                <div className="flex-1">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">Etiqueta</span>
                                    <Input
                                        value={col.label}
                                        onChange={(e) => setLocalCols(localCols.map(c => c.id === col.id ? { ...c, label: e.target.value } : c))}
                                        placeholder="EJ. STOCK"
                                    />
                                </div>
                                <div className="w-1/3 min-w-[180px]">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">Dato Origen</span>
                                    <Select
                                        options={availableKeys}
                                        value={col.key}
                                        onChange={(e) => setLocalCols(localCols.map(c => c.id === col.id ? { ...c, key: e.target.value } : c))}
                                    />
                                </div>
                            </div>

                            <button onClick={() => setLocalCols(localCols.filter(c => c.id !== col.id))} className="text-gray-300 hover:text-brand-red p-2 transition-colors">
                                <IconTrash size={20} />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="p-8 bg-white border-t border-gray-50 space-y-4">
                    <button onClick={addColumn} className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center gap-2 text-gray-400 hover:border-brand-red hover:text-brand-red transition-all group font-bold text-[10px] uppercase tracking-widest">
                        <IconPlus size={20} className="group-hover:rotate-90 transition-transform" />
                        Añadir Nueva Columna
                    </button>
                    <Button onClick={handleSave} className="w-full h-14 rounded-2xl text-[11px] font-black tracking-[0.4em] uppercase">
                        Guardar Configuración
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ColumnConfigModal;