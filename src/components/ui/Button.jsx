import Icon from './Icon';

const Button = ({ children, onClick, variant = 'primary', className = "", disabled = false, icon = null, title = "" }) => {
    const styles = {
        // Rojo intenso con sombra roja, estilo marca
        primary: "bg-brand-red text-white hover:bg-red-700 shadow-lg shadow-brand-red/30 border border-transparent",
        
        // Blanco limpio con borde suave
        secondary: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm",
        
        // Rojo suave para borrar (ahora consistente con la marca)
        danger: "bg-white text-brand-red border border-red-200 hover:bg-red-50 hover:border-brand-red/30",
        
        // Verde esmeralda para éxito
        success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 border border-transparent"
    };

    return (
        <button 
            onClick={onClick} 
            disabled={disabled} 
            title={title} 
            className={`
                px-5 py-2.5 rounded-xl font-semibold text-sm 
                flex items-center justify-center gap-2 
                transition-all duration-200 active:scale-95 
                disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
                ${styles[variant]} ${className}
            `}
        >
            {icon && <Icon name={icon} size={18} />}
            {children}
        </button>
    );
};

export default Button;