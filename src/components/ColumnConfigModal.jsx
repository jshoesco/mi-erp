import React, { useState, useMemo, useRef } from 'react';
import Icon from './ui/Icon';

// 1. LISTA MAESTRA LIMPIA (Sin Emojis)
const MASTER_FIELDS = [
    { key: 'imagen', label: 'Foto del Producto' },
    { key: 'nombre', label: 'Nombre del Producto' },
    { key: 'sku', label: 'SKU (Código Único)' },
    { key: 'marca', label: 'Marca / Fabricante' },
    { key: 'modelo', label: 'Modelo' },
    { key: 'precio', label: 'Precio de Venta' },
    { key: 'costo', label: 'Costo de Compra' },
    { key: 'ganancia', label: 'Ganancia Estimada' },
    { key: 'stock', label: 'Cantidad en Stock' },
    { key: 'proveedor', label: 'Proveedor' },
    { key: 'fecha', label: 'Fecha de Creación' },
    { key: 'status', label: 'Estado' }
];

// --- COMPONENTE INTERNO: CUSTOM SELECT (Para evitar el dropdown nativo feo) ---
const CustomSelect = ({ options, value, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    // Encontrar el label del valor seleccionado
    const selectedLabel = options.find(o => o.key === value)?.label;

    return (
        <div className="relative w-full">
            {/* Trigger (El botón que ves) */}
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full p-3 bg-white border rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                    isOpen ? 'border-brand-red ring-2 ring-brand-red/10' : 'border-gray-200 hover:border-gray-300'
                }`}
            >
                <span className={`text-sm font-medium ${selectedLabel ? 'text-gray-800' : 'text-gray-400'}`}>
                    {selectedLabel || placeholder}
                </span>
                <Icon name="ChevronDown" size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* Menú Flotante */}
            {isOpen && (
                <div className="absolute top-full mt-2 left-0 w-full bg-white border border-gray-100 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto animate-fade-in-down">
                    {options.length === 0 ? (
                        <div className="p-3 text-xs text-gray-400 text-center">No hay más campos disponibles</div>
                    ) : (
                        options.map((opt) => (
                            <div 
                                key={opt.key}
                                onClick={() => { onChange(opt.key); setIsOpen(false); }}
                                className="px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 hover:text-brand-dark cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                            >
                                {opt.label}
                            </div>
                        ))
                    )}
                </div>
            )}
            
            {/* Backdrop invisible para cerrar al hacer clic fuera */}
            {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
        </div>
    );
};

const ColumnConfigModal = ({ currentColumns, onSave, onClose }) => {
    const [newColHeader, setNewColHeader] = useState('');
    const [selectedField, setSelectedField] = useState('');
    
    // Referencia para el Drag & Drop
    const dragItem = useRef(null);
    const dragOverItem = useRef(null);

    // --- LÓGICA DE EXCLUSIÓN ---
    const availableFields = useMemo(() => {
        const usedKeys = currentColumns.map(col => col.field);
        return MASTER_FIELDS.filter(f => !usedKeys.includes(f.key));
    }, [currentColumns]);

    // --- LÓGICA DE DRAG & DROP ---
    const handleSort = () => {
        // Copiamos el array actual
        let _columns = [...currentColumns];
        
        // Removemos el item arrastrado
        const draggedItemContent = _columns.splice(dragItem.current, 1)[0];
        
        // Lo insertamos en la nueva posición
        _columns.splice(dragOverItem.current, 0, draggedItemContent);
        
        // Reseteamos referencias y guardamos
        dragItem.current = null;
        dragOverItem.current = null;
        onSave(_columns);
    };

    const handleAdd = () => {
        if (!newColHeader || !selectedField) return;
        const newCol = { id: Date.now(), header: newColHeader, field: selectedField };
        onSave([...currentColumns, newCol]);
        setNewColHeader('');
        setSelectedField('');
    };

    const handleRemove = (colId) => {
        onSave(currentColumns.filter(c => c.id !== colId));
    };

    return (
        <div className="fixed inset-0 bg-gray-900/40 z-50 flex items-center justify-center backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
                
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                    <div>
                        <h3 className="text-xl font-black text-gray-800">Configurar Tabla</h3>
                        <p className="text-xs text-gray-400 mt-1">Arrastra para ordenar o añade nuevas métricas.</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                        <Icon name="X" />
                    </button>
                </div>

                {/* Body: Lista Ordenable */}
                <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
                    
                    {/* LISTA DRAG & DROP */}
                    <div className="space-y-2 mb-8">
                        {currentColumns.map((col, index) => (
                            <div 
                                key={col.id}
                                draggable
                                onDragStart={() => (dragItem.current = index)}
                                onDragEnter={() => (dragOverItem.current = index)}
                                onDragEnd={handleSort}
                                onDragOver={(e) => e.preventDefault()}
                                className="flex items-center gap-4 p-3 bg-white border border-gray-200 rounded-xl shadow-sm cursor-grab active:cursor-grabbing hover:border-brand-red/30 hover:shadow-md transition-all group"
                            >
                                {/* Handle de arrastre */}
                                <div className="text-gray-300 group-hover:text-brand-dark">
                                    <Icon name="GripVertical" size={18} />
                                </div>
                                
                                <div className="flex-1">
                                    <p className="font-bold text-gray-700 text-sm">{col.header}</p>
                                    <p className="text-[10px] text-gray-400 font-medium">Dato: {col.field}</p>
                                </div>

                                <button 
                                    onClick={() => handleRemove(col.id)}
                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Icon name="Trash2" size={16} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* FORMULARIO DE AGREGAR (Clean Design) */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-4 text-brand-dark">
                            <Icon name="PlusCircle" size={16} className="text-brand-red" />
                            <span className="text-xs font-black uppercase tracking-wide">Nueva Columna</span>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Título de la cabecera</label>
                                <input 
                                    type="text" 
                                    placeholder="Ej: Precio Final"
                                    className="w-full p-3 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red outline-none transition-all"
                                    value={newColHeader}
                                    onChange={e => setNewColHeader(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Dato a mostrar</label>
                                <CustomSelect 
                                    options={availableFields}
                                    value={selectedField}
                                    onChange={setSelectedField}
                                    placeholder="Selecciona el dato origen..."
                                />
                            </div>

                            <button 
                                disabled={!newColHeader || !selectedField}
                                onClick={handleAdd}
                                className="w-full py-3 bg-brand-dark text-white rounded-xl font-bold text-sm hover:bg-brand-red shadow-lg shadow-brand-dark/20 hover:shadow-brand-red/30 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all"
                            >
                                Agregar Columna
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-white border-t border-gray-100 flex justify-end">
                    <button 
                        onClick={onClose} 
                        className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg font-bold text-sm hover:bg-gray-200 transition-colors"
                    >
                        Terminar Configuración
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ColumnConfigModal;