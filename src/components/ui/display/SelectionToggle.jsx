import React from 'react';
import Button from './Button';
import Icon from './Icon';

const SelectionToggle = ({ isActive, onClick, count = 0 }) => {
    return (
        <Button
            variant={isActive ? 'primary' : 'secondary'}
            onClick={onClick}
            className={`rounded-full px-4 h-9 text-[10px] font-black transition-all duration-300 ${isActive ? 'bg-slate-900 shadow-lg scale-105' : ''
                }`}
        >
            <Icon
                name={isActive ? "list-check" : "list"}
                size={14}
                className="mr-2"
            />
            {isActive ? `MODO SELECCIÓN (${count})` : 'SELECCIONAR'}
        </Button>
    );
};

export default SelectionToggle;