import React from 'react';
import Icon from './display/Icon';

const Checkbox = ({ checked, onChange, label, className = "" }) => {
    return (
        <label className={`flex items-center gap-3 cursor-pointer group select-none ${className}`}>
            <div className="relative">
                <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={onChange}
                />
                <div className={`w-6 h-6 rounded-xl border-2 transition-all flex items-center justify-center
                    ${checked
                        ? 'bg-brand-red border-brand-red shadow-lg shadow-red-200 scale-110'
                        : 'bg-white border-slate-200 group-hover:border-slate-400'}`}>
                    {checked && <Icon name="Check" size={14} className="text-white stroke-[4]" />}
                </div>
            </div>
            {label && (
                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors
                    ${checked ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`}>
                    {label}
                </span>
            )}
        </label>
    );
};

export default Checkbox;