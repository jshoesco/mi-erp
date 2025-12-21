import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { formatCurrency } from '../lib/utils';
import Icon from '../components/ui/Icon';
import SafeImg from '../components/ui/SafeImg';

const AlertsView = () => {
    const { products, orders } = useData();

    // --- ANÁLISIS DE DATOS ---
    const analysis = useMemo(() => {
        const issues = {
            noSku: [],
            noPrice: [],
            noImage: [],
            stuckOrders: []
        };

        // 1. Analizar Productos
        products.forEach(p => {
            if (p.status !== 'Activo') return; // Ignorar archivados
            
            // Sin SKU o SKU genérico
            if (!p.sku || p.sku.includes('MANUAL') || p.sku.length < 3) {
                issues.noSku.push(p);
            }
            // Sin Precio o Costo (Error financiero)
            if (!p.precio || p.precio <= 0 || !p.costo || p.costo <= 0) {
                issues.noPrice.push(p);
            }
            // Sin Imagen
            if (!p.imagen) {
                issues.noImage.push(p);
            }
        });

        // 2. Analizar Pedidos (Estancados más de 3 días)
        const today = new Date();
        orders.forEach(o => {
            if (o.estado === 'Pendiente') {
                const orderDate = new Date(o.fecha);
                const diffTime = Math.abs(today - orderDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                
                if (diffDays > 3) {
                    issues.stuckOrders.push({ ...o, days: diffDays });
                }
            }
        });

        return issues;
    }, [products, orders]);

    const totalIssues = analysis.noSku.length + analysis.noPrice.length + analysis.noImage.length + analysis.stuckOrders.length;

    // Renderizador de Tarjeta de Error
    const IssueCard = ({ title, icon, color, items, renderItem }) => (
        <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col ${items.length === 0 ? 'opacity-50' : ''}`}>
            <div className={`p-4 border-b border-gray-100 flex justify-between items-center ${items.length > 0 ? 'bg-red-50/30' : ''}`}>
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Icon name={icon} className={items.length > 0 ? color : 'text-gray-400'} size={20} /> 
                    {title}
                </h3>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${items.length > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                    {items.length}
                </span>
            </div>
            <div className="p-2 overflow-y-auto max-h-64 scrollbar-thin">
                {items.length > 0 ? (
                    <div className="space-y-1">
                        {items.map((item, i) => renderItem(item, i))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-400 text-sm italic flex flex-col items-center">
                        <Icon name="CheckCircle" size={24} className="mb-2 text-emerald-100"/>
                        ¡Todo limpio aquí!
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col fade-in pb-20 md:pb-0">
            <div className="mb-6 flex items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-800">Centro de Calidad</h2>
                {totalIssues > 0 ? (
                    <span className="bg-brand-red text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                        {totalIssues} Atenciones Requeridas
                    </span>
                ) : (
                    <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        Sistema Saludable
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 pb-6">
                
                {/* 1. Productos Sin Precio/Costo (GRAVE) */}
                <IssueCard 
                    title="Errores Financieros" 
                    icon="DollarSign" 
                    color="text-rose-600"
                    items={analysis.noPrice}
                    renderItem={(p, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-100 transition-colors">
                            <SafeImg src={p.imagen} className="w-10 h-10 rounded-lg bg-gray-100" />
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm text-slate-800 truncate">{p.modelo}</div>
                                <div className="text-[10px] text-slate-500 font-mono">SKU: {p.sku || '---'}</div>
                            </div>
                            <div className="text-right text-xs">
                                <div className={!p.costo ? 'text-rose-600 font-bold' : 'text-gray-400'}>Costo: {formatCurrency(p.costo)}</div>
                                <div className={!p.precio ? 'text-rose-600 font-bold' : 'text-gray-400'}>Venta: {formatCurrency(p.precio)}</div>
                            </div>
                        </div>
                    )}
                />

                {/* 2. Pedidos Estancados */}
                <IssueCard 
                    title="Pedidos Estancados (>3 días)" 
                    icon="Clock" 
                    color="text-amber-500"
                    items={analysis.stuckOrders}
                    renderItem={(o, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 hover:bg-amber-50 rounded-lg border border-transparent hover:border-amber-100 transition-colors">
                            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                                {o.days}d
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm text-slate-800">{o.cliente?.nombre}</div>
                                <div className="text-[10px] text-slate-500">#{o.id_visual} • {new Date(o.fecha).toLocaleDateString()}</div>
                            </div>
                            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                Pendiente
                            </span>
                        </div>
                    )}
                />

                {/* 3. Productos Sin SKU */}
                <IssueCard 
                    title="Faltan Códigos SKU" 
                    icon="Barcode" 
                    color="text-indigo-500"
                    items={analysis.noSku}
                    renderItem={(p, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 hover:bg-indigo-50 rounded-lg border border-transparent hover:border-indigo-100 transition-colors">
                            <SafeImg src={p.imagen} className="w-10 h-10 rounded-lg bg-gray-100" />
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm text-slate-800 truncate">{p.modelo}</div>
                                <div className="text-[10px] text-slate-500">{p.marca}</div>
                            </div>
                            <span className="text-[10px] font-mono bg-gray-100 text-gray-500 px-2 py-1 rounded">
                                SIN SKU
                            </span>
                        </div>
                    )}
                />

                {/* 4. Productos Sin Imagen */}
                <IssueCard 
                    title="Faltan Imágenes" 
                    icon="Image" 
                    color="text-slate-500"
                    items={analysis.noImage}
                    renderItem={(p, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-colors">
                            <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400">
                                <Icon name="ImageOff" size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm text-slate-800 truncate">{p.modelo}</div>
                                <div className="text-[10px] text-slate-500">{p.marca} • {p.sku}</div>
                            </div>
                        </div>
                    )}
                />

            </div>
        </div>
    );
};

export default AlertsView;