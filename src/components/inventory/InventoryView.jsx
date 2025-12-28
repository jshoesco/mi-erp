import React from 'react';
import { useInventory } from './hooks/useInventory';
import { useUI } from '../../context/UIContext';
import { HeaderPortal } from '../ui/HeaderPortal';
import DynamicTable from '../ui/DynamicTable';
import ProductModal from './modals/ProductModal';
import InventorySettingsModal from './modals/InventorySettingsModal';
import { Button } from '../ui/display/Button';
import Icon, { Spinner } from '../ui/display/Icon';
import { TextLabel } from '../ui/display/Typography';
import { TOKENS } from '../../theme/constants';
import Checkbox from '../ui/Checkbox';

const InventoryView = () => {
    const {
        products, loading, modals, ui, handleSave, showArchived,
        setShowArchived, columns, availableKeys, selectedIds, toggleSelect, toggleAll,
        handleBatchAction, setColumns, saveConfig,
        proveedores, lineas, mapping
    } = useInventory();

    const { notify } = useUI();

    if (loading) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-brand-light">
            <Spinner size={40} className="text-brand-red mb-4" />
            <TextLabel className="animate-pulse">Sincronizando Inventario</TextLabel>
        </div>
    );

    return (
        <div className={`flex flex-col h-full ${TOKENS.animation?.fade || 'animate-fade-in'}`}>
            <HeaderPortal>
                <div className={`flex items-center bg-brand-light p-1 ${TOKENS.radius.inner} border border-brand-light shadow-inner`}>
                    <button
                        onClick={() => setShowArchived(!showArchived)}
                        className={`px-6 py-2 ${TOKENS.radius.button} transition-all flex items-center gap-2 ${showArchived ? 'bg-brand-red text-white shadow-float' : 'text-brand-gray/60 hover:text-brand-red'}`}
                    >
                        <Icon name={showArchived ? "ArrowLeft" : "Archive"} size={16} />
                        <span className={TOKENS.text.tiny}>{showArchived ? 'VOLVER' : 'ARCHIVADOS'}</span>
                    </button>
                    <div className="w-[1px] h-4 bg-brand-gray/10 mx-2" />
                    <button onClick={ui.openColumns} className="p-2 text-brand-gray/30 hover:text-brand-dark">
                        <Icon name="Settings" size={18} />
                    </button>
                </div>

                {selectedIds.length > 0 && (
                    <div className="flex items-center gap-2 animate-slide-up">
                        <button
                            onClick={() => handleBatchAction('archive')}
                            className={`p-3 bg-brand-light text-brand-gray ${TOKENS.radius.inner} border border-brand-light hover:bg-white transition-all`}
                        >
                            <Icon name="Archive" size={18} />
                        </button>
                        <button
                            onClick={() => handleBatchAction('delete')}
                            className={`p-3 bg-red-50 text-brand-red ${TOKENS.radius.inner} border border-red-100 hover:bg-red-100 transition-all`}
                        >
                            <Icon name="Trash2" size={18} />
                        </button>
                    </div>
                )}

                <Button onClick={() => ui.openProduct()} variant="brand" className="px-8 h-12" icon="Plus">
                    REGISTRAR PRODUCTO
                </Button>
            </HeaderPortal>

            <div className={`flex-1 bg-brand-surface ${TOKENS.radius.container} ${TOKENS.spacing.view} ${TOKENS.action.shadow} border border-brand-light overflow-hidden mt-6 flex flex-col`}>
                <div className="flex items-center gap-4 mb-6 px-4">
                    <Checkbox
                        checked={selectedIds.length === products.length && products.length > 0}
                        onChange={toggleAll}
                        label={`Seleccionar Todos (${selectedIds.length})`}
                    />
                </div>

                <div className="flex-1 overflow-hidden">
                    <DynamicTable
                        data={products}
                        columns={columns}
                        onEdit={ui.openProduct}
                        onSelect={toggleSelect}
                        selectedIds={selectedIds}
                    />
                </div>
            </div>

            <ProductModal
                isOpen={modals.product.open}
                onClose={ui.closeProduct}
                initialData={modals.product.data}
                onSave={handleSave}
                allProducts={products}
                mapping={mapping}
            />

            <InventorySettingsModal
                isOpen={modals.columns.open}
                onClose={ui.closeColumns}
                columns={columns}
                setColumns={setColumns}
                availableKeys={availableKeys}
                saveColumnsConfig={saveConfig}
                providers={proveedores}
                lineas={lineas}
                notify={notify}
                mapping={mapping}
            />
        </div>
    );
};

export default InventoryView;