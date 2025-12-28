import React from 'react';
import { Button } from '../../../../../ui/display/Button';
import { Input } from '../../../../../ui/forms/Input';
import Icon from '../../../../../ui/display/Icon';
import { useOrderItemsLogic } from './logic/useOrderItemsLogic';
import { SCHEMA } from '../../../../../../constants/schema';

const OrderItemsEditor = ({ items = [], setItems }) => {
    const logic = useOrderItemsLogic(items, setItems);

    // ATRACO AL SCHEMA: Definimos constantes para no escribir strings manuales
    const I = SCHEMA.ORDERS.ITEM;
    const P = SCHEMA.PRODUCTS;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center px-2 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                    <Icon name="shopping-cart" size={16} className="text-slate-400" />
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">Items del Pedido</span>
                </div>
            </div>

            {/* BUSCADOR GENÉRICO */}
            <div className="relative group">
                <Input
                    placeholder="BUSCAR POR SKU, NOMBRE, MARCA O PROVEEDOR..."
                    value={logic.searchTerm}
                    onChange={(e) => {
                        logic.setSearchTerm(e.target.value);
                        logic.setActiveIndex('search');
                    }}
                    onFocus={() => logic.setActiveIndex('search')}
                    onBlur={() => setTimeout(() => logic.setActiveIndex(null), 200)}
                />

                {logic.activeIndex === 'search' && logic.productSuggestions.length > 0 && (
                    <div className="absolute z-[1000] w-full bg-white border border-slate-200 shadow-2xl rounded-2xl mt-1 overflow-hidden">
                        {logic.productSuggestions.map((product, index) => (
                            <button
                                key={`suggestion-${product[P.SKU] || index}`}
                                onMouseDown={() => logic.handleAddItem(product)}
                                type="button"
                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors"
                            >
                                <div className="text-left">
                                    <div className="text-[10px] font-black uppercase text-slate-800">
                                        {product[P.BRAND]} - {product[P.VERSION] || product[P.REF]}
                                    </div>
                                    <div className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                                        SKU: {product[P.SKU]} | PROV: {product[P.PROVIDER]}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-black text-brand-dark">
                                        ${Number(product[P.PRICE]).toLocaleString()}
                                    </div>
                                    <div className="text-[8px] font-bold text-green-500 uppercase tracking-tighter">
                                        STOCK: {product[P.STOCK] || 0}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* FILAS DE PRODUCTOS - MAPEADO DINÁMICO */}
            <div className="space-y-2">
                {items.map((item) => (
                    <div
                        key={item.unique_id || item.id}
                        className="bg-white border border-slate-100 p-3 rounded-2xl flex gap-3 items-end shadow-sm"
                    >
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-2">
                            {/* NUNCA MÁS 'item.modelo'. AHORA ES 'item[I.MODEL]' */}
                            <Input
                                label="Modelo"
                                value={item[I.MODEL]}
                                readOnly
                                className="bg-slate-50"
                            />
                            <Input
                                label="Talla"
                                value={item[I.TALLA]}
                                onChange={(e) => logic.handleUpdateItem(item.id, I.TALLA, e.target.value)}
                            />
                            <Input
                                label="Cant"
                                type="number"
                                value={item[I.QTY]}
                                onChange={(e) => logic.handleUpdateItem(item.id, I.QTY, e.target.value)}
                            />
                            <Input
                                label="Costo"
                                type="number"
                                value={item[I.COST]}
                                onChange={(e) => logic.handleUpdateItem(item.id, I.COST, e.target.value)}
                            />
                            <Input
                                label="Precio Venta"
                                type="number"
                                value={item[I.PRICE]}
                                onChange={(e) => logic.handleUpdateItem(item.id, I.PRICE, e.target.value)}
                            />
                        </div>
                        <Button
                            variant="secondary"
                            className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all"
                            onClick={() => logic.handleRemoveItem(item.id)}
                        >
                            <Icon name="trash" size={16} />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OrderItemsEditor;