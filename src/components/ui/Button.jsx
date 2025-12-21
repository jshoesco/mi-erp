import React from 'react';
import Icon from './Icon';

const Button = ({ children, onClick, variant = 'primary', className = "", disabled = false, icon = null, title = "" }) => {
    const styles = {
        primary: "bg-brand-red text-white hover:bg-red-600 shadow-xl shadow-brand-red/20",
        secondary: "bg-white text-gray-600 border border-gray-100 hover:bg-gray-50 hover:border-gray-200 shadow-sm",
        danger: "bg-red-50 text-red-600 hover:bg-red-100",
        success: "bg-emerald-500 text-white hover:bg-emerald-600 shadow-xl shadow-emerald-500/20"
    };

    return (
        <button 
            onClick={onClick} 
            disabled={disabled} 
            title={title} 
            className={`
                px-7 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest
                flex items-center justify-center gap-2.5 
                transition-all duration-300 active:scale-95 
                disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
                ${styles[variant]} ${className}
            `}
        >
            {icon && <Icon name={icon} size={16} />}
            {children}
        </button>
    );
};

export default Button;