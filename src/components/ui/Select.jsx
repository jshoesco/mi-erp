import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { IconChevronDown } from '@tabler/icons-react';

export const Select = ({ options = [], value, onChange, onKeyDown, className = "" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, bottom: 0 });
    const [dropUp, setDropUp] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const optionsRef = useRef([]);

    const filteredOptions = options.filter(opt =>
        opt.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const updatePosition = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            setDropUp(spaceBelow < 260);
            setCoords({ top: rect.top, bottom: rect.bottom, left: rect.left, width: rect.width });
        }
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
                setSearchTerm("");
                setActiveIndex(-1);
            }
        };
        if (isOpen) {
            updatePosition();
            window.addEventListener('scroll', updatePosition, true);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [isOpen]);

    const handleSelect = (opt) => {
        onChange({ target: { value: opt } });
        setIsOpen(false);
        setSearchTerm("");
        setActiveIndex(-1);
    };

    const handleKeyDown = (e) => {
        if (isOpen) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
            } else if (e.key === 'Enter' && activeIndex >= 0) {
                e.preventDefault();
                handleSelect(filteredOptions[activeIndex]);
            } else if (e.key === 'Escape' || e.key === 'Tab') {
                // Al presionar TAB o ESC, cerramos inmediatamente
                setIsOpen(false);
            }
        } else if (e.key === 'Enter' || e.key === 'ArrowDown') {
            setIsOpen(true);
        }
        if (onKeyDown) onKeyDown(e);
    };

    return (
        <div ref={containerRef} className={`relative w-full ${className}`}>
            <div
                className={`
                    h-12 px-4 flex items-center justify-between
                    bg-gray-50/40 hover:bg-white border rounded-xl transition-all duration-500
                    ${isOpen ? 'border-brand-red/40 bg-white shadow-sm ring-2 ring-brand-red/5' : 'border-gray-100/60'}
                `}
            >
                <input
                    ref={inputRef}
                    type="text"
                    className="w-full bg-transparent border-none p-0 text-[11px] font-bold uppercase tracking-[0.2em] outline-none text-gray-800 placeholder:text-gray-400/60"
                    placeholder={value ? value.replace(/_/g, ' ') : "FILTRAR..."}
                    value={searchTerm}
                    onFocus={() => {
                        setIsOpen(true);
                        updatePosition();
                    }}
                    // ESTO CORRIGE TU PROBLEMA DE TABULACIÓN:
                    onBlur={() => {
                        // Delay mínimo para permitir que el clic en una opción funcione
                        setTimeout(() => {
                            setIsOpen(false);
                            setSearchTerm("");
                        }, 200);
                    }}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        if (!isOpen) setIsOpen(true);
                        setActiveIndex(0);
                    }}
                    onClick={() => setIsOpen(true)}
                />
                <IconChevronDown
                    size={14}
                    className={`transition-transform duration-500 cursor-pointer ${isOpen ? 'rotate-180 text-brand-red/60' : 'text-gray-300'}`}
                    onClick={() => setIsOpen(!isOpen)}
                />
            </div>

            {isOpen && coords.width > 0 && createPortal(
                <div
                    className="fixed bg-white/95 backdrop-blur-md rounded-xl shadow-[0_15px_50px_rgba(0,0,0,0.05)] border border-gray-100/50 z-[9999] py-1 overflow-hidden"
                    style={{
                        width: coords.width,
                        left: coords.left,
                        top: dropUp ? 'auto' : coords.bottom + 6,
                        bottom: dropUp ? (window.innerHeight - coords.top) + 6 : 'auto',
                    }}
                >
                    <div className="max-h-[220px] overflow-y-auto custom-scrollbar scroll-smooth">
                        {filteredOptions.map((opt, index) => (
                            <div
                                key={opt}
                                ref={el => optionsRef.current[index] = el}
                                onMouseEnter={() => setActiveIndex(index)}
                                onMouseDown={(e) => {
                                    // Usamos onMouseDown en lugar de onClick para que se ejecute ANTES del onBlur del input
                                    e.preventDefault();
                                    handleSelect(opt);
                                }}
                                className={`
                                    px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em] cursor-pointer transition-all
                                    ${activeIndex === index ? 'bg-brand-red/10 text-brand-red' : 'text-gray-400 hover:bg-gray-50/50'}
                                `}
                            >
                                {opt.replace(/_/g, ' ')}
                            </div>
                        ))}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};