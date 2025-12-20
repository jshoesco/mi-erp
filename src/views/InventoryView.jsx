import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../context/DataContext';
import Icon from '../components/Icon';
import SafeImg from '../components/SafeImg';
import Button from '../components/Button';
import ColumnConfigModal from '../components/ColumnConfigModal';

// CONFIGURACIÓN POR DEFECTO
const DEFAULT_COLUMNS = [
    { id: 'def1', header: 'Producto', field: 'imagen' },
    { id: 'def2', header: 'Nombre / Ref', field: 'nombre' },
    { id: 'def3', header: 'SKU', field: 'sku' },
    { id: 'def4', header: 'Precio Venta', field: 'precio' },
];

const InventoryView = ({ onEditRequest }) => {
    const { products } = useData();
    const [search, setSearch] = useState('');
    const [showConfig, setShowConfig] = useState(false);
    
    // Estado para el Zoom de Imagen
    const [zoomedImage, setZoomedImage] = useState(null);

    // Estado para los Checkboxes
    const [selectedIds, setSelectedIds] = useState(new Set());

    // Estado persistente de columnas
    const [columns, setColumns] = useState(() => {
        const saved = localStorage.getItem('inventory_columns');
        return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
    });

    useEffect(() => {
        localStorage.setItem('inventory_columns', JSON.stringify(columns));
    }, [columns]);

    const filteredProducts = useMemo(() => {
        return products.filter(p => 
            p.nombre?.toLowerCase().includes(search.toLowerCase()) ||
            p.sku?.toLowerCase().includes(search.toLowerCase())
        );
    }, [products, search]);

    // LÓGICA DE SELECCIÓN
    const isAllSelected = filteredProducts.length > 0 && selectedIds.size === filteredProducts.length;

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = new Set(filteredProducts.map(p => p.id));
            setSelectedIds(allIds);
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    // RENDERIZADOR DE CELDAS
    const renderCell = (product, field) => {
        const value = product[field];

        if (field === 'imagen') {
            return (
                <div 
                    onClick={(e) => {
                        e.stopPropagation();
                        setZoomedImage(value);
                    }}
                    className="cursor-zoom-in hover:scale-105 transition-transform w-fit"
                >
                    <SafeImg src={value} className="w-12 h-12 rounded-lg object-cover shadow-sm border border-gray-100" />
                </div>
            );
        }
        if (field === 'precio' || field === 'costo' || field === 'ganancia') {
            return (
                <span className={`font-mono font-bold ${field === 'costo' ? 'text-red-600' : 'text-emerald-700'}`}>
                    ${Number(value || 0).toLocaleString()}
                </span>
            );
        }
        if (field === 'status') {
            return (
                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${value === 'archivado' ? 'bg-gray-200 text-gray-500' : 'bg-green-100 text-green-700'}`}>
                    {value || 'Activo'}
                </span>
            );
        }
        if (field === 'fecha') {
            return <span className="text-xs text-gray-500">{new Date(value).toLocaleDateString()}</span>;
        }
        return <span className="text-sm font-medium text-gray-700">{value || '-'}</span>;
    };

    return (
        <div className="flex flex-col h-full space-y-4 relative">
            
            {/* MODAL DE ZOOM */}
            {zoomedImage && (
                <div 
                    className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
                    onClick={() => setZoomedImage(null)}
                >
                    <div className="relative max-w-3xl max-h-[90vh]">
                        <SafeImg src={zoomedImage} className="max-w-full max-h-[85vh] rounded-xl shadow-2xl" />
                        <button className="absolute -top-4 -right-4 bg-white text-black p-2 rounded-full shadow-lg hover:bg-red-500 hover:text-white transition-colors">
                            <Icon name="X" size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL CONFIGURACIÓN */}
            {showConfig && (
                <ColumnConfigModal 
                    currentColumns={columns} 
                    onSave={setColumns} 
                    onClose={() => setShowConfig(false)} 
                />
            )}

            {/* HEADER */}
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 flex-1">
                    <div className="relative w-full max-w-md">
                        <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text"
                            placeholder="Buscar..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-red outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    {/* CONTADOR DE SELECCIONADOS */}
                    {selectedIds.size > 0 && (
                        <div className="px-3 py-1 bg-brand-red/10 text-brand-red rounded-lg text-xs font-bold animate-fade-in">
                            {selectedIds.size} seleccionados
                        </div>
                    )}
                </div>

                <Button 
                    onClick={() => setShowConfig(true)}
                    className="flex items-center gap-2 bg-gray-900 text-white hover:bg-brand-red px-4 py-2 rounded-xl transition-all shadow-lg shadow-gray-900/20"
                >
                    <Icon name="Settings" size={18} />
                    <span>Personalizar Tabla</span>
                </Button>
            </div>

            {/* TABLA INTERACTIVA */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            {/* CHECKBOX HEADER (Accent Color Agregado) */}
                            <th className="p-4 w-10">
                                <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded border-gray-300 text-brand-red focus:ring-brand-red accent-brand-red cursor-pointer"
                                    checked={isAllSelected}
                                    onChange={handleSelectAll}
                                />
                            </th>

                            {columns.map(col => (
                                <th key={col.id} className="p-4 text-xs font-black text-gray-400 uppercase whitespace-nowrap select-none">
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredProducts.map(product => (
                            <tr 
                                key={product.id} 
                                onClick={() => onEditRequest && onEditRequest(product)}
                                className={`
                                    transition-colors cursor-pointer group 
                                    ${selectedIds.has(product.id) ? 'bg-brand-red/5' : 'hover:bg-brand-red/5'}
                                `}
                            >
                                {/* CHECKBOX ROW (Accent Color Agregado) */}
                                <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-gray-300 text-brand-red focus:ring-brand-red accent-brand-red cursor-pointer"
                                        checked={selectedIds.has(product.id)}
                                        onChange={() => handleSelectOne(product.id)}
                                    />
                                </td>

                                {columns.map(col => (
                                    <td key={`${product.id}-${col.id}`} className="p-4">
                                        {renderCell(product, col.field)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                {filteredProducts.length === 0 && (
                    <div className="p-10 text-center text-gray-400">
                        <p>No se encontraron productos.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InventoryView;