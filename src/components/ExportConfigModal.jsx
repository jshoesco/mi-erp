import React, { useState, useEffect } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { exportToExcel } from '../lib/inventoryActions';

// Lista completa incluyendo el link de Cloudinary
const ALL_PRODUCT_COLUMNS = [
    { id: 'c1', header: 'Fecha', field: 'fecha' },
    { id: 'c2', header: 'SKU', field: 'sku' },
    { id: 'c3', header: 'Marca', field: 'marca' },
    { id: 'c4', header: 'Modelo', field: 'modelo' },
    { id: 'c5', header: 'Nombre', field: 'nombre' },
    { id: 'c6', header: 'Género', field: 'genero' },
    { id: 'c7', header: 'Costo', field: 'costo' },
    { id: 'c8', header: 'Precio', field: 'precio' },
    { id: 'c9', header: 'Ganancia', field: 'ganancia' },
    { id: 'c10', header: 'Estado', field: 'status' },
    { id: 'c11', header: 'URL Imagen (Cloudinary)', field: 'imagen' }, // Campo del link
    { id: 'c12', header: 'Public ID (Cloudinary)', field: 'public_id' }, // ID de archivo
    { id: 'c13', header: 'Proveedor ID', field: 'proveedor_uid' },
    { id: 'c14', header: 'ID Firebase', field: 'id' },
];

const ExportConfigModal = ({ isOpen, onClose, products }) => {
    const [selectedIds, setSelectedIds] = useState(() => {
        const saved = localStorage.getItem('export_pref_columns');
        return saved ? JSON.parse(saved) : ALL_PRODUCT_COLUMNS.map(c => c.id);
    });

    useEffect(() => {
        localStorage.setItem('export_pref_columns', JSON.stringify(selectedIds));
    }, [selectedIds]);

    const toggleColumn = (id) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(Array.from(next));
    };

    const handleDownload = () => {
        const columnsToExport = ALL_PRODUCT_COLUMNS.filter(c => selectedIds.includes(c.id));
        exportToExcel(products, columnsToExport);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Configurar Exportación">
            <div className="space-y-4">
                <p className="text-xs text-gray-500 font-medium px-1">
                    Selecciona en lista las columnas para el Excel:
                </p>
                
                {/* Lista vertical de una sola columna */}
                <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                    {ALL_PRODUCT_COLUMNS.map(col => (
                        <label 
                            key={col.id} 
                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                                selectedIds.includes(col.id) 
                                ? 'border-emerald-500 bg-emerald-50/50' 
                                : 'border-gray-100 bg-white opacity-60'
                            }`}
                        >
                            <span className={`text-[11px] font-black uppercase tracking-wider ${
                                selectedIds.includes(col.id) ? 'text-emerald-700' : 'text-gray-400'
                            }`}>
                                {col.header}
                            </span>
                            <input 
                                type="checkbox" 
                                className="w-4 h-4 accent-emerald-600" 
                                checked={selectedIds.includes(col.id)}
                                onChange={() => toggleColumn(col.id)}
                            />
                        </label>
                    ))}
                </div>

                <div className="pt-4 flex gap-3 border-t">
                    <Button 
                        variant="secondary" 
                        className="flex-1 text-[10px]" 
                        onClick={() => setSelectedIds(selectedIds.length === ALL_PRODUCT_COLUMNS.length ? [] : ALL_PRODUCT_COLUMNS.map(c => c.id))}
                    >
                        {selectedIds.length === ALL_PRODUCT_COLUMNS.length ? 'Desmarcar todo' : 'Marcar todo'}
                    </Button>
                    <Button 
                        onClick={handleDownload} 
                        className="flex-[2] bg-emerald-600 text-white font-black shadow-lg shadow-emerald-200"
                        disabled={selectedIds.length === 0}
                    >
                        DESCARGAR EXCEL
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ExportConfigModal;