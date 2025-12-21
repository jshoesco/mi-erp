import { useState, useEffect, useRef, useMemo } from 'react';
import Icon from './Icon';

const SmartSelect = ({ 
    label, 
    value, 
    onChange, 
    options = [], 
    placeholder = "Seleccionar...", 
    displayProp = 'nombre', 
    valueProp = 'id', 
    onCreate = null,
    renderItem = null, 
    searchFields = null 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState(''); 
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [isTyping, setIsTyping] = useState(false); 
    const wrapperRef = useRef(null);

    const isStringArray = Array.isArray(options) && options.length > 0 && typeof options[0] === 'string';

    // Sincronizar valor externo con el input
    useEffect(() => {
        // Solo sincronizamos si NO estamos escribiendo activamente para evitar que el cursor salte
        if (!isTyping) {
            if (value !== null && value !== undefined && value !== '') {
                if (isStringArray) {
                    setQuery(String(value));
                } else {
                    const selected = options.find(o => o[valueProp] === value);
                    if (selected) {
                        setQuery(String(selected[displayProp] || ''));
                    } else {
                        // Si es un valor manual (no está en la lista), lo mostramos tal cual
                        setQuery(String(value)); 
                    }
                }
            } else {
                setQuery('');
            }
        }
    }, [value, options, isStringArray, valueProp, displayProp, isTyping]);

    // Filtrado
    const filteredOptions = useMemo(() => {
        if (!options) return [];
        if (isOpen && !isTyping) return options; // Mostrar todo al hacer click
        if (!query) return options;

        return options.filter(opt => {
            const text = isStringArray ? opt : opt[displayProp];
            const lowerQuery = query.toLowerCase();

            if (text && String(text).toLowerCase().includes(lowerQuery)) return true;

            if (!isStringArray && searchFields) {
                return searchFields.some(field => {
                    const val = opt[field];
                    return val && String(val).toLowerCase().includes(lowerQuery);
                });
            }
            return false;
        });
    }, [options, query, isOpen, isTyping, isStringArray, displayProp, searchFields]);

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex(prev => Math.min(prev + 1, filteredOptions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            // 1. Si hay opciones y una está resaltada, selecciónala
            if (filteredOptions.length > 0 && filteredOptions[highlightedIndex]) {
                selectOption(filteredOptions[highlightedIndex]);
            } 
            // 2. Si es texto libre o creación, aceptamos el valor actual y cerramos
            else {
                if (onCreate) onCreate(query);
                setIsOpen(false);
                setIsTyping(false);
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
            setIsTyping(false);
        }
    };

    const handleInputChange = (e) => {
        const newVal = e.target.value;
        setQuery(newVal);
        setIsOpen(true);
        setIsTyping(true);
        setHighlightedIndex(0);
        
        // CRUCIAL: Notificamos al padre inmediatamente mientras escribe (Modo Texto Libre)
        onChange({ target: { value: newVal, object: null } }); 
    };

    const selectOption = (opt) => {
        const val = isStringArray ? opt : opt[valueProp];
        const text = isStringArray ? opt : opt[displayProp];
        
        setQuery(String(text || ''));
        setIsTyping(false); // Dejamos de escribir
        onChange({ target: { value: val, object: opt } }); // Enviamos objeto completo
        setIsOpen(false);
        setHighlightedIndex(0);
    };

    // Click Outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
                setIsTyping(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="flex flex-col gap-1.5 w-full relative group" ref={wrapperRef}>
            {label && <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>}
            <div className="relative">
                <input 
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-brand-red focus:ring-2 focus:ring-red-100 outline-none transition-all text-gray-800"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => { setIsOpen(true); }} // Al enfocar mostramos opciones, pero mantenemos query
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                />
                <div className="absolute right-3 top-3 text-gray-400 pointer-events-none">
                    <Icon name="ChevronDown" size={16} />
                </div>
            </div>

            {/* SOLO MOSTRAR SI ESTÁ ABIERTO Y HAY RESULTADOS (Ocultar si no hay nada) */}
            {isOpen && filteredOptions.length > 0 && (
                <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 top-full left-0 max-h-60 overflow-y-auto divide-y divide-gray-50 animate-fade-in scrollbar-thin">
                    {filteredOptions.map((opt, i) => {
                        const isSelected = i === highlightedIndex;
                        return (
                            <li 
                                key={i} 
                                onClick={() => selectOption(opt)}
                                className={`cursor-pointer transition-colors ${isSelected ? 'bg-red-50' : 'hover:bg-gray-50'}`}
                                onMouseEnter={() => setHighlightedIndex(i)}
                            >
                                {renderItem ? (
                                    renderItem(opt, isSelected)
                                ) : (
                                    <div className={`px-4 py-2 text-sm ${isSelected ? 'text-brand-red font-medium' : 'text-gray-700'}`}>
                                        {isStringArray ? opt : opt[displayProp]}
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

export default SmartSelect;