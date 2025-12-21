import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext'; // Para el saludo o navegación si se requiere
import { formatCurrency } from '../lib/utils';
import Icon, { Spinner } from '../components/ui/Icon';
import SafeImg from '../components/ui/SafeImg';

const DashboardView = ({ setView }) => {
    const { orders, quotes, products, loading } = useData();

    // --- CÁLCULOS ESTADÍSTICOS ---
    const stats = useMemo(() => {
        const todayStr = new Date().toISOString().slice(0, 10);
        const currentMonth = new Date().getMonth();

        // 1. VENTAS
        const todayOrders = orders.filter(o => o.fecha.slice(0, 10) === todayStr && o.estado !== 'Cancelado');
        const monthOrders = orders.filter(o => new Date(o.fecha).getMonth() === currentMonth && o.estado !== 'Cancelado');
        
        const todaySales = todayOrders.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
        const monthSales = monthOrders.reduce((acc, o) => acc + (Number(o.total) || 0), 0);

        // 2. OPERATIVOS (Semáforos)
        // Pendiente despacho: No tiene guía o no está enviado
        const toShip = orders.filter(o => !['Enviado', 'Completado', 'Devuelto', 'Cancelado'].includes(o.estado)).length;
        
        // Pendiente pago proveedor: Items donde pago_proveedor < (costo + envio)
        let debtItems = 0;
        orders.forEach(o => {
            if(o.estado === 'Cancelado') return;
            o.items.forEach(i => {
                const deuda = ((Number(i.costo)||0) + (Number(i.costo_envio_asignado)||0)) - (Number(i.pago_proveedor)||0);
                if(deuda > 0) debtItems++;
            });
        });

        // 3. COTIZACIONES
        const pendingQuotes = quotes.filter(q => q.estado === 'Pendiente').length;

        return { todaySales, monthSales, toShip, debtItems, pendingQuotes, todayCount: todayOrders.length };
    }, [orders, quotes]);

    // --- TOP PRODUCTOS ---
    const topProducts = useMemo(() => {
        const counts = {};
        orders.forEach(o => {
            if (o.estado === 'Cancelado') return;
            o.items.forEach(i => {
                const key = i.sku || i.modelo;
                if (!counts[key]) counts[key] = { ...i, count: 0 };
                counts[key].count += Number(i.cantidad);
            });
        });
        return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
    }, [orders]);

    if (loading) return <div className="p-10 flex justify-center"><Spinner /></div>;

    return (
        <div className="h-full flex flex-col fade-in pb-20 md:pb-0 gap-6">
            
            {/* 1. HEADER CON SALUDO */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800">Hola, CEO 👋</h1>
                    <p className="text-gray-500 text-sm">Aquí tienes el pulso de tu negocio hoy.</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-xs font-bold text-gray-600">Sistema Operativo</span>
                </div>
            </div>

            {/* 2. TARJETAS DE DINERO (KPIs) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-brand-dark text-white p-5 rounded-2xl shadow-lg shadow-gray-200 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Icon name="DollarSign" size={80}/></div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Ventas de Hoy ({stats.todayCount})</p>
                    <h2 className="text-3xl font-black">{formatCurrency(stats.todaySales)}</h2>
                    <div className="mt-4 flex items-center gap-2 text-xs text-gray-300 bg-white/10 w-fit px-2 py-1 rounded-lg">
                        <Icon name="TrendingUp" size={14}/> Acumulado Mes: {formatCurrency(stats.monthSales)}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div 
                        onClick={() => setView('orders')}
                        className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center cursor-pointer hover:border-brand-red/30 hover:shadow-md transition-all group"
                    >
                        <div className={`p-3 rounded-full mb-2 transition-colors ${stats.toShip > 0 ? 'bg-red-50 text-brand-red' : 'bg-emerald-50 text-emerald-600'}`}>
                            <Icon name={stats.toShip > 0 ? "Package" : "Check"} size={24}/>
                        </div>
                        <span className="text-2xl font-black text-slate-800">{stats.toShip}</span>
                        <span className="text-xs text-gray-500 font-medium">Por Despachar</span>
                    </div>

                    <div 
                        onClick={() => setView('quotes')}
                        className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center cursor-pointer hover:border-amber-400/30 hover:shadow-md transition-all"
                    >
                        <div className={`p-3 rounded-full mb-2 transition-colors ${stats.pendingQuotes > 0 ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-400'}`}>
                            <Icon name="HelpCircle" size={24}/>
                        </div>
                        <span className="text-2xl font-black text-slate-800">{stats.pendingQuotes}</span>
                        <span className="text-xs text-gray-500 font-medium">Cotizaciones</span>
                    </div>
                </div>
            </div>

            {/* 3. SECCIÓN DE ALERTAS Y TOP */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                
                {/* COLUMNA IZQUIERDA: ALERTA DEUDA */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                    {stats.debtItems > 0 ? (
                        <div onClick={() => setView('orders')} className="bg-red-50 border border-red-100 p-4 rounded-xl flex justify-between items-center cursor-pointer hover:bg-red-100 transition-colors">
                            <div className="flex gap-4 items-center">
                                <div className="bg-white p-2 rounded-lg text-brand-red shadow-sm"><Icon name="AlertCircle" size={24}/></div>
                                <div>
                                    <h4 className="font-bold text-brand-red">Pagos a Proveedores Pendientes</h4>
                                    <p className="text-xs text-red-700">Tienes <b>{stats.debtItems} productos</b> sin pagar al proveedor. Revisa Logística.</p>
                                </div>
                            </div>
                            <Icon name="ChevronRight" className="text-red-300"/>
                        </div>
                    ) : (
                        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex gap-4 items-center">
                            <div className="bg-white p-2 rounded-lg text-emerald-600 shadow-sm"><Icon name="CheckCircle" size={24}/></div>
                            <div>
                                <h4 className="font-bold text-emerald-700">Todo al día con Proveedores</h4>
                                <p className="text-xs text-emerald-600">No tienes deudas operativas urgentes.</p>
                            </div>
                        </div>
                    )}

                    {/* BOTONES DE ACCIÓN RÁPIDA */}
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setView('orders')} className="bg-white border border-gray-200 p-4 rounded-xl flex items-center gap-3 hover:border-indigo-300 hover:shadow-md transition-all text-left">
                            <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-lg"><Icon name="Plus" size={20}/></div>
                            <div>
                                <div className="font-bold text-slate-700 text-sm">Nuevo Pedido</div>
                                <div className="text-[10px] text-gray-400">Registrar venta</div>
                            </div>
                        </button>
                        <button onClick={() => setView('quotes')} className="bg-white border border-gray-200 p-4 rounded-xl flex items-center gap-3 hover:border-amber-300 hover:shadow-md transition-all text-left">
                            <div className="bg-amber-50 text-amber-600 p-2.5 rounded-lg"><Icon name="Search" size={20}/></div>
                            <div>
                                <div className="font-bold text-slate-700 text-sm">Cotizar</div>
                                <div className="text-[10px] text-gray-400">Buscar producto</div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* COLUMNA DERECHA: TOP PRODUCTOS */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-700 text-sm flex items-center gap-2"><Icon name="TrendingUp" size={16}/> Top Vendidos</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {topProducts.map((p, i) => (
                            <div key={i} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-50 last:border-0">
                                <div className="font-black text-gray-300 text-lg w-4 text-center">{i + 1}</div>
                                <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                    <SafeImg src={p.imagen} className="w-full h-full object-cover"/>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-bold text-gray-800 truncate">{p.modelo}</div>
                                    <div className="text-[10px] text-gray-500">{p.sku}</div>
                                </div>
                                <div className="text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-600">{p.count} un.</div>
                            </div>
                        ))}
                        {topProducts.length === 0 && <div className="p-4 text-center text-xs text-gray-400">Sin datos aún.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardView;