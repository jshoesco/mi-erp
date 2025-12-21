import React from 'react';
import { IconCheck } from '@tabler/icons-react';

const Checkbox = ({ checked, onChange, indeterminate = false }) => {
    return (
        <div 
            onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer
                ${checked || indeterminate ? 'bg-brand-red border-brand-red' : 'bg-white border-gray-300 hover:border-brand-red'}`}
        >
            {checked && !indeterminate && <IconCheck size={14} className="text-white stroke-[4]" />}
            {indeterminate && <div className="w-2 h-0.5 bg-white rounded-full" />}
        </div>
    );
};

export default Checkbox;