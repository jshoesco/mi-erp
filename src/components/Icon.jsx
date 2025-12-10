import * as icons from 'lucide-react';

const Icon = ({ name, size = 18, className = "" }) => {
    // Convertimos el nombre del string (ej: "Trash2") al componente real
    // La primera letra debe ser mayúscula, aunque lucide suele manejarlo bien.
    const LucideIcon = icons[name];

    if (!LucideIcon) {
        console.warn(`Icono no encontrado: ${name}`);
        return null;
    }

    return <LucideIcon size={size} className={className} />;
};

export const Spinner = () => (
    <Icon name="Loader2" className="animate-spin text-indigo-600" size={32} />
);

export default Icon;