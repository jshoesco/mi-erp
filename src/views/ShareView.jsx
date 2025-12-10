import React, { useState, useEffect, useRef, useMemo } from 'react';
import useCollection from '../hooks/useCollection';
import { useUI } from '../context/UIContext';
import { db, doc, updateDoc } from '../lib/firebase';
import { formatCurrency, copyToClipboard } from '../lib/utils';
import Button from '../components/Button';
import Icon from '../components/Icon';

const ShareView = () => {
    const { data: products } = useCollection('productos');
    const { notify } = useUI();
    
    const [viewMode, setViewMode] = useState('focus'); 
    const [index, setIndex] = useState(0);
    const [sortType, setSortType] = useState('brand_model_asc'); 
    const [queue, setQueue] = useState([]);
    
    const dragItem = useRef(null);
    const dragOverItem = useRef(null);

    useEffect(() => {
        if (products.length > 0) {
            const pending = products.filter(p => !p.compartido && p.status === 'Activo');
            if (queue.length === 0 && pending.length > 0) {
                applySort(pending, sortType);
            }
        }
    }, [products]);

    const applySort = (list, criteria) => {
        let sorted = [...list];
        switch (criteria) {
            case 'price_asc': sorted.sort((a, b) => (Number(a.precio)||0) - (Number(b.precio)||0)); break;
            case 'price_desc': sorted.sort((a, b) => (Number(b.precio)||0) - (Number(a.precio)||0)); break;
            case 'date_asc': sorted.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0)); break;
            case 'date_desc': sorted.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)); break;
            case 'brand_model_asc': 
                sorted.sort((a, b) => {
                    const brandCompare = (a.marca || '').localeCompare(b.marca || '');
                    if (brandCompare !== 0) return brandCompare;
                    return (a.modelo || '').localeCompare(b.modelo || '');
                });
                break;
            default: break;
        }
        setQueue(sorted);
        setIndex(0); 
    };

    const handleSortChange = (e) => {
        const newSort = e.target.value;
        setSortType(newSort);
        const pending = products.filter(p => !p.compartido && p.status === 'Activo');
        applySort(pending, newSort);
        notify("Lista reordenada");
    };

    const handleSort = () => {
        let _queue = [...queue];
        const draggedItemContent = _queue.splice(dragItem.current, 1)[0];
        _queue.splice(dragOverItem.current, 0, draggedItemContent);
        dragItem.current = null;
        dragOverItem.current = null;
        setQueue(_queue);
        setIndex(0); 
    };

    const current = queue[index];

    // --- ACCIONES ---
    const markAsShared = async (productToShare = current) => { 
        if (productToShare) { 
            updateDoc(doc(db, 'productos', productToShare.id), { compartido: true }); 
            
            // Eliminación visual inmediata
            const newQueue = queue.filter(p => p.id !== productToShare.id);
            setQueue(newQueue);
            
            // Avanzar automáticamente sin romper índice
            if (index >= newQueue.length) {
                setIndex(Math.max(0, newQueue.length - 1));
            }
            notify("¡Compartido! Siguiente...");
        } 
    };

    const skipProduct = () => {
        if (index < queue.length - 1) setIndex(prev => prev + 1);
        else setIndex(0); 
    };

    const jumpToProduct = (newIndex) => {
        setIndex(newIndex);
        setViewMode('focus'); 
    };

    // --- FUNCIÓN DE COPIADO DE IMAGEN BLINDADA ---
    const copyImage = async (prod = current) => { 
        if (!prod?.imagen) return notify("No hay imagen", "error"); 
        
        try {
            notify("Procesando imagen...", "info");

            // 1. Descargar la imagen original como Blob
            // Usamos 'cache: no-store' para evitar 404 por caché corrupto
            const response = await fetch(prod.imagen, { cache: 'no-store', mode: 'cors' });
            if (!response.ok) throw new Error("Error al descargar");
            const originalBlob = await response.blob();

            // 2. Crear un Bitmap (más rápido que Image)
            const bitmap = await createImageBitmap(originalBlob);

            // 3. Dibujar en Canvas para convertir formato
            const canvas = document.createElement('canvas');
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(bitmap, 0, 0);

            // 4. Exportar como PNG (El único formato universalmente soportado por clipboard)
            canvas.toBlob(async (pngBlob) => {
                try {
                    if (!pngBlob) throw new Error("Error al convertir a PNG");
                    
                    // 5. Escribir al portapapeles
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': pngBlob })
                    ]);
                    notify("Imagen copiada al portapapeles");
                } catch (err) {
                    console.error(err);
                    notify("Tu navegador bloqueó el copiado automático", "error");
                    window.open(prod.imagen, '_blank');
                }
            }, 'image/png', 1.0);

        } catch (e) {
            console.error("Fallo copiado:", e);
            notify("Error copiando. Abriendo imagen...", "info");
            window.open(prod.imagen, '_blank');
        }
    };

    const copyInfo = async (prod = current) => { 
        // Formato ajustado: Marca > Modelo > Género > SKU > Precio
        const text = `Marca: ${prod.marca}\nModelo: ${prod.modelo}\nGénero: ${prod.genero}\nSKU: ${prod.sku}\n🔥 Precio: ${formatCurrency(prod.precio)}`;
        
        await copyToClipboard(text); 
        notify("Texto copiado!"); 
    };

    if (queue.length === 0) return (
        <div className="h-full flex flex-col items-center justify-center text-gray-400 animate-pulse">
            <Icon name="CheckCircle" size={80} className="mb-6 text-emerald-500" />
            <h2 className="text-2xl font-bold text-gray-800">¡Todo compartido!</h2>
            <p className="text-sm">No hay productos pendientes en la cola.</p>
            <button onClick={() => applySort(products.filter(p => !p.compartido && p.status === 'Activo'), sortType)} className="mt-4 text-xs text-indigo-600 underline">Recargar lista</button>
        </div>
    );

    return (
        <div className="h-full flex flex-col fade-in pb-20 md:pb-0">
            <div className="flex justify-between items-center mb-4 px-1 gap-4">
                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200 shrink-0">
                    <button onClick={() => setViewMode('focus')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'focus' ? 'bg-brand-dark text-white shadow-md' : 'text-gray-500 hover:text-brand-red'}`}><Icon name="Maximize" size={16}/> Enfoque</button>
                    <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'list' ? 'bg-brand-dark text-white shadow-md' : 'text-gray-500 hover:text-brand-red'}`}><Icon name="List" size={16}/> Gestionar Cola <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] ml-1">{queue.length}</span></button>
                </div>
                <div className="flex-1 max-w-xs">
                    <select className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-brand-red font-medium text-gray-600 shadow-sm" value={sortType} onChange={handleSortChange}>
                        <option value="brand_model_asc">🔤 Marca + Modelo (A-Z)</option>
                        <option value="date_desc">📅 Más Nuevos Primero</option>
                        <option value="date_asc">📅 Más Viejos Primero</option>
                        <option value="price_desc">💰 Precio: Alto a Bajo</option>
                        <option value="price_asc">💰 Precio: Bajo a Alto</option>
                    </select>
                </div>
            </div>

            {viewMode === 'focus' && current && (
                <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50 rounded-2xl border border-gray-200 relative">
                    <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 relative group my-auto">
                        <button onClick={skipProduct} className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-all" title="Ver Siguiente"><Icon name="SkipForward" size={20} /></button>
                        <div className="relative h-80 bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                            {current.imagen ? <img src={current.imagen} className="w-full h-full object-contain p-4 mix-blend-multiply" alt="Producto" /> : <Icon name="Image" size={64} className="text-gray-300" />}
                        </div>
                        <div className="p-8">
                            <div className="mb-6"><h2 className="text-3xl font-black text-gray-900 mb-1 leading-tight">{current.modelo}</h2><p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{current.marca} • {current.genero}</p></div>
                            <div className="flex justify-between items-center mb-8 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <div className="flex flex-col"><span className="text-[10px] font-bold text-gray-400 uppercase">SKU INTERNO</span><span className="font-mono font-bold text-indigo-600 text-lg">{current.sku}</span></div>
                                <div className="text-right"><span className="text-[10px] font-bold text-gray-400 uppercase">PRECIO VENTA</span><span className="font-black text-3xl text-brand-red">{formatCurrency(current.precio)}</span></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <Button variant="secondary" onClick={() => copyImage(current)} icon="Image" className="h-12 border-gray-300">Copiar Foto</Button>
                                <Button variant="secondary" onClick={() => copyInfo(current)} icon="Copy" className="h-12 border-gray-300">Copiar Texto</Button>
                            </div>
                            <Button onClick={() => markAsShared(current)} className="w-full h-14 text-lg bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-500/30"><Icon name="Check" size={24}/> Marcar como Compartido</Button>
                        </div>
                    </div>
                    <p className="mt-6 text-xs text-gray-400 font-medium">Producto {index + 1} de {queue.length}</p>
                </div>
            )}

            {viewMode === 'list' && (
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                    <div className="p-3 bg-red-50 text-brand-red text-xs font-bold text-center border-b border-red-100"><Icon name="Move" size={12} className="mr-1 inline"/> Arrastra las filas para cambiar el orden manualmente</div>
                    <div className="overflow-auto flex-1 p-2">
                        <table className="w-full text-sm text-left border-separate border-spacing-y-2">
                            <thead className="text-gray-500 text-xs uppercase"><tr><th className="p-2 w-10"></th><th className="p-2">Producto</th><th className="p-2 text-right">Precio</th><th className="p-2 text-center">Acciones</th></tr></thead>
                            <tbody>
                                {queue.map((p, i) => (
                                    <tr key={p.id} className="bg-white hover:bg-gray-50 group shadow-sm rounded-lg transition-all" draggable onDragStart={(e) => (dragItem.current = i)} onDragEnter={(e) => (dragOverItem.current = i)} onDragEnd={handleSort} onDragOver={(e) => e.preventDefault()}>
                                        <td className="p-2 text-center cursor-move text-gray-300 hover:text-gray-500 rounded-l-lg border-l border-y border-gray-100"><Icon name="GripVertical" size={16}/></td>
                                        <td className="p-2 border-y border-gray-100 flex items-center gap-3"><div className="font-bold text-gray-400 w-6 text-center">{i + 1}.</div><img src={p.imagen || 'https://via.placeholder.com/40'} className="w-10 h-10 rounded-lg object-cover bg-gray-100 border border-gray-200" /><div><div className="font-bold text-gray-800">{p.modelo}</div><div className="text-xs text-gray-500">{p.marca} ({p.sku})</div></div></td>
                                        <td className="p-2 text-right font-mono font-bold text-gray-700 border-y border-gray-100">{formatCurrency(p.precio)}</td>
                                        <td className="p-2 text-center rounded-r-lg border-r border-y border-gray-100"><div className="flex justify-center gap-2"><button onClick={() => jumpToProduct(i)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg border border-indigo-100" title="Presentar Ahora"><Icon name="Play" size={16}/></button><button onClick={() => markAsShared(p)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-emerald-100" title="Marcar Listo"><Icon name="Check" size={16}/></button></div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShareView;