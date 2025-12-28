import React from 'react';
import { TOKENS } from '../../../../theme/constants';
import { Input } from '../../../ui/forms/Controls';
import { H2 } from '../../../ui/display/Typography';
import Icon from '../../../ui/display/Icon';

const DatabaseMapping = ({ mapping, onChange }) => {
    const handleChange = (field, value) => {
        onChange({ ...mapping, [field]: value });
    };

    return (
        <section className="space-y-6 relative z-10">
            <div className="flex items-center gap-3 border-b border-brand-light pb-4">
                <Icon name="Database" size={18} className="text-brand-red" />
                <H2 className="text-sm">Diccionario de Colecciones (Mapeo)</H2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Input
                    label="Colección Proveedores"
                    value={mapping?.coll_providers || ''}
                    onChange={e => handleChange('coll_providers', e.target.value)}
                    placeholder="ej: proveedores"
                />
                <Input
                    label="Colección Líneas"
                    value={mapping?.coll_lines || ''}
                    onChange={e => handleChange('coll_lines', e.target.value)}
                    placeholder="ej: config_lineas"
                />
                <Input
                    label="Colección Productos"
                    value={mapping?.coll_products || ''}
                    onChange={e => handleChange('coll_products', e.target.value)}
                    placeholder="ej: productos"
                />
            </div>
        </section>
    );
};

export default DatabaseMapping;