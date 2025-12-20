import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../context/DataContext';
import Icon from '../components/Icon';
import SafeImg from '../components/SafeImg';
import Button from '../components/Button';
import ColumnConfigModal from '../components/ColumnConfigModal';
import ConfirmModal from '../components/ConfirmModal';

const DEFAULT_COLUMNS = [
    { id: 'def1', header: 'Producto', field: 'imagen' },
    { id: 'def2', header: 'Nombre / Ref', field: 'nombre' },
    { id: 'def3', header: 'SKU', field: 'sku' },
    { id: 'def4', header: 'Precio Venta', field: 'precio' },
    { id: 'def5', header: 'Estado', field: 'status' },
];

const InventoryView = ({ onEditRequest }) => {
    const { products, updateProduct, deleteProduct } = useData();
    
    const [search, setSearch] = useState('');
    const [showConfig, setShowConfig] = useState(false);
    const [zoomedImage, setZoomedImage] = useState(null);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [currentTab, setCurrentTab] = useState('active');

    const [confirmModal, setConfirmModal] = useState({ 
        isOpen: false, title: '', message: '', action: null, type: 'danger' 
    });

    const [columns, setColumns] = useState(() => {
        const saved = localStorage.getItem('inventory_columns');
        return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
    });

    useEffect(() => {
        localStorage.setItem('inventory_columns', JSON.stringify(columns));
    }, [columns]);

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = p.nombre?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase());
            const isArchived = p.status === 'archivado';
            const matchesTab = currentTab === 'active' ? !isArchived : isArchived;
            return matchesSearch && matchesTab;
        });
    }, [products, search, currentTab]);

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
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedIds(newSelected);
    };

    // --- ACCIONES ---
    const requestStatusChange = (newStatus) => {
        const isArchiving = newStatus === 'archivado';
        setConfirmModal({
            isOpen: true,
            title: isArchiving ? '¿Archivar productos?' : '¿Restaurar productos?',
            message: isArchiving 
                ? `Moverás ${selectedIds.size} productos a la pestaña de Archivados.`
                : `Los ${selectedIds.size} productos volverán a estar activos.`,
            type: isArchiving ? 'warning' : 'info',
            action: async () => {
                const updates = Array.from(selectedIds).map(id => updateProduct(id, { status: newStatus }));
                await Promise.all(updates);
                setSelectedIds(new Set());
            }
        });
    };

    const requestDelete = () => {
        setConfirmModal({
            isOpen: true,
            title: '¿Eliminar permanentemente?',
            message: `Vas a borrar ${selectedIds.size} productos. NO se puede deshacer.`,
            type: 'danger',
            action: async () => {
                const deletions = Array.from(selectedIds).map(id => deleteProduct(id));
                await Promise.all(deletions);
                setSelectedIds(new Set());
            }
        });
    };

    const renderCell = (product, field) => {
        const value = product[field];
        if (field === 'imagen') return <div onClick={(e) => { e.stopPropagation(); setZoomedImage(value); }} className="cursor-zoom-in hover:scale-105 transition-transform w-fit"><SafeImg src={value} className="w-12 h-12 rounded-lg object-cover shadow-sm border border-gray-100" /></div>;
        if (field === 'precio' || field === 'costo') return <span className={`font-mono font-bold ${field === 'costo' ? 'text-red-600' : 'text-emerald-700'}`}>${Number(value || 0).toLocaleString()}</span>;
        if (field === 'status') {
            const isArchived = value === 'archivado';
            return <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wide ${isArchived ? 'bg-gray-100 text-gray-500 border border-gray-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>{isArchived ? 'Archivado' : 'Activo'}</span>;
        }
        if (field === 'fecha') return <span className="text-xs text-gray-500">{new Date(value).toLocaleDateString()}</span>;
        return <span className="text-sm font-medium text-gray-700">{value || '-'}</span>;
    };

    return (
        <div className="flex flex-col h-full space-y-4 relative">
            
            <ConfirmModal 
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.action}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
            />

            {zoomedImage && (
                <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setZoomedImage(null)}>
                    <div className="relative max-w-3xl max-h-[90vh]">
                        <SafeImg src={zoomedImage} className="max-w-full max-h-[85vh] rounded-xl shadow-2xl" />
                        <button className="absolute -top-4 -right-4 bg-white text-black p-2 rounded-full shadow-lg hover:bg-red-500 hover:text-white transition-colors"><Icon name="X" size={20} /></button>
                    </div>
                </div>
            )}
            
            {showConfig && <ColumnConfigModal currentColumns={columns} onSave={setColumns} onClose={() => setShowConfig(false)} />}

            {/* PESTAÑAS */}
            <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
                <button onClick={() => { setCurrentTab('active'); setSelectedIds(new Set()); }} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${currentTab === 'active' ? 'bg-white text-brand-dark shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Inventario Activo</button>
                <button onClick={() => { setCurrentTab('archived'); setSelectedIds(new Set()); }} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${currentTab === 'archived' ? 'bg-white text-brand-red shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}><Icon name="Archive" size={14} /> Archivados</button>
            </div>

            {/* HEADER */}
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100 min-h-[80px]">
                {selectedIds.size > 0 ? (
                    <div className="flex items-center gap-4 w-full animate-fade-in-up">
                        <div className="px-4 py-2 bg-brand-dark text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-dark/20 flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">{selectedIds.size}</span>Seleccionados</div>
                        <div className="h-8 w-px bg-gray-200 mx-2"></div>
                        
                        {currentTab === 'active' ? (
                            <button onClick={() => requestStatusChange('archivado')} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-bold text-sm transition-colors"><Icon name="Archive" size={18} /> Archivar</button>
                        ) : (
                            <button onClick={() => requestStatusChange('activo')} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 font-bold text-sm transition-colors border border-emerald-100"><Icon name="RefreshCw" size={18} /> Restaurar</button>
                        )}
                        <button onClick={requestDelete} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 font-bold text-sm transition-colors border border-red-100 ml-auto"><Icon name="Trash2" size={18} /> Eliminar</button>
                    </div>
                ) : (
                    <div className="flex items-center gap-4 flex-1 animate-fade-in">
                        <div className="relative w-full max-w-md">
                            <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input type="text" placeholder={`Buscar en ${currentTab === 'active' ? 'activos' : 'archivados'}...`} className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-red outline-none transition-all" value={search} onChange={(e) => setSearch(e.target.value)} />
                        </div>
                    </div>
                )}
                {selectedIds.size === 0 && (
                    <Button onClick={() => setShowConfig(true)} className="flex items-center gap-2 bg-gray-900 text-white hover:bg-brand-red px-4 py-2 rounded-xl transition-all shadow-lg shadow-gray-900/20"><Icon name="Settings" size={18} /><span>Columnas</span></Button>
                )}
            </div>

            {/* TABLA - AQUÍ ESTÁ EL ARREGLO DEL SCROLL */}
            <div className="flex-1 min-h-0 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="overflow-y-auto overflow-x-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left border-collapse relative">
                        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-4 w-10 bg-gray-50"><input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-brand-red focus:ring-brand-red accent-brand-red cursor-pointer" checked={isAllSelected} onChange={handleSelectAll} /></th>
                                {columns.map(col => <th key={col.id} className="p-4 text-xs font-black text-gray-400 uppercase whitespace-nowrap select-none bg-gray-50">{col.header}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredProducts.map(product => (
                                <tr key={product.id} onClick={() => onEditRequest && onEditRequest(product)} className={`transition-colors cursor-pointer group ${selectedIds.has(product.id) ? 'bg-brand-red/5' : 'hover:bg-brand-red/5'}`}>
                                    <td className="p-4" onClick={(e) => e.stopPropagation()}><input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-brand-red focus:ring-brand-red accent-brand-red cursor-pointer" checked={selectedIds.has(product.id)} onChange={() => handleSelectOne(product.id)} /></td>
                                    {columns.map(col => <td key={`${product.id}-${col.id}`} className="p-4">{renderCell(product, col.field)}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredProducts.length === 0 && <div className="flex flex-col items-center justify-center h-64 text-gray-400"><Icon name={currentTab === 'active' ? "PackageX" : "Archive"} size={48} className="mb-2 opacity-20" /><p>{currentTab === 'active' ? 'No hay productos activos.' : 'No hay productos archivados.'}</p></div>}
                </div>
            </div>
        </div>
    );
};

export default InventoryView;