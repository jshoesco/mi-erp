import { useState, useMemo } from 'react';
import { useData } from '../../../../../../../context/DataContext';
import { SCHEMA } from '../../../../../../../constants/schema';

export const useOrderItemsLogic = (items, setItems) => {
    const { products } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeIndex, setActiveIndex] = useState(null);

    // Mapeo de Schemas
    const I = SCHEMA.ORDERS.ITEM;    // Campos del ítem en el pedido (Destino)
    const P = SCHEMA.PRODUCTS;       // Campos del producto en el inventario (Origen)

    const productSuggestions = useMemo(() => {
        if (!searchTerm || searchTerm.length < 1 || !products) return [];
        const query = searchTerm.toLowerCase().trim();

        return products.filter(p => {
            // Buscamos usando las llaves del SCHEMA de productos
            return [P.SKU, P.REF, P.BRAND, P.VERSION].some(key =>
                (String(p[key] || "")).toLowerCase().includes(query)
            );
        }).slice(0, 5);
    }, [products, searchTerm, P]);

    const handleAddItem = (product) => {
        const newItem = {
            id: `${product[P.SKU] || 'no-sku'}-${Date.now()}`,
            [I.UNIQUE_ID]: crypto.randomUUID(),
            [I.SKU]: product[P.SKU] || '',
            [I.MODEL]: product[P.REF] || product[P.VERSION] || 'Sin especificar',
            [I.TALLA]: '',
            [I.QTY]: 1,
            [I.COST]: Number(product[P.COST] || 0),
            [I.PRICE]: Number(product[P.PRICE] || 0),
            [I.IMAGE]: product[P.IMAGE] || '',
            // ESTRICTO SCHEMA: Busca la llave definida en SCHEMA.PRODUCTS en el objeto 'product'
            [I.PROVIDER]: product[P.PROVIDER] || 'SIN PROVEEDOR',
            [I.PROVIDER_ID]: product[P.PROVIDER_ID] || ''
        };

        setItems([...items, newItem]);
        setSearchTerm('');
        setActiveIndex(null);
    };

    const handleUpdateItem = (id, fieldSchemaKey, value) => {
        setItems(items.map(it => {
            if (it.id === id) {
                const isNumeric = [I.QTY, I.COST, I.PRICE].includes(fieldSchemaKey);
                return {
                    ...it,
                    [fieldSchemaKey]: isNumeric ? (Number(value) || 0) : value
                };
            }
            return it;
        }));
    };

    const handleRemoveItem = (id) => {
        setItems(items.filter(it => it.id !== id));
    };

    return {
        searchTerm,
        setSearchTerm,
        productSuggestions,
        handleAddItem,
        handleUpdateItem,
        handleRemoveItem,
        activeIndex,
        setActiveIndex
    };
};