import React from 'react';
import Icon from './Icon';
import Button from './Button';
import InventoryBulkActions from './InventoryBulkActions';

const InventoryHeader = ({ 
    currentTab, 
    setCurrentTab, 
    onNewProduct, 
    setSelectedIds, 
    products, 
    onExportClick, // AGREGADO: Nueva prop para el modal de configuración
    onImportClick 
}) => {
    return (
        <div className="flex justify-between items-end px-1 pb-2 border-b border-gray-100">
            <div className="space-y-4">
                <h1 className="text-2xl font-black text-gray-800 tracking-tight">Gestión de Inventario</h1>
                
                <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
                    <button 
                        onClick={() => { setCurrentTab('active'); setSelectedIds(new Set()); }} 
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${currentTab === 'active' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Activo
                    </button>
                    <button 
                        onClick={() => { setCurrentTab('archived'); setSelectedIds(new Set()); }} 
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${currentTab === 'archived' ? 'bg-white shadow-sm text-brand-red' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <Icon name="Archive" size={14} /> 
                        Archivados
                    </button>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                {/* BOTONES DE EXPORTAR/IMPORTAR */}
                <InventoryBulkActions 
                    products={products} 
                    onExportClick={onExportClick} // AGREGADO: Pasamos la función al componente de botones
                    onImportClick={onImportClick} 
                />

                <div className="h-8 w-px bg-gray-200 mx-2" />

                <Button 
                    onClick={onNewProduct} 
                    className="bg-brand-red text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-brand-red/20 hover:scale-[1.02] transition-transform"
                >
                    <Icon name="Plus" size={20} />
                    <span>Nuevo Producto</span>
                </Button>
            </div>
        </div>
    );
};

export default InventoryHeader;