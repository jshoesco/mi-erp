import { SCHEMA } from '../../../../../../../../../constants/schema';

export const useEditorLogic = (items, setItems) => {
    const I = SCHEMA.ORDERS.ITEM;

    const onUpdate = (id, key, val) => {
        setItems(items.map(it => (it[I.UNIQUE_ID] === id || it.id === id) ? {
            ...it,
            [key]: [I.QTY, I.COST, I.PRICE].includes(key) ? (Number(val) || 0) : val
        } : it));
    };

    const onRemove = (id) => {
        setItems(items.filter(it => (it[I.UNIQUE_ID] !== id && it.id !== id)));
    };

    return {
        keys: I,
        handlers: { onUpdate, onRemove }
    };
};