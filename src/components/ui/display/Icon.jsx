import React from 'react';
import * as LucideIcons from 'lucide-react';

/**
 * Icono Genérico: Traduce kebab-case a PascalCase automáticamente.
 */
const Icon = ({ name, size = 18, className = "" }) => {
    const pascalName = name
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');

    const LucideIcon = LucideIcons[pascalName] || LucideIcons[name];

    if (!LucideIcon) {
        console.warn(`Icono "${name}" no existe en Lucide React.`);
        return null;
    }

    return <LucideIcon size={size} className={className} strokeWidth={2.5} />;
};

/**
 * Spinner Genérico: Para estados de carga en toda la App.
 */
export const Spinner = ({ size = 32, className = "" }) => (
    <div className="flex items-center justify-center">
        <LucideIcons.Loader2 size={size} className={`animate-spin text-brand-red ${className}`} />
    </div>
);

export default Icon;