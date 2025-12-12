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
    onCreate = null 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState(''); 
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const wrapperRef = useRef(null);

    const isStringArray = Array.isArray(options) && options.length > 0 && typeof options[0] === 'string';

    useEffect(() => {
        if (value !== null && value !== undefined && value !== '') {
            if (isStringArray) {
                setQuery(String(value));
            } else {
                const selected = options.find(o => o[valueProp] === value);
                if (selected) {
                    setQuery(String(selected[displayProp] || ''));
                } else {
                    // Si el valor no está en la lista (ej: nuevo ingreso), mantenemos el valor visual si coincide con el prop value, 
                    // o lo dejamos vacío si no. Para inputs controlados a veces es mejor no limpiar si no es necesario.
                    // En este caso, para SmartSelect estricto, si no está en la lista, mostramos vacío o el valor crudo.
                     // Estrategia: Si no encuentra match, asumimos que el valor externo es lo que se debe mostrar (útil para edición)
                    setQuery(''); 
                }
            }
        } else {
            setQuery('');
        }
    }, [value, options, isStringArray, valueProp, displayProp]);

    const filteredOptions = useMemo(() => {
        if (!options) return [];
        if (!query && isOpen) return options;
        if (!query && !isOpen) return options;

        return options.filter(opt => {
            const text = isStringArray ? opt : opt[displayProp];
            return text && String(text).toLowerCase().includes(query.toLowerCase());
        });
    }, [options, query, isOpen, isStringArray, displayProp]);

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex(prev => Math.min(prev + 1, filteredOptions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredOptions[highlightedIndex]) {
                selectOption(filteredOptions[highlightedIndex]);
            } else if (onCreate && query) {
                onCreate(query);
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    const selectOption = (opt) => {
        const val = isStringArray ? opt : opt[valueProp];
        const text = isStringArray ? opt : opt[displayProp];
        setQuery(String(text || ''));
        onChange({ target: { value: val } });
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="flex flex-col gap-1.5 w-full relative" ref={wrapperRef}>
            {label && <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>}
            <div className="relative">
                <input 
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-brand-red focus:ring-2 focus:ring-red-100 outline-none transition-all text-gray-800"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                />
                <div className="absolute right-3 top-3 text-gray-400 pointer-events-none">
                    <Icon name="ChevronDown" size={16} />
                </div>
            </div>

            {isOpen && (
                // AQUÍ ESTÁ EL CAMBIO: mt-1 para separar la lista del input
                <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-60 overflow-y-auto divide-y divide-gray-50 animate-fade-in top-full left-0">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((opt, i) => {
                            const text = isStringArray ? opt : opt[displayProp];
                            return (
                                <li 
                                    key={i} 
                                    onClick={() => selectOption(opt)}
                                    className={`px-4 py-2 text-sm cursor-pointer transition-colors ${i === highlightedIndex ? 'bg-red-50 text-brand-red font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                                    onMouseEnter={() => setHighlightedIndex(i)}
                                >
                                    {text}
                                </li>
                            );
                        })
                    ) : (
                        <li className="px-4 py-3 text-xs text-gray-400 italic text-center">No hay opciones</li>
                    )}
                </ul>
            )}
        </div>
    );
};

export default SmartSelect;