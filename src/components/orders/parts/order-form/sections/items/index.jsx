import React from 'react';
import ProductSearch from './parts/search'; // Ajusta la ruta según tu carpeta
import ItemsEditorList from './parts/editor';
import { SCHEMA } from '../../../../../../constants/schema';

const OrderItemsEditor = ({ items = [], setItems }) => {
    const onAddItem = (product) => {
        const I = SCHEMA.ORDERS.ITEM;
        const P = SCHEMA.PRODUCTS;
        const newItem = {
            id: `${product[P.SKU]}-${Date.now()}`,
            [I.UNIQUE_ID]: crypto.randomUUID(),
            [I.SKU]: product[P.SKU] || '',
            [I.MODEL]: product[P.REF] || product[P.VERSION] || 'Sin especificar',
            [I.TALLA]: '',
            [I.QTY]: 1,
            [I.COST]: Number(product[P.COST] || 0),
            [I.PRICE]: Number(product[P.PRICE] || 0),
            [I.PROVIDER]: product[P.PROVIDER] || 'SIN PROVEEDOR'
        };
        setItems([...items, newItem]);
    };

    return (
        <div className="space-y-4">
            <ProductSearch onAdd={onAddItem} />
            <ItemsEditorList items={items} setItems={setItems} />
        </div>
    );
};

export default OrderItemsEditor;