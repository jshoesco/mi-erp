import React from 'react';
import { Button } from '../../../../../../../../ui/display/Button';
import { Input } from '../../../../../../../../ui/forms/Input';
import Icon from '../../../../../../../../ui/display/Icon';

const ItemRow = ({ item, keys, onUpdate, onRemove }) => (
    <div className="bg-white border p-3 rounded-2xl flex gap-3 items-end shadow-sm">
        <div className="flex-1 grid grid-cols-5 gap-2">
            <Input label="Modelo" value={item[keys.MODEL]} readOnly className="bg-slate-50" />
            <Input label="Talla" value={item[keys.TALLA]} onChange={(e) => onUpdate(item.id, keys.TALLA, e.target.value)} />
            <Input label="Cant" type="number" value={item[keys.QTY]} onChange={(e) => onUpdate(item.id, keys.QTY, e.target.value)} />
            <Input label="Costo" type="number" value={item[keys.COST]} onChange={(e) => onUpdate(item.id, keys.COST, e.target.value)} />
            <Input label="Precio" type="number" value={item[keys.PRICE]} onChange={(e) => onUpdate(item.id, keys.PRICE, e.target.value)} />
        </div>
        <Button
            onClick={() => onRemove(item[keys.UNIQUE_ID] || item.id)}
            className="text-slate-300 hover:text-red-500"
        >
            <Icon name="trash" size={16} />
        </Button>
    </div>
);
export default ItemRow;