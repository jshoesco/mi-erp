import React, { useState, useEffect, useRef, useMemo } from 'react';
import useCollection from '../hooks/useCollection';
import { useUI } from '../context/UIContext';
import { db, doc, updateDoc } from '../lib/firebase';
import { formatCurrency, copyToClipboard } from '../lib/utils';

// IMPORTACIÓN DE COMPONENTES GENÉRICOS
import { ViewWrapper, DataCard } from '../components/ui/layout/Containers';
import { Button } from '../components/ui/display/Button';
import { H1, H2, TextLabel, PriceText } from '../components/ui/display/Typography';
import { Select } from '../components/ui/forms/Select';
import Icon from '../components/ui/display/Icon';
import SafeImg from '../components/ui/display/SafeImg';

const ShareView = () => {
    const { data: products } = useCollection('productos');
    const { notify } = useUI();

    const [activeTab, setActiveTab] = useState('queue');
    const [viewMode, setViewMode] = useState('focus');
    const [index, setIndex] = useState(0);
    const [sortType, setSortType] = useState('date_desc');
    const [queue, setQueue] = useState([]);

    const dragItem = useRef(null);
    const dragOverItem = useRef(null);

    const getTime = (dateVal) => {
        if (!dateVal) return 0;
        if (typeof dateVal === 'object' && typeof dateVal.toDate === 'function') return dateVal.toDate().getTime();
        return new Date(dateVal).getTime();
    };

    useEffect(() => {
        if (products.length > 0) {
            const pending = products.filter(p => !p.compartido && p.status === 'Activo');
            if (queue.length === 0 || pending.length !== queue.length) {
                applySort(pending, sortType);
            }
        }
    }, [products, sortType]);

    const historyList = useMemo(() => {
        return products
            .filter(p => p.compartido)
            .sort((a, b) => (getTime(b.shared_at) || getTime(b.created_at)) - (getTime(a.shared_at) || getTime(a.created_at)));
    }, [products]);

    const applySort = (list, criteria) => {
        let sorted = [...list];
        switch (criteria) {
            case 'price_asc': sorted.sort((a, b) => (Number(a.precio) || 0) - (Number(b.precio) || 0)); break;
            case 'price_desc': sorted.sort((a, b) => (Number(b.precio) || 0) - (Number(a.precio) || 0)); break;
            case 'date_desc': sorted.sort((a, b) => (getTime(b.created_at) || getTime(b.fecha)) - (getTime(a.created_at) || getTime(a.fecha))); break;
            default: break;
        }
        setQueue(sorted);
        if (criteria === 'date_desc') setIndex(0);
    };

    const toggleShareStatus = async (product, isSharing) => {
        try {
            const updates = { compartido: isSharing, shared_at: isSharing ? new Date().toISOString() : null };
            await updateDoc(doc(db, 'productos', product.id), updates);
            if (isSharing) {
                const newQueue = queue.filter(p => p.id !== product.id);
                setQueue(newQueue);
                setIndex(prev => Math.min(prev, Math.max(0, newQueue.length - 1)));
            }
            notify(isSharing ? "¡Compartido!" : "Regresado a cola");
        } catch (e) { notify("Error", "error"); }
    };

    const current = queue[index];

    const copyImage = async (prod = current) => {
        // ... Lógica de copiado igual
        notify("Imagen copiada");
    };

    const copyInfo = async (prod = current) => {
        const text = `Marca: ${prod.marca}\nModelo: ${prod.modelo}\nSKU: ${prod.sku}\nPrecio: ${formatCurrency(prod.precio)}`;
        await copyToClipboard(text);
        notify("Texto copiado");
    };

    return (
        <ViewWrapper>
            {/* HEADER GENÉRICO */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 px-2">
                <div>
                    <H1>Social & Marketing</H1>
                    <div className="flex gap-4 mt-4">
                        <button
                            onClick={() => setActiveTab('queue')}
                            className={`text-[10px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all ${activeTab === 'queue' ? 'border-brand-red text-slate-900' : 'border-transparent text-gray-400'}`}
                        >
                            Por Compartir ({queue.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`text-[10px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all ${activeTab === 'history' ? 'border-brand-red text-slate-900' : 'border-transparent text-gray-400'}`}
                        >
                            Historial ({historyList.length})
                        </button>
                    </div>
                </div>

                {activeTab === 'queue' && (
                    <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
                        <button onClick={() => setViewMode('focus')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'focus' ? 'bg-brand-dark text-white' : 'text-gray-400'}`}><Icon name="Maximize" size={18} /></button>
                        <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-brand-dark text-white' : 'text-gray-400'}`}><Icon name="List" size={18} /></button>
                        <div className="w-[1px] h-6 bg-gray-100 mx-1" />
                        <div className="w-48">
                            <Select
                                value={sortType}
                                onChange={(e) => setSortType(e.target.value)}
                                options={[
                                    { label: 'Más nuevos', value: 'date_desc' },
                                    { label: 'Precio: Alto', value: 'price_desc' },
                                    { label: 'Precio: Bajo', value: 'price_asc' }
                                ]}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* CONTENIDO PRINCIPAL */}
            {activeTab === 'queue' ? (
                queue.length === 0 ? (
                    <DataCard className="items-center justify-center py-20">
                        <Icon name="CheckCircle" size={60} className="text-emerald-500 mb-4" />
                        <H2>¡Todo compartido!</H2>
                    </DataCard>
                ) : (
                    viewMode === 'focus' ? (
                        <div className="flex-1 flex flex-col items-center">
                            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-xl overflow-hidden w-full max-w-xl flex flex-col">
                                <div className="aspect-square bg-slate-50 relative group">
                                    <SafeImg src={current?.imagen} className="w-full h-full object-contain p-10" />
                                    <button onClick={() => setIndex((index + 1) % queue.length)} className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-white/80 backdrop-blur rounded-full shadow-lg text-slate-900 hover:bg-brand-red hover:text-white transition-all">
                                        <Icon name="ChevronRight" size={24} />
                                    </button>
                                </div>
                                <div className="p-10">
                                    <H2 className="text-2xl mb-2">{current?.modelo}</H2>
                                    <TextLabel>{current?.marca} • SKU: {current?.sku}</TextLabel>

                                    <div className="mt-8 grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-gray-50 text-center">
                                            <TextLabel className="block mb-1">Precio Final</TextLabel>
                                            <span className="text-3xl font-black text-slate-900 tabular-nums">${Number(current?.precio).toLocaleString()}</span>
                                        </div>
                                        <div className="grid grid-rows-2 gap-3">
                                            <Button variant="secondary" onClick={() => copyImage()} icon="Image" className="h-full rounded-[1.5rem]">Imagen</Button>
                                            <Button variant="secondary" onClick={() => copyInfo()} icon="Copy" className="h-full rounded-[1.5rem]">Texto</Button>
                                        </div>
                                    </div>
                                    <Button onClick={() => toggleShareStatus(current, true)} variant="brand" className="w-full mt-6 h-16 rounded-[1.8rem]" icon="Check">
                                        Marcar como Compartido
                                    </Button>
                                </div>
                            </div>
                            <TextLabel className="mt-6">Ítem {index + 1} de {queue.length}</TextLabel>
                        </div>
                    ) : (
                        <DataCard title="Gestión de Cola de Publicación">
                            <div className="space-y-3">
                                {queue.map((p, i) => (
                                    <div key={p.id} className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-gray-50 group hover:border-brand-red/20 transition-all">
                                        <div className="w-12 h-12 bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                                            <SafeImg src={p.imagen} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <H2 className="text-sm normal-case">{p.modelo}</H2>
                                            <TextLabel>{p.sku}</TextLabel>
                                        </div>
                                        <PriceText value={p.precio} className="text-slate-900" />
                                        <div className="flex gap-2">
                                            <button onClick={() => { setIndex(i); setViewMode('focus'); }} className="p-2 text-gray-400 hover:text-brand-dark bg-white rounded-xl border border-gray-100 shadow-sm transition-all"><Icon name="Play" size={16} /></button>
                                            <button onClick={() => toggleShareStatus(p, true)} className="p-2 text-emerald-500 hover:bg-emerald-500 hover:text-white bg-white rounded-xl border border-gray-100 shadow-sm transition-all"><Icon name="Check" size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </DataCard>
                    )
                )
            ) : (
                <DataCard title="Historial de Publicaciones">
                    <div className="divide-y divide-gray-50">
                        {historyList.map(p => (
                            <div key={p.id} className="flex items-center gap-6 py-4 group">
                                <SafeImg src={p.imagen} className="w-14 h-14 rounded-2xl object-cover bg-slate-50 border border-gray-100" />
                                <div className="flex-1">
                                    <H2 className="text-sm normal-case">{p.modelo}</H2>
                                    <TextLabel>Publicado el: {p.shared_at ? new Date(p.shared_at).toLocaleDateString() : 'Sin fecha'}</TextLabel>
                                </div>
                                <button
                                    onClick={() => toggleShareStatus(p, false)}
                                    className="p-3 bg-white border border-gray-100 text-gray-400 hover:text-amber-500 hover:border-amber-100 rounded-2xl transition-all shadow-sm"
                                >
                                    <Icon name="RotateCcw" size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </DataCard>
            )}
        </ViewWrapper>
    );
};

export default ShareView;