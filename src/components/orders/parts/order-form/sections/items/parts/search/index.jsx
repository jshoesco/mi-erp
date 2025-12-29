import React from 'react';
import { Input } from '../../../../../../../ui/forms/Input';
import { useSearchLogic } from './useSearchLogic';

const ProductSearch = ({ onAdd }) => {
    const { searchTerm, suggestions, isOpen, handlers } = useSearchLogic(onAdd);

    return (
        <div className="relative">
            <Input
                placeholder="BUSCAR PRODUCTO..."
                value={searchTerm}
                onChange={handlers.onChange}
                onFocus={handlers.onFocus}
                onBlur={handlers.onBlur}
            />

            {isOpen && (
                <div className="absolute z-[1000] w-full bg-white border border-slate-200 shadow-2xl rounded-2xl mt-1 overflow-hidden">
                    {suggestions.map((s) => (
                        <button
                            key={s.id}
                            onMouseDown={() => handlers.onSelect(s.raw)}
                            className="w-full flex justify-between px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors"
                        >
                            <div className="text-left font-black uppercase">
                                <p className="text-[10px] text-slate-800">{s.title}</p>
                                <p className="text-[8px] text-slate-400">{s.subtitle}</p>
                            </div>
                            <p className="text-[10px] font-black text-brand-dark">{s.price}</p>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProductSearch;