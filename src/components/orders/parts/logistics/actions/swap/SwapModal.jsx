import React, { useState } from 'react';
import ModalLayout from '../../../../../ui/layout/ModalLayout';
import { Button } from '../../../../../ui/display/Button';
import Input from '../../../../../ui/forms/Input';
import { SCHEMA } from '../../../../../../constants/schema';

export const SwapModal = ({ isOpen, onClose, activeGroup, onConfirm }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]); // <--- ESTADO PARA RESULTADOS REALES
    const [selectedProduct, setSelectedProduct] = useState(null);

    const S = SCHEMA.ORDERS;
    const P = SCHEMA.PRODUCTS;

    const handleSearch = () => {
        // AQUÍ CONECTARÁS TU HOOK DE BÚSQUEDA REAL
        // Por ahora, simulamos que encuentra algo para que veas cómo se selecciona
        console.log("Buscando:", searchTerm);
        // setResults(tuDataDeProductos); 
    };

    const handleConfirm = () => {
        if (!selectedProduct) return alert("Selecciona un nuevo producto de la lista");
        onConfirm({ newProduct: selectedProduct });
    };

    if (!isOpen) return null;

    return (
        <ModalLayout isOpen={isOpen} onClose={onClose} title="Cambio de Producto (Swap)">
            <div className="p-4 space-y-4">
                {/* INFO PRODUCTO ACTUAL - USANDO SCHEMA */}
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
                    <p className="text-[10px] font-black text-amber-600 uppercase">
                        {S.ITEM.SKU.toUpperCase()} ACTUAL
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                        {activeGroup?.order[S.ITEMS][activeGroup?.itemIndex][S.ITEM.SKU]}
                    </p>
                </div>

                {/* BUSCADOR */}
                <div className="space-y-2">
                    <Input
                        label="Buscar Nuevo Producto (SKU o Nombre)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Ej: BOTA-CAT-01"
                    />
                    <Button variant="secondary" onClick={handleSearch} className="w-full text-[10px] font-black uppercase">
                        Buscar en Inventario
                    </Button>
                </div>

                {/* LISTA DE RESULTADOS REAL */}
                <div className="max-h-60 overflow-y-auto border border-slate-100 rounded-xl p-1 space-y-1">
                    {results.length > 0 ? (
                        results.map((product) => (
                            <div
                                key={product[P.SKU]}
                                onClick={() => setSelectedProduct(product)}
                                className={`p-2 rounded-lg cursor-pointer flex justify-between items-center transition-all ${selectedProduct?.[P.SKU] === product[P.SKU]
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                                    }`}
                            >
                                <div className="text-[10px] font-bold uppercase">{product[P.SKU]}</div>
                                <div className="text-[10px] font-black">${product[P.PRICE]?.toLocaleString()}</div>
                            </div>
                        ))
                    ) : (
                        <p className="text-[10px] text-center py-8 text-slate-400 font-bold uppercase italic">
                            Digita el SKU y presiona buscar
                        </p>
                    )}
                </div>

                {/* ACCIONES */}
                <div className="flex gap-2 pt-2">
                    <Button variant="secondary" className="flex-1 uppercase font-black" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        className="flex-1 font-black uppercase"
                        onClick={handleConfirm}
                        disabled={!selectedProduct}
                    >
                        Confirmar Cambio
                    </Button>
                </div>
            </div>
        </ModalLayout>
    );
};