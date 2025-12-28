import React from 'react';
import { TOKENS } from '../../../theme/constants';

const BaseLabel = ({ children }) => <label className={`${TOKENS.text.label} ml-1 mb-2 block`}>{children}</label>;

const baseInput = `w-full px-6 h-14 rounded-inner border text-[13px] font-bold text-brand-dark placeholder-brand-gray/30 outline-none transition-all duration-300 ${TOKENS.action.input}`;

export const Input = ({ label, ...props }) => (
    <div className="w-full">
        {label && <BaseLabel>{label}</BaseLabel>}
        <input {...props} className={baseInput} />
    </div>
);

export const Select = ({ label, options = [], ...props }) => (
    <div className="w-full">
        {label && <BaseLabel>{label}</BaseLabel>}
        <select {...props} className={`${baseInput} appearance-none cursor-pointer bg-no-repeat bg-[right_1.5rem_center]`}>
            {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
        </select>
    </div>
);

export const NumberInput = ({ label, value, onChange, ...props }) => {
    const format = (val) => val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const handleChange = (e) => {
        const raw = e.target.value.replace(/\./g, '');
        if (/^\d*$/.test(raw)) onChange({ target: { value: raw } });
    };
    return (
        <div className="w-full">
            {label && <BaseLabel>{label}</BaseLabel>}
            <input {...props} type="text" value={format(value || 0)} onChange={handleChange} className={`${baseInput} tabular-nums font-mono`} />
        </div>
    );
};