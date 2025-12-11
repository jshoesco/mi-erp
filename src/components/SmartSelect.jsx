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
    // Corrección 1: Asegurar que query nunca sea undefined/null
    const [query, setQuery] = useState(''); 
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const wrapperRef = useRef(null);

    // Detectar si las opciones son strings simples o objetos
    const isStringArray = Array.isArray(options) && options.length > 0 && typeof options[0] === 'string';

    // Sincronizar valor externo con el texto del input
    useEffect(() => {
        if (value !== null && value !== undefined && value !== '') {
            if (isStringArray) {
                setQuery(String(value));
            } else {
                const selected = options.find(o => o[valueProp] === value);
                if (selected) {
                    setQuery(String(selected[displayProp] || ''));
                } else {
                    // Si no encuentra el objeto (ej: valor inicial que no está en la lista), limpia
                    setQuery('');
                }
            }
        } else {
            setQuery('');
        }
    }, [value, options, isStringArray, valueProp, displayProp]);

    // Filtrar opciones (BLINDADO contra errores de toLowerCase)
    const filteredOptions = useMemo(() => {
        if (!options) return [];
        // Si no está abierto y no hay query que filtre, devolver todo (o nada si prefieres)
        // Aquí devolvemos todo para que al abrir se vea la lista completa si no escribes nada
        if (!query && isOpen) return options;
        if (!query && !isOpen) return options;

        return options.filter(opt => {
            const text = isStringArray ? opt : opt[displayProp];
            // Corrección 2: Verificar que text exista antes de usar toLowerCase
            return text && String(text).toLowerCase().includes(query.toLowerCase());
        });
    }, [options, query, isOpen, isStringArray, displayProp]);

    // Manejo de Teclado
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
            // Revertir al valor seleccionado si cancela
            // (Opcional, por ahora solo cierra)
        }
    };

    const selectOption = (opt) => {
        const val = isStringArray ? opt : opt[valueProp];
        const text = isStringArray ? opt : opt[displayProp];
        
        setQuery(String(text || ''));
        onChange({ target: { value: val } });
        setIsOpen(false);
    };

    // Cerrar al hacer clic fuera
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
                        // Opcional: Si quieres que escribiendo se limpie el valor seleccionado
                        // onChange({ target: { value: '' } }); 
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
                <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-60 overflow-y-auto divide-y divide-gray-50 animate-fade-in">
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