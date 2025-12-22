import React from 'react';
import { useInventory } from './hooks/useInventory';
import InventoryTable from './components/InventoryTable';
import ProductModal from './modals/ProductModal';
import InventorySettingsModal from './modals/InventorySettingsModal';
import Button from '../ui/Button';
import Icon from '../ui/Icon';

const InventoryView = () => {
    const {
        products, loading, modals, ui, handleSave, showArchived, setShowArchived,
        columns, setColumns, availableKeys, providers, lines, notify
    } = useInventory();

    if (loading) return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-white">
            <div className="w-12 h-12 border-4 border-gray-100 border-t-brand-dark rounded-full animate-spin mb-4" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Sincronizando Stock</span>
        </div>
    );

    return (
        <div className="relative flex flex-col h-full bg-white p-8 space-y-8 animate-fade-in">
            <header className="flex justify-between items-end">
                <div className="space-y-3">
                    <h1 className="text-3xl font-black uppercase italic text-gray-900 tracking-tighter leading-none">
                        {showArchived ? 'Archivo' : 'Inventario'}
                    </h1>
                    <button onClick={() => setShowArchived(!showArchived)} className="flex items-center gap-2 text-[9px] font-black text-brand-red uppercase tracking-widest ml-1 hover:underline transition-all">
                        <Icon name={showArchived ? "ArrowLeft" : "Archive"} size={12} />
                        {showArchived ? 'Volver al Activo' : 'Ver Archivados'}
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={ui.openColumns} className="p-4 text-gray-400 hover:text-brand-dark bg-gray-50 rounded-2xl border border-gray-100 transition-all">
                        <Icon name="Settings" size={20} />
                    </button>
                    <Button onClick={() => ui.openProduct()} className="bg-brand-dark text-white px-8 h-14 rounded-2xl font-black text-[11px] tracking-widest shadow-xl">
                        + REGISTRAR PRODUCTO
                    </Button>
                </div>
            </header>

            <div className="flex-1 min-h-0">
                <InventoryTable products={products} columns={columns} onEdit={ui.openProduct} />
            </div>

            <ProductModal isOpen={modals.product.open} onClose={ui.closeProduct} initialData={modals.product.data} onSave={handleSave} providers={providers} lines={lines} />

            <InventorySettingsModal isOpen={modals.columns.open} onClose={ui.closeColumns} columns={columns} setColumns={setColumns} availableKeys={availableKeys} providers={providers} lines={lines} notify={notify} />
        </div>
    );
};

export default InventoryView;