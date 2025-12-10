import { useState, useEffect, useRef, useMemo } from 'react';
import Icon from './Icon';

const SmartSelect = ({ label, value, onChange, options = [], placeholder = "Seleccionar...", displayProp = 'nombre', valueProp = 'id', onCreate = null }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const wrapperRef = useRef(null);
    const isStringArray = options.length > 0 && typeof options[0] === 'string';

    useEffect(() => {
        if (value) {
            if (isStringArray) { setQuery(value); } 
            else { const selected = options.find(o => o[valueProp] === value); if (selected) setQuery(selected[displayProp]); }
        } else { setQuery(''); }
    }, [value, options, isStringArray, valueProp, displayProp]);

    const filteredOptions = useMemo(() => {
        if (!query && !isOpen) return options;
        return options.filter(opt => {
            const text = isStringArray ? opt : opt[displayProp];
            return String(text).toLowerCase().includes(query.toLowerCase());
        });
    }, [options, query, isOpen, isStringArray, displayProp]);

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightedIndex(prev => Math.min(prev + 1, filteredOptions.length - 1)); } 
        else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightedIndex(prev => Math.max(prev - 1, 0)); } 
        else if (e.key === 'Enter') { e.preventDefault(); if (filteredOptions[highlightedIndex]) selectOption(filteredOptions[highlightedIndex]); else if (onCreate && query) onCreate(query); } 
        else if (e.key === 'Escape') setIsOpen(false);
    };

    const selectOption = (opt) => {
        const val = isStringArray ? opt : opt[valueProp];
        const text = isStringArray ? opt : opt[displayProp];
        setQuery(text); onChange({ target: { value: val } }); setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event) => { if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false); };
        document.addEventListener("mousedown", handleClickOutside); return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="flex flex-col gap-1.5 w-full relative" ref={wrapperRef}>
            {label && <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">{label}</label>}
            <div className="relative group">
                <input 
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none transition-all shadow-sm hover:border-slate-400"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setIsOpen(true); if (isStringArray) onChange(e); }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                />
                <div className="absolute right-3 top-3 text-slate-400 pointer-events-none group-focus-within:text-brand-red transition-colors">
                    <Icon name="ChevronDown" size={16} />
                </div>
            </div>
            {isOpen && filteredOptions.length > 0 && (
                <ul className="absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-xl mt-1 max-h-60 overflow-y-auto divide-y divide-slate-50">
                    {filteredOptions.map((opt, i) => {
                        const text = isStringArray ? opt : opt[displayProp];
                        return (
                            <li 
                                key={i} 
                                onClick={() => selectOption(opt)}
                                // CAMBIO: Rojo suave al pasar el mouse o seleccionar
                                className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${i === highlightedIndex ? 'bg-red-50 text-brand-red font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                            >
                                {text}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

export default SmartSelect;