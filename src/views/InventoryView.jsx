import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { deleteFromCloudinary } from '../lib/utils';
import { Spinner } from '../components/Icon';
import ColumnConfigModal from '../components/ColumnConfigModal';
import ConfirmModal from '../components/ConfirmModal';
import ImportModal from '../components/ImportModal';
import ExportConfigModal from '../components/ExportConfigModal'; // Import nuevo

// COMPONENTES MODULARES
import ProductModal from '../components/ProductModal';
import InventoryFilters from '../components/InventoryFilters';
import ReplaceManager from '../components/ReplaceManager';
import InventoryHeader from '../components/InventoryHeader';
import InventoryTable from '../components/InventoryTable';

const DEFAULT_COLUMNS = [
    { id: 'def1', header: 'Producto', field: 'imagen' },
    { id: 'def2', header: 'Nombre / Ref', field: 'nombre' },
    { id: 'def3', header: 'SKU', field: 'sku' },
    { id: 'def4', header: 'Precio Venta', field: 'precio' },
    { id: 'def5', header: 'Estado', field: 'status' },
];

const parseInputNumber = (val) => {
    if (!val) return 0;
    return Number(val.toString().replace(/\./g, ""));
};

const InventoryView = () => {
    const { products = [], loading, providers = [], config = [], shipping = [], updateProduct, deleteProduct, notify } = useData();

    const [currentTab, setCurrentTab] = useState('active');
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [filterText, setFilterText] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({ linea: '', proveedor: '', minPrice: '', maxPrice: '', daysAgo: '' });

    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [replaceModalOpen, setReplaceModalOpen] = useState(false);
    const [similarProducts, setSimilarProducts] = useState([]);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', action: null, type: 'danger' });
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    const [columns, setColumns] = useState(() => {
        const saved = localStorage.getItem('inventory_columns');
        return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
    });

    useEffect(() => { localStorage.setItem('inventory_columns', JSON.stringify(columns)); }, [columns]);

    const getDaysDiff = (dateString) => {
        if (!dateString) return null;
        const created = new Date(dateString);
        const now = new Date();
        created.setHours(0, 0, 0, 0); now.setHours(0, 0, 0, 0);
        return Math.floor((now - created) / 86400000);
    };

    const availableOptions = useMemo(() => {
        const getFilteredFor = (excludeField) => products.filter(p => {
            const isArchived = p.status === 'archivado' || p.status === 'Reemplazado';
            if (currentTab === 'active' ? isArchived : !isArchived) return false;
            if (excludeField !== 'linea' && filters.linea && (p.linea || p.line) !== filters.linea) return false;
            if (excludeField !== 'proveedor' && filters.proveedor && p.proveedor_uid !== filters.proveedor) return false;
            if (excludeField !== 'daysAgo' && filters.daysAgo !== '' && getDaysDiff(p.fecha) !== Number(filters.daysAgo)) return false;
            return true;
        });
        return {
            lineas: [...new Set(getFilteredFor('linea').map(p => p.linea || p.line))].filter(Boolean),
            proveedores: providers.filter(pr => [...new Set(getFilteredFor('proveedor').map(p => p.proveedor_uid))].includes(pr.id)),
            fechas: Array.from(getFilteredFor('daysAgo').reduce((map, p) => {
                const days = getDaysDiff(p.fecha);
                if (days !== null && !map.has(days)) map.set(days, days === 0 ? 'Hoy' : days === 1 ? 'Ayer' : `Hace ${days} días`);
                return map;
            }, new Map()).entries()).sort((a, b) => a[0] - b[0]).map(([v, l]) => ({ value: v.toString(), label: l }))
        };
    }, [products, filters, currentTab, providers]);

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = (p.nombre || '').toLowerCase().includes(filterText.toLowerCase()) || (p.sku || '').toLowerCase().includes(filterText.toLowerCase());
            const isArchived = p.status === 'archivado' || p.status === 'Reemplazado';
            const matchesTab = currentTab === 'active' ? !isArchived : isArchived;
            const matchesLine = !filters.linea || (p.linea || p.line) === filters.linea;
            const matchesProv = !filters.proveedor || p.proveedor_uid === filters.proveedor;
            const matchesMinP = !filters.minPrice || Number(p.precio) >= parseInputNumber(filters.minPrice);
            const matchesMaxP = !filters.maxPrice || Number(p.precio) <= parseInputNumber(filters.maxPrice);
            const matchesDays = filters.daysAgo === '' || getDaysDiff(p.fecha) === Number(filters.daysAgo);
            return matchesSearch && matchesTab && matchesLine && matchesProv && matchesMinP && matchesMaxP && matchesDays;
        });
    }, [products, filterText, currentTab, filters]);

    if (loading) return <div className="p-10 flex justify-center"><Spinner /></div>;

    return (
        <div className="flex flex-col h-full space-y-4 relative">
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(p => ({ ...p, isOpen: false }))}
                onConfirm={confirmModal.action}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
            />

            <InventoryHeader 
    currentTab={currentTab} 
    setCurrentTab={setCurrentTab} 
    onNewProduct={() => { setSelectedProduct(null); setIsProductModalOpen(true); }}
    setSelectedIds={setSelectedIds}
    products={filteredProducts}
    onExportClick={() => setIsExportModalOpen(true)} // Nueva prop
    onImportClick={() => setIsImportModalOpen(true)} 
/>

            <InventoryFilters
                filterText={filterText} setFilterText={setFilterText}
                showFilters={showFilters} setShowFilters={setShowFilters}
                filters={filters} setFilters={setFilters}
                availableOptions={availableOptions}
                selectedCount={selectedIds.size}
                onDeleteRequest={() => setConfirmModal({
                    isOpen: true,
                    title: '¿Eliminar?',
                    message: `Borrarás ${selectedIds.size} productos.`,
                    action: async () => {
                        await Promise.all(Array.from(selectedIds).map(async id => {
                            const p = products.find(x => x.id === id);
                            if (p?.public_id && config?.[0]) await deleteFromCloudinary(p.public_id, config[0]);
                            return deleteProduct(id);
                        }));
                        setSelectedIds(new Set());
                        setConfirmModal(p => ({ ...p, isOpen: false }));
                    }
                })}
            />

            <InventoryTable
                products={filteredProducts}
                columns={columns}
                selectedIds={selectedIds}
                setSelectedIds={setSelectedIds}
                providers={providers}
                onEdit={(p) => { setSelectedProduct(p); setIsProductModalOpen(true); }}
            />

            <ProductModal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                product={selectedProduct}
                products={products}
                providers={providers}
                config={config}
                shipping={shipping}
                notify={notify}
                updateProduct={updateProduct}
                onFormUpdate={(updatedData) => setSelectedProduct(updatedData)}
                onReplaceRequest={(similars) => {
                    setSimilarProducts(similars);
                    setReplaceModalOpen(true);
                }}
            />

            <ReplaceManager
                isOpen={replaceModalOpen}
                onClose={() => setReplaceModalOpen(false)}
                similarProducts={similarProducts}
                newProduct={selectedProduct}
                onReplace={(oldId) => updateProduct(oldId, { status: 'Reemplazado' })}
                notify={notify}
            />

            <ImportModal 
                isOpen={isImportModalOpen} 
                onClose={() => setIsImportModalOpen(false)} 
                notify={notify} 
                providers={providers} 
            />

            <ExportConfigModal 
    isOpen={isExportModalOpen} 
    onClose={() => setIsExportModalOpen(false)} 
    products={filteredProducts} 
/>
        </div>
    );
};

export default InventoryView;