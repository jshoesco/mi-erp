import React from 'react';
import Icon from './ui/Icon';

const formatInputNumber = (val) => {
    if (!val && val !== 0) return '';
    const num = val.toString().replace(/\D/g, "");
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const InventoryFilters = ({ 
    filterText, 
    setFilterText, 
    showFilters, 
    setShowFilters, 
    filters, 
    setFilters, 
    availableOptions, 
    selectedCount,
    onDeleteRequest
}) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center p-4">
                {selectedCount > 0 ? (
                    <div className="flex items-center gap-4 w-full animate-fade-in-up">
                        <div className="px-4 py-2 bg-brand-dark text-white rounded-xl text-sm font-bold flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">{selectedCount}</span> 
                            Seleccionados
                        </div>
                        <button onClick={onDeleteRequest} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold text-sm border border-red-100 ml-auto hover:bg-red-100">
                            <Icon name="Trash2" size={18} /> Eliminar
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative w-full max-w-md">
                            <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Buscar..." 
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none" 
                                value={filterText} 
                                onChange={(e) => setFilterText(e.target.value)} 
                            />
                        </div>
                        <button 
                            onClick={() => setShowFilters(!showFilters)} 
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-sm ${showFilters ? 'bg-brand-red text-white border-brand-red' : 'bg-white text-gray-600 border-gray-200'}`}
                        >
                            <Icon name="Filter" size={18} /><span>Filtros</span>
                        </button>
                    </div>
                )}
            </div>
            
            {showFilters && selectedCount === 0 && (
                <div className="p-4 border-t border-gray-100 bg-gray-50/50 grid grid-cols-5 gap-4 animate-fade-in">
                    <select value={filters.linea} onChange={e => setFilters({...filters, linea: e.target.value})} className="p-2 rounded-lg border text-sm bg-white">
                        <option value="">Línea</option>
                        {availableOptions.lineas.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <select value={filters.proveedor} onChange={e => setFilters({...filters, proveedor: e.target.value})} className="p-2 rounded-lg border text-sm bg-white">
                        <option value="">Proveedor</option>
                        {availableOptions.proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                    <input 
                        type="text" 
                        placeholder="Min" 
                        value={formatInputNumber(filters.minPrice)} 
                        onChange={e => setFilters({...filters, minPrice: e.target.value})} 
                        className="p-2 rounded-lg border text-sm" 
                    />
                    <input 
                        type="text" 
                        placeholder="Max" 
                        value={formatInputNumber(filters.maxPrice)} 
                        onChange={e => setFilters({...filters, maxPrice: e.target.value})} 
                        className="p-2 rounded-lg border text-sm" 
                    />
                    <select value={filters.daysAgo} onChange={e => setFilters({...filters, daysAgo: e.target.value})} className="p-2 rounded-lg border text-sm bg-white">
                        <option value="">Publicado</option>
                        {availableOptions.fechas.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                </div>
            )}
        </div>
    );
};

export default InventoryFilters;