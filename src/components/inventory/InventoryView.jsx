import React from 'react';
import { useInventory } from './hooks/useInventory';
import InventoryTable from './components/InventoryTable';
import ProductModal from './modals/ProductModal';
import Button from '../ui/Button';

const InventoryView = () => {
    const { products, loading, modals, ui, columns, selectedIds, handleSave } = useInventory();

    if (loading) return <div className="p-10 font-black text-gray-400">CARGANDO...</div>;

    return (
        <div className="flex flex-col h-full bg-white p-8 space-y-6">
            <header className="flex justify-between items-center">
                <h1 className="text-2xl font-black uppercase tracking-tighter">Inventario</h1>
                <Button onClick={() => ui.openProduct()} icon="Plus">Nuevo Producto</Button>
            </header>
            <InventoryTable
                products={products}
                columns={columns}
                selectedIds={selectedIds}
                onEdit={ui.openProduct}
                ui={ui}
            />
            <ProductModal
                isOpen={modals.product.open}
                onClose={ui.closeProduct}
                initialData={modals.product.data}
                onSave={handleSave}
                allProducts={products}
            />
        </div>
    );
};

export default InventoryView;