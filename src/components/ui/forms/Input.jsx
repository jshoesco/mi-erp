import React from 'react';
import Icon from '../display/Icon';

export const Input = ({ label, icon, className = "", ...props }) => {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {label && <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>}
            <div className="relative">
                {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Icon name={icon} size={14} /></div>}
                <input
                    {...props} // ESTO ES LO VITAL: Permite onChange, onFocus, value, etc.
                    className={`w-full h-12 bg-white border border-slate-200 ${icon ? 'pl-11' : 'px-4'} rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-brand-red transition-all`}
                />
            </div>
        </div>
    );
};

export default Input