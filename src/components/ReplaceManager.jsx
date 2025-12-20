import React, { useState } from 'react';
import Modal from './Modal';
import SafeImg from './SafeImg';
import Button from './Button';

const ReplaceManager = ({ 
    isOpen, 
    onClose, 
    similarProducts, 
    newProduct, 
    onReplace, 
    notify 
}) => {
    const [visualCompare, setVisualCompare] = useState(null);

    const handleReplaceAction = (oldProduct) => {
        onReplace(oldProduct.id);
        setVisualCompare(null);
        onClose();
        notify?.(`Sustituido: ${oldProduct.modelo}`);
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="Comparar existente">
                <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
                    {similarProducts.map(p => (
                        <div 
                            key={p.id} 
                            className="border p-3 rounded-xl flex flex-col gap-3 hover:border-brand-red transition-all cursor-pointer group"
                            onClick={() => setVisualCompare(p)}
                        >
                            <SafeImg src={p.imagen} className="h-40 object-contain bg-gray-50 rounded-lg" />
                            <div className="text-center font-bold text-sm">
                                {p.marca} {p.modelo}<br/>
                                <span className="text-[10px] text-gray-400">{p.sku}</span>
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleReplaceAction(p); }} 
                                className="w-full bg-gray-900 text-white text-[10px] font-bold py-2 rounded-lg uppercase hover:bg-brand-red transition-colors"
                            >
                                Sustituir con este
                            </button>
                        </div>
                    ))}
                </div>
            </Modal>

            {visualCompare && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col p-4 animate-fade-in" onClick={() => setVisualCompare(null)}>
                    <div className="flex-1 flex gap-4 items-center justify-center">
                        {/* EXISTENTE */}
                        <div className="flex-1 bg-neutral-900 h-full rounded-2xl flex flex-col items-center justify-center p-8 border border-white/10">
                            <span className="text-red-400 text-xs font-black mb-4 uppercase tracking-widest">Producto Existente</span>
                            <SafeImg src={visualCompare.imagen} className="h-3/4 object-contain mb-4" />
                            <h3 className="text-white font-bold text-xl">{visualCompare.marca} {visualCompare.modelo}</h3>
                            <p className="text-gray-500 font-mono text-sm">{visualCompare.sku}</p>
                        </div>

                        {/* NUEVO */}
                        <div className="flex-1 bg-neutral-800 h-full rounded-2xl flex flex-col items-center justify-center p-8 border border-white/10">
                            <span className="text-emerald-400 text-xs font-black mb-4 uppercase tracking-widest">Nuevo Ingreso</span>
                            <SafeImg src={newProduct?.imagen} className="h-3/4 object-contain mb-4" />
                            <h3 className="text-white font-bold text-xl">{newProduct?.marca} {newProduct?.modelo}</h3>
                            <p className="text-gray-500 font-mono text-sm">{newProduct?.sku || 'Generando SKU...'}</p>
                        </div>
                    </div>
                    
                    <div className="p-8 flex justify-center gap-6">
                        <Button onClick={() => setVisualCompare(null)} variant="secondary" className="px-10 h-14 rounded-full text-white border-white/20">VOLVER</Button>
                        <Button 
                            onClick={() => handleReplaceAction(visualCompare)} 
                            className="bg-brand-red h-14 px-12 rounded-full text-lg shadow-2xl font-black"
                        >
                            CONFIRMAR REEMPLAZO
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
};

export default ReplaceManager;