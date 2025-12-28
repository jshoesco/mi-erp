import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { IconChevronDown, IconX } from '@tabler/icons-react';

const Label = ({ children }) => (
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 mb-2 block">
        {children}
    </label>
);

export const Select = ({
    label,
    options = [],
    value,
    onChange,
    placeholder = "Elegir opción...",
    className = "",
    isMulti = false,
    allowCustom = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, bottom: 0 });
    const containerRef = useRef(null);

    // Lógica para extraer etiquetas y valores de las opciones
    const getLabel = (opt) => (typeof opt === 'object' ? opt.label : opt);
    const getValue = (opt) => (typeof opt === 'object' ? opt.value : opt);

    // Encontrar la opción seleccionada para mostrar su texto en modo simple
    const selectedOption = !isMulti ? options.find(opt => getValue(opt) === value) : null;
    const displayValue = selectedOption ? getLabel(selectedOption) : (typeof value === 'string' ? value : "");

    const filteredOptions = options.filter(opt =>
        getLabel(opt)?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Cerrar al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                const portal = document.getElementById('select-portal-root');
                if (portal && portal.contains(e.target)) return;

                // Si hay algo escrito y permitimos personalizados, guardamos antes de limpiar
                if (allowCustom && searchTerm.trim() !== "" && !isMulti) {
                    onChange({ target: { value: searchTerm.toUpperCase().trim() } });
                }

                setIsOpen(false);
                setSearchTerm("");
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, searchTerm, allowCustom]);

    // Actualizar posición del portal
    useEffect(() => {
        const update = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setCoords({ top: rect.top, bottom: rect.bottom, left: rect.left, width: rect.width });
            }
        };
        if (isOpen) {
            update();
            window.addEventListener('resize', update);
            window.addEventListener('scroll', update, true);
        }
        return () => {
            window.removeEventListener('resize', update);
            window.removeEventListener('scroll', update, true);
        };
    }, [isOpen]);

    const handleSelect = (optValue, e) => {
        e.preventDefault();
        e.stopPropagation();

        if (isMulti) {
            const currentValues = Array.isArray(value) ? value : [];
            const newValue = currentValues.includes(optValue)
                ? currentValues.filter(v => v !== optValue)
                : [...currentValues, optValue];
            onChange({ target: { value: newValue } });
            setSearchTerm("");
        } else {
            onChange({ target: { value: optValue } });
            setIsOpen(false);
            setSearchTerm("");
        }
    };

    return (
        <div ref={containerRef} className={`relative w-full ${className}`}>
            {label && <Label>{label}</Label>}
            <div
                className={`min-h-[3rem] px-4 py-2 flex items-center justify-between bg-gray-50/50 border rounded-2xl transition-all cursor-pointer ${isOpen ? 'border-brand-red/20 bg-white ring-4 ring-brand-red/5' : 'border-gray-100 hover:border-gray-200'}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex flex-wrap gap-1 flex-1">
                    {isMulti && Array.isArray(value) && value.map(val => (
                        <span key={val} className="bg-brand-dark text-white text-[9px] px-2 py-1 rounded-lg flex items-center gap-1 animate-fade-in">
                            {val}
                        </span>
                    ))}

                    <input
                        type="text"
                        className="flex-1 bg-transparent border-none p-0 text-[12px] font-bold text-gray-800 placeholder:text-gray-300 outline-none cursor-pointer"
                        placeholder={!isOpen && !isMulti && displayValue ? displayValue : (isMulti && value?.length > 0 ? "" : placeholder)}
                        value={isOpen ? searchTerm : ""}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
                    />
                </div>

                {/* ESTE ES EL BLOQUE NUEVO DE ICONOS (REEMPLAZA AL ICONCHEVRONDOWN SOLO) */}
                <div className="flex items-center gap-2">
                    {value && (
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onChange({ target: { value: isMulti ? [] : '' } });
                                setSearchTerm("");
                            }}
                            className="text-gray-300 hover:text-brand-red transition-colors p-1"
                        >
                            <IconX size={14} />
                        </button>
                    )}
                    <IconChevronDown size={16} className={`text-gray-300 transition-transform ${isOpen && 'rotate-180 text-brand-red'}`} />
                </div>
            </div>

            {isOpen && createPortal(
                <div
                    id="select-portal-root"
                    className="fixed bg-white rounded-2xl shadow-2xl border border-gray-100 z-[9999] overflow-hidden animate-fade-in"
                    style={{ width: coords.width, left: coords.left, top: coords.bottom + 8 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                        {/* 1. PRIMERO: El botón de "Usar Nuevo" (Fuera del loop de opciones) */}
                        {allowCustom && searchTerm && !options.some(opt => getLabel(opt).toUpperCase() === searchTerm.toUpperCase()) && (
                            <div
                                onClick={(e) => handleSelect(searchTerm.toUpperCase().trim(), e)}
                                className="px-5 py-3 text-[11px] font-black text-brand-red bg-brand-red/5 cursor-pointer border-b border-gray-50"
                            >
                                USAR NUEVO: "{searchTerm.toUpperCase()}"
                            </div>
                        )}

                        {/* 2. SEGUNDO: El listado de opciones existentes */}
                        {filteredOptions.length > 0 ? filteredOptions.map((opt) => {
                            const val = getValue(opt);
                            const isSelected = isMulti ? value?.includes(val) : value === val;
                            return (
                                <div
                                    key={val}
                                    onClick={(e) => handleSelect(val, e)}
                                    className={`px-5 py-3 text-[11px] font-bold cursor-pointer flex justify-between items-center transition-colors ${isSelected ? 'bg-brand-red/5 text-brand-red' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    {getLabel(opt)}
                                    {isSelected && <IconX size={12} />}
                                </div>
                            );
                        }) : !allowCustom && ( // Solo mostramos "Sin resultados" si no estamos permitiendo personalizados
                            <div className="px-5 py-4 text-[10px] text-gray-400 text-center uppercase tracking-widest">
                                Sin resultados
                            </div>
                        )}
                    </div>

                    {isMulti && (
                        <div className="p-2 border-t border-gray-50 bg-gray-50">
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(false); }}
                                className="w-full py-2 bg-brand-dark text-white text-[10px] font-black rounded-xl uppercase tracking-tighter hover:bg-black transition-colors"
                            >
                                Confirmar Selección
                            </button>
                        </div>
                    )}
                </div>,
                document.body
            )}
        </div>
    );
};

export default Select;