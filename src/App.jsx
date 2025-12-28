import React, { useState, useEffect } from 'react';
import { auth, onAuthStateChanged } from './lib/firebase';
import { UIProvider, useUI } from './context/UIContext';
import { DataProvider } from './context/DataContext';

import OrdersView from './components/orders/OrdersView';

import LoginScreen from './views/LoginScreen';
import InventoryView from './components/inventory/InventoryView';
import FinanzasView from './components/finanzas/FinanzasView';
import ConfigView from './components/config/ConfigView';
import ShareView from './views/ShareView';
import DashboardView from './views/DashboardView';

import Icon, { Spinner } from './components/ui/display/Icon';

const GlobalHeader = ({ view, isSidebarOpen, setSidebarOpen }) => {
    const { headerActions } = useUI();
    const titles = {
        dashboard: { main: "INICIO", sub: "PANEL DE CONTROL" },
        orders: { main: "PEDIDOS", sub: "GESTIÓN DE VENTAS" },
        inventory: { main: "INVENTARIO", sub: "CONTROL DE STOCK" },
        finanzas: { main: "FINANZAS", sub: "FLUJO DE CAJA" },
        share: { main: "SOCIAL", sub: "MARKETING" },
        alerts: { main: "CALIDAD", sub: "CONTROL DE ALERTAS" },
        config: { main: "AJUSTES", sub: "CONFIGURACIÓN" }
    };

    const current = titles[view] || { main: view, sub: "" };

    return (
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 shrink-0 z-20">
            <div className="flex items-center gap-6">
                <button
                    onClick={() => setSidebarOpen(!isSidebarOpen)}
                    className="text-gray-400 hover:text-brand-dark transition-colors outline-none"
                >
                    <Icon name={isSidebarOpen ? "PanelLeftClose" : "PanelLeftOpen"} size={22} />
                </button>
                <div className="flex flex-col">
                    {/* ELIMINADA CLASE 'italic' - AHORA ES LIMPIO Y PESADO */}
                    <h2 className="text-xl font-black uppercase text-gray-900 tracking-tight leading-none">
                        {current.main}
                    </h2>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1.5">
                        {current.sub}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {headerActions}
            </div>
        </header>
    );
};

const AppContent = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('dashboard');
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    if (loading) return <div className="h-screen flex items-center justify-center bg-[#F8F9FA]"><Spinner /></div>;
    if (!user) return <LoginScreen />;

    return (
        <div className="flex h-screen w-full bg-[#F8F9FA] overflow-hidden text-slate-900">
            {/* SIDEBAR UNIFICADO */}
            <aside className={`${isSidebarOpen ? 'w-72' : 'w-20'} bg-brand-dark text-white flex flex-col shadow-2xl transition-all duration-300 z-30 relative hidden md:flex shrink-0`}>
                <div className="p-8 flex justify-center items-center h-24">
                    {isSidebarOpen ? (
                        <img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain" />
                    ) : (
                        <div className="font-black text-xl text-white tracking-tighter">JS</div>
                    )}
                </div>

                <nav className="flex-1 py-4 px-4 space-y-1 overflow-y-auto custom-scrollbar">
                    <MenuButton icon="LayoutDashboard" label="Inicio" active={view === 'dashboard'} isOpen={isSidebarOpen} onClick={() => setView('dashboard')} />
                    <MenuButton icon="ShoppingCart" label="Pedidos" active={view === 'orders'} isOpen={isSidebarOpen} onClick={() => setView('orders')} />
                    <MenuButton icon="Package" label="Inventario" active={view === 'inventory'} isOpen={isSidebarOpen} onClick={() => setView('inventory')} />
                    <MenuButton icon="Banknote" label="Finanzas" active={view === 'finanzas'} isOpen={isSidebarOpen} onClick={() => setView('finanzas')} />
                    <MenuButton icon="Share2" label="Social" active={view === 'share'} isOpen={isSidebarOpen} onClick={() => setView('share')} />
                    <MenuButton icon="Activity" label="Calidad" active={view === 'alerts'} isOpen={isSidebarOpen} onClick={() => setView('alerts')} />
                </nav>

                <div className="mt-auto p-4 space-y-4">
                    {isSidebarOpen && (
                        <div className="px-4 py-3 bg-white/5 rounded-2xl border border-white/5 text-center">
                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">SISTEMA ACTIVO</p>
                            <p className="text-[11px] font-bold text-gray-300 mt-1 uppercase">
                                {new Date().toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </p>
                        </div>
                    )}

                    <div className="pt-4 border-t border-white/5">
                        <MenuButton icon="Settings" label="Ajustes" active={view === 'config'} isOpen={isSidebarOpen} onClick={() => setView('config')} />
                    </div>

                    {/* PERFIL DE USUARIO - ELIMINADA CLASE 'italic' */}
                    <div className="flex items-center gap-3 p-2 bg-black/20 rounded-2xl">
                        <div className="w-10 h-10 shrink-0 rounded-xl bg-brand-red flex items-center justify-center text-sm font-bold shadow-lg">
                            {user.email[0].toUpperCase()}
                        </div>
                        {isSidebarOpen && (
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black text-white truncate uppercase tracking-tighter">ADMINISTRADOR</p>
                                <p className="text-[9px] text-gray-500 truncate font-bold uppercase tracking-tight">{user.email}</p>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* ÁREA DE TRABAJO */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
                <GlobalHeader view={view} isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
                <main className="flex-1 overflow-auto p-8 relative w-full custom-scrollbar bg-[#F8F9FA]">
                    <div className="max-w-[1600px] mx-auto h-full">
                        {view === 'dashboard' && <DashboardView setView={setView} />}
                        {view === 'orders' && <OrdersView />}
                        {view === 'inventory' && <InventoryView />}
                        {view === 'finanzas' && <FinanzasView />}
                        {view === 'config' && <ConfigView />}
                        {view === 'share' && <ShareView />}
                        {view === 'alerts' && <AlertsView />}
                    </div>
                </main>
            </div>
        </div>
    );
};

const App = () => (
    <UIProvider>
        <DataProvider>
            <AppContent />
        </DataProvider>
    </UIProvider>
);

const MenuButton = ({ icon, label, active, isOpen, onClick }) => (
    <button
        onClick={onClick}
        className={`group w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 outline-none ${active ? 'bg-brand-red text-white shadow-lg shadow-brand-red/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'} ${!isOpen && 'justify-center px-0'}`}
    >
        <Icon name={icon} size={20} className={active ? 'text-white' : 'text-gray-400 group-hover:text-white'} />
        {isOpen && <span className="font-bold text-[11px] uppercase tracking-widest leading-none">{label}</span>}
    </button>
);

export default App;