import React from 'react';
import { useInventory } from './hooks/useInventory';
import InventoryTable from './components/InventoryTable';
import ProductModal from './modals/ProductModal';
import ColumnConfigModal from './modals/ColumnConfigModal';
import Button from '../ui/Button';
import ActionBar from '../ui/ActionBar';
import { IconSettings } from '@tabler/icons-react';

const InventoryView = () => {
    const { 
        products, loading, modals, ui, handleSave, selectedIds, toggleSelect, toggleAll, 
        clearSelection, showArchived, setShowArchived, inventoryActions,
        columns, setColumns, availableKeys, reorderColumns 
    } = useInventory();

    if (loading) return <div className="p-10 font-black text-gray-400 text-center uppercase">Cargando...</div>;

    return (
        <div className="relative flex flex-col h-full bg-white p-8 space-y-6">
            <header className="flex justify-between items-center">
                <div className="flex flex-col">
                    <h1 className="text-2xl font-black uppercase italic tracking-tighter leading-none">
                        {showArchived ? 'Archivo' : 'Inventario'}
                    </h1>
                    <button onClick={() => { setShowArchived(!showArchived); clearSelection(); }} className="text-[9px] font-black text-brand-red uppercase tracking-[0.2em] mt-2 text-left hover:underline">
                        {showArchived ? '← Volver al Activo' : 'Ver Archivados →'}
                    </button>
                </div>
                
                <div className="flex items-center gap-3">
                    <button onClick={ui.openColumns} className="p-2.5 text-gray-400 hover:text-brand-red transition-colors bg-gray-50 rounded-xl border border-gray-100">
                        <IconSettings size={20} />
                    </button>
                    <Button onClick={() => ui.openProduct()} icon="Plus">Nuevo Producto</Button>
                </div>
            </header>

            <InventoryTable products={products} selectedIds={selectedIds} toggleSelect={toggleSelect} toggleAll={toggleAll} onEdit={ui.openProduct} columns={columns} />

            <ProductModal isOpen={modals.product.open} onClose={ui.closeProduct} initialData={modals.product.data} onSave={handleSave} allProducts={products} />

            <ColumnConfigModal isOpen={modals.columns.open} onClose={ui.closeColumns} columns={columns} setColumns={setColumns} availableKeys={availableKeys} reorderColumns={reorderColumns} />

            <ActionBar count={selectedIds.length} onClear={clearSelection} actions={inventoryActions} />
        </div>
    );
};

export default InventoryView;