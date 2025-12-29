import React from 'react';
import ItemRow from './parts/ItemRow';
import { useEditorLogic } from './logic/useEditorLogic';

const ItemsEditorList = ({ items, setItems }) => {
    const { keys, handlers } = useEditorLogic(items, setItems);

    return (
        <div className="space-y-2">
            {items.length > 0 ? (
                items.map((item) => (
                    <ItemRow
                        key={item[keys.UNIQUE_ID] || item.id}
                        item={item}
                        keys={keys}
                        onUpdate={handlers.onUpdate}
                        onRemove={handlers.onRemove}
                    />
                ))
            ) : (
                <div className="py-10 border-2 border-dashed border-slate-100 rounded-3xl text-center text-[10px] font-black text-slate-300 uppercase">
                    No hay productos agregados
                </div>
            )}
        </div>
    );
};

export default ItemsEditorList;