import React from 'react';
import Icon from './Icon';

const SelectToggle = ({ isVisible, isSelected }) => {
    if (!isVisible) return null;

    return (
        <div
            className={`
                w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200
                animate-in zoom-in fade-in duration-300
                ${isSelected
                    ? 'bg-slate-900 border-slate-900 shadow-md'
                    : 'bg-white border-slate-200 hover:border-slate-400'}
            `}
        >
            {isSelected && (
                <Icon name="check" size={12} strokeWidth={4} className="text-white" />
            )}
        </div>
    );
};

export default SelectToggle;