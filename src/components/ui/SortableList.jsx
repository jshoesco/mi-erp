import React, { useState, useRef } from 'react';
import Icon from './display/Icon';
import { TextLabel } from './display/Typography';

const SortableList = ({ items = [], onChange, onRemove, renderItem, emptyMessage = "No hay elementos" }) => {
    const [draggedIndex, setDraggedIndex] = useState(null);
    const scrollContainerRef = useRef(null);

    const handleReorder = (startIndex, endIndex) => {
        const result = Array.from(items);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        onChange(result);
    };

    const handleDragOverContainer = (e) => {
        e.preventDefault();
        const container = scrollContainerRef.current;
        if (!container || draggedIndex === null) return;

        const rect = container.getBoundingClientRect();
        const threshold = 60; // Área de sensibilidad de scroll
        const relativeY = e.clientY - rect.top;

        if (relativeY < threshold) {
            container.scrollTop -= 10;
        } else if (relativeY > rect.height - threshold) {
            container.scrollTop += 10;
        }
    };

    return (
        <div
            ref={scrollContainerRef}
            onDragOver={handleDragOverContainer}
            className="flex-1 overflow-y-auto overflow-x-hidden p-1 space-y-3 custom-scrollbar min-h-[200px]"
        >
            {items.map((item, index) => (
                <div
                    key={item.id || index}
                    draggable
                    onDragStart={() => setDraggedIndex(index)}
                    onDragEnd={() => setDraggedIndex(null)}
                    onDragOver={(e) => {
                        e.preventDefault();
                        if (draggedIndex !== null && draggedIndex !== index) {
                            handleReorder(draggedIndex, index);
                            setDraggedIndex(index);
                        }
                    }}
                    className={`
                        flex items-center gap-4 p-5 bg-white border-2 rounded-[2rem] transition-all duration-300
                        ${draggedIndex === index
                            ? 'opacity-20 border-brand-red scale-[0.95] rotate-1'
                            : 'border-slate-50 shadow-sm hover:border-slate-200 hover:shadow-md'}
                    `}
                >
                    {/* GRIP GENÉRICO */}
                    <div className="cursor-grab text-slate-300 active:cursor-grabbing hover:text-slate-900 transition-colors shrink-0 p-1">
                        <Icon name="GripVertical" size={20} />
                    </div>

                    <div className="flex-1 w-full overflow-hidden">
                        {renderItem(item, index)}
                    </div>

                    {/* ACCIÓN DE ELIMINAR GENÉRICA */}
                    {onRemove && (
                        <button
                            onClick={() => onRemove(index)}
                            className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-brand-red hover:bg-red-50 rounded-2xl transition-all shrink-0"
                        >
                            <Icon name="Trash2" size={18} />
                        </button>
                    )}
                </div>
            ))}

            {items.length === 0 && (
                <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/30">
                    <Icon name="Layers" size={32} className="text-slate-200 mb-3" />
                    <TextLabel className="opacity-40">{emptyMessage}</TextLabel>
                </div>
            )}
        </div>
    );
};

export default SortableList;