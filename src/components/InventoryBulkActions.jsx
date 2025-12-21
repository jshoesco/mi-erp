import React from 'react';
import Icon from './ui/Icon';

const InventoryBulkActions = ({ onExportClick, onImportClick }) => {
    return (
        <div className="flex gap-2">
            <button 
                onClick={onExportClick} // Ahora abre el modal de configuración
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700 font-bold text-xs hover:bg-emerald-100 transition-all"
            >
                <Icon name="Download" size={16} />
                <span>Exportar</span>
            </button>
            
            <button 
                onClick={onImportClick}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-blue-100 bg-blue-50 text-blue-600 font-bold text-xs hover:bg-blue-100 transition-all"
            >
                <Icon name="Upload" size={16} />
                <span>Importar</span>
            </button>
        </div>
    );
};

export default InventoryBulkActions;