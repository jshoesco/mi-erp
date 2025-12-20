import React from 'react';
import Icon from './Icon';

const InventoryFilters = ({ filters, setFilters, lines, providers, dateOptions, onClear }) => {
    const handleChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 grid grid-cols-1 md:grid-cols-5 gap-4 animate-fade-in">
            <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase">Línea</label>
                <select 
                    value={filters.linea} 
                    onChange={(e) => handleChange('linea', e.target.value)}
                    className="w-full p-2 rounded-lg border border-gray-200 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-red/20"
                >
                    <option value="">Todas</option>
                    {lines?.map(l => <option key={l.id} value={l.nombre}>{l.nombre}</option>)}
                </select>
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase">Proveedor</label>
                <select 
                    value={filters.proveedor} 
                    onChange={(e) => handleChange('proveedor', e.target.value)}
                    className="w-full p-2 rounded-lg border border-gray-200 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-red/20"
                >
                    <option value="">Todos</option>
                    {providers?.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase">Precio Min</label>
                <input 
                    type="number" 
                    placeholder="0"
                    value={filters.minPrice}
                    onChange={(e) => handleChange('minPrice', e.target.value)}
                    className="w-full p-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-brand-red/20"
                />
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase">Precio Max</label>
                <input 
                    type="number" 
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => handleChange('maxPrice', e.target.value)}
                    className="w-full p-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-brand-red/20"
                />
            </div>

            <div className="space-y-1 relative">
                <label className="text-[10px] font-black text-gray-400 uppercase">Publicado</label>
                <select 
                    value={filters.daysAgo} 
                    onChange={(e) => handleChange('daysAgo', e.target.value)}
                    className="w-full p-2 rounded-lg border border-gray-200 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-red/20"
                >
                    <option value="">Cualquier fecha</option>
                    {dateOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                {Object.values(filters).some(v => v !== '') && (
                    <button 
                        onClick={onClear}
                        className="absolute -top-6 right-0 text-[10px] text-brand-red font-bold hover:underline"
                    >
                        LIMPIAR
                    </button>
                )}
            </div>
        </div>
    );
};

export default InventoryFilters;