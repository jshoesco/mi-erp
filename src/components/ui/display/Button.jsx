import React from 'react';
import Icon from './Icon';

export const Button = ({
    children,
    onClick,
    variant = 'primary',
    className = "",
    disabled = false,
    loading = false,
    icon = null
}) => {
    const variants = {
        // El principal para acciones de crear/guardar
        primary: "bg-brand-dark text-white hover:bg-black shadow-xl shadow-gray-200",
        // Para resaltar acciones de marca
        brand: "bg-brand-red text-white hover:bg-red-600 shadow-lg shadow-brand-red/20",
        // Para cancelar o acciones secundarias
        secondary: "bg-white text-gray-500 border border-gray-100 hover:bg-gray-50 hover:border-gray-200",
        // Para borrar o alertas
        danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100"
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            className={`
                px-8 h-12 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em]
                flex items-center justify-center gap-3 transition-all duration-300 
                active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed
                ${variants[variant]} ${className}
            `}
        >
            {loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
                <>
                    {icon && <Icon name={icon} size={16} />}
                    {children}
                </>
            )}
        </button>
    );
};

export default Button;

export const ConfigButton = ({ onClick, label = "CONFIGURACIÓN" }) => (
    <Button
        variant="secondary"
        icon="settings"
        onClick={onClick}
    >
        {label}
    </Button>
);