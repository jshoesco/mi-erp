import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import Icon, { Spinner } from '../components/ui/display/Icon';
import SafeImg from '../components/ui/display/SafeImg';
import { ViewWrapper, DataCard } from '../components/ui/layout/Containers';
import { H1, TextLabel, PriceText } from '../components/ui/display/Typography';

const DashboardView = ({ setView }) => {
    const { orders = [], quotes = [], products = [], loading } = useData();

    const stats = useMemo(() => {
        const todayStr = new Date().toISOString().slice(0, 10);

        // CORRECCIÓN: Añadimos validación de existencia de o.fecha antes del slice
        const todayOrders = orders.filter(o =>
            o.fecha && typeof o.fecha === 'string' &&
            o.fecha.slice(0, 10) === todayStr &&
            o.estado !== 'Cancelado'
        );

        const todaySales = todayOrders.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
        const toShip = orders.filter(o => !['Enviado', 'Completado', 'Devuelto', 'Cancelado'].includes(o.estado)).length;

        let debtItems = 0;
        orders.forEach(o => {
            if (o.estado === 'Cancelado' || !o.items) return;
            o.items.forEach(i => {
                const deuda = ((Number(i.costo) || 0) + (Number(i.costo_envio_asignado) || 0)) - (Number(i.pago_proveedor) || 0);
                if (deuda > 0) debtItems++;
            });
        });

        return {
            todaySales,
            toShip,
            debtItems,
            pendingQuotes: quotes.filter(q => q.estado === 'Pendiente').length
        };
    }, [orders, quotes]);

    const topProducts = useMemo(() => {
        const counts = {};
        orders.forEach(o => {
            if (o.estado === 'Cancelado' || !o.items) return;
            o.items.forEach(i => {
                const key = i.sku || i.modelo || 'Sin Identificar';
                if (!counts[key]) counts[key] = { ...i, count: 0 };
                counts[key].count += (Number(i.cantidad) || 0);
            });
        });
        return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
    }, [orders]);

    if (loading) return <div className="h-full flex items-center justify-center"><Spinner /></div>;

    return (
        <ViewWrapper>
            {/* ... resto del JSX se mantiene igual ... */}
            <div className="flex justify-between items-end px-2">
                <div>
                    <H1>Panel de Control</H1>
                    <TextLabel>Estado operativo de la empresa</TextLabel>
                </div>
                <div className="bg-white border border-gray-100 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-sm">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <TextLabel className="text-gray-500">Sincronizado</TextLabel>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-brand-dark p-8 rounded-[2.5rem] shadow-xl shadow-gray-200 flex flex-col justify-between h-48 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 opacity-10 rotate-12"><Icon name="DollarSign" size={120} /></div>
                    <TextLabel className="text-gray-400">Ventas de Hoy</TextLabel>
                    <div>
                        <div className="text-4xl font-black text-white tracking-tighter tabular-nums">
                            <PriceText value={stats.todaySales} />
                        </div>
                    </div>
                </div>

                <div onClick={() => setView('orders')} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-all flex flex-col justify-between h-48 group">
                    <div className="flex justify-between items-start">
                        <TextLabel>Por Despachar</TextLabel>
                        <div className="p-3 bg-red-50 text-brand-red rounded-2xl group-hover:scale-110 transition-all"><Icon name="Package" size={24} /></div>
                    </div>
                    <h2 className="text-5xl font-black text-slate-900 tracking-tighter tabular-nums">{stats.toShip}</h2>
                </div>

                <div onClick={() => setView('quotes')} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-all flex flex-col justify-between h-48 group">
                    <div className="flex justify-between items-start">
                        <TextLabel>Cotizaciones</TextLabel>
                        <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl group-hover:scale-110 transition-all"><Icon name="HelpCircle" size={24} /></div>
                    </div>
                    <h2 className="text-5xl font-black text-slate-900 tracking-tighter tabular-nums">{stats.pendingQuotes}</h2>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className={`p-8 rounded-[2.5rem] border flex items-center justify-between transition-all ${stats.debtItems > 0 ? 'bg-red-50/50 border-red-100' : 'bg-slate-50 border-gray-100'}`}>
                        <div className="flex items-center gap-6">
                            <div className="bg-white p-4 rounded-2xl shadow-sm">
                                <Icon name={stats.debtItems > 0 ? "AlertCircle" : "CheckCircle"} className={stats.debtItems > 0 ? 'text-brand-red' : 'text-emerald-500'} size={28} />
                            </div>
                            <div>
                                <h4 className={`text-sm font-black uppercase tracking-tight ${stats.debtItems > 0 ? 'text-red-700' : 'text-slate-700'}`}>
                                    {stats.debtItems > 0 ? 'Pagos Pendientes' : 'Operación al Día'}
                                </h4>
                                <p className="text-[11px] font-bold text-gray-500 mt-1 uppercase tracking-tight">
                                    {stats.debtItems > 0 ? `Tienes ${stats.debtItems} productos sin liquidar.` : 'Sin deudas con proveedores.'}
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setView('orders')} className="p-3 hover:translate-x-1 transition-all">
                            <Icon name="ArrowRight" size={20} className="text-gray-300" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <button onClick={() => setView('orders')} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 flex items-center gap-6 hover:border-brand-red transition-all group shadow-sm text-left">
                            <div className="bg-slate-50 text-gray-400 p-4 rounded-2xl group-hover:bg-brand-red group-hover:text-white transition-all"><Icon name="Plus" size={22} /></div>
                            <div>
                                <div className="font-black text-slate-900 text-[11px] uppercase tracking-tight">Nueva Venta</div>
                                <TextLabel>Registrar pedido</TextLabel>
                            </div>
                        </button>
                        <button onClick={() => setView('inventory')} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 flex items-center gap-6 hover:border-brand-red transition-all group shadow-sm text-left">
                            <div className="bg-slate-50 text-gray-400 p-4 rounded-2xl group-hover:bg-brand-red group-hover:text-white transition-all"><Icon name="Search" size={22} /></div>
                            <div>
                                <div className="font-black text-slate-900 text-[11px] uppercase tracking-tight">Inventario</div>
                                <TextLabel>Ver stock</TextLabel>
                            </div>
                        </button>
                    </div>
                </div>

                <DataCard title="Top Productos" padding="p-0">
                    <div className="divide-y divide-slate-50">
                        {topProducts.map((p, i) => (
                            <div key={i} className="flex items-center gap-4 p-5 hover:bg-slate-50 transition-all">
                                <span className="font-black text-gray-200 text-xl w-6 italic">{i + 1}</span>
                                <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden border border-gray-100">
                                    <SafeImg src={p.imagen} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[11px] font-black text-slate-900 truncate uppercase">{p.modelo}</div>
                                    <TextLabel className="text-[9px]">{p.sku}</TextLabel>
                                </div>
                                <div className="text-[10px] font-black bg-slate-900 text-white px-3 py-1.5 rounded-lg tabular-nums">
                                    {p.count}
                                </div>
                            </div>
                        ))}
                    </div>
                </DataCard>
            </div>
        </ViewWrapper>
    );
};

export default DashboardView;