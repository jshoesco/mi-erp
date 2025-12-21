import React, { useState, useEffect } from 'react';
import { auth, onAuthStateChanged } from './lib/firebase';
import { UIProvider } from './context/UIContext';
import { DataProvider } from './context/DataContext';

// VISTAS
import LoginScreen from './views/LoginScreen';
import OrdersView from './components/orders/OrdersView';
import InventoryView from './views/InventoryView';
import FinanzasView from './views/FinanzasView';
import ConfigView from './views/ConfigView';
import ShareView from './views/ShareView';
import AlertsView from './views/AlertsView';
import QuotesView from './views/QuotesView';
import DashboardView from './views/DashboardView';
// ELIMINÉ LAS IMPORTACIONES QUE DABAN ERROR

// COMPONENTES UI
import Icon, { Spinner } from './components/ui/Icon';

const App = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('dashboard');
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    // --- ESTA ES LA ÚNICA LÍNEA NUEVA NECESARIA ---
    const [productToEdit, setProductToEdit] = useState(null);

    // Monitorear sesión
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    if (loading) return <div className="h-screen flex items-center justify-center bg-brand-light"><Spinner /></div>;
    if (!user) return <LoginScreen />;

    return (
        <UIProvider>
            <DataProvider>
                <div className="flex h-screen w-full bg-brand-light overflow-hidden text-slate-800 font-sans">

                    {/* --- SIDEBAR --- */}
                    <aside className={`${isSidebarOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full md:w-20 md:translate-x-0'} bg-brand-dark text-white flex flex-col shadow-2xl transition-all duration-300 ease-in-out z-30 relative hidden md:flex`}>
                        <div className="p-6 flex justify-center items-center">
                            <img src="/logo.png" alt="JShoes Logo" className="h-16 w-auto object-contain transition-transform hover:scale-105" />
                        </div>

                        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
                            <MenuButton icon="LayoutDashboard" label="Inicio" active={view === 'dashboard'} isOpen={isSidebarOpen} onClick={() => setView('dashboard')} />
                            <MenuButton icon="HelpCircle" label="Cotizaciones" active={view === 'quotes'} isOpen={isSidebarOpen} onClick={() => setView('quotes')} />
                            <MenuButton icon="ShoppingCart" label="Pedidos" active={view === 'orders'} isOpen={isSidebarOpen} onClick={() => setView('orders')} />
                            <MenuButton icon="Package" label="Inventario" active={view === 'inventory'} isOpen={isSidebarOpen} onClick={() => setView('inventory')} />
                            <MenuButton icon="Banknote" label="Finanzas" active={view === 'finanzas'} isOpen={isSidebarOpen} onClick={() => setView('finanzas')} />
                            <MenuButton icon="Share2" label="Social / MKT" active={view === 'share'} isOpen={isSidebarOpen} onClick={() => setView('share')} />
                            <MenuButton icon="Activity" label="Control Calidad" active={view === 'alerts'} isOpen={isSidebarOpen} onClick={() => setView('alerts')} />
                            
                            <div className="pt-6 mt-6 border-t border-gray-800/50">
                                <MenuButton icon="Settings" label="Configuración" active={view === 'config'} isOpen={isSidebarOpen} onClick={() => setView('config')} />
                            </div>
                        </nav>

                        <div className="p-4 bg-black/30 border-t border-gray-800/50">
                            <div className={`flex items-center gap-3 ${!isSidebarOpen && 'justify-center'}`}>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-red to-red-900 flex items-center justify-center text-sm font-bold text-white shadow-lg ring-2 ring-brand-dark">
                                    {user.email[0].toUpperCase()}
                                </div>
                                {isSidebarOpen && (
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">Administrador</p>
                                        <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </aside>

                    {/* --- ÁREA PRINCIPAL --- */}
                    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F3F4F6] relative w-full">
                        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 shrink-0 z-20 shadow-sm">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="hidden md:flex p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                                    <Icon name={isSidebarOpen ? "PanelLeftClose" : "PanelLeftOpen"} size={22} />
                                </button>
                                <div className="md:hidden flex items-center gap-1 font-black text-xl text-brand-dark">
                                    JS<span className="text-brand-red">SHOES</span>
                                </div>
                                <div>
                                    <h2 className="hidden md:block text-lg font-bold text-gray-800 tracking-tight capitalize">
                                        {view === 'orders' ? 'Gestión de Pedidos' : view === 'inventory' ? 'Inventario General' : view === 'finanzas' ? 'Control Financiero' : view === 'share' ? 'Marketing' : view === 'alerts' ? 'Control de Calidad' : 'Ajustes'}
                                    </h2>
                                </div>
                            </div>
                            <div className="text-xs font-mono font-medium text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                                {new Date().toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </div>
                        </header>

                        <main className="flex-1 overflow-auto p-4 md:p-6 pb-24 md:pb-6 relative w-full">
                            <div className="max-w-7xl mx-auto h-full flex flex-col">
                                {view === 'dashboard' && <DashboardView setView={setView} />}
                                {view === 'quotes' && <QuotesView />}
                                {view === 'orders' && <OrdersView />}
                                
                                {/* AQUÍ ESTÁ EL ARREGLO PARA QUE FUNCIONE EL INVENTARIO */}
                                {view === 'inventory' && (
                                    <InventoryView
                                        productToEdit={productToEdit}
                                        clearProductToEdit={() => setProductToEdit(null)}
                                        onEditRequest={(product) => setProductToEdit(product)}
                                    />
                                )}

                                {view === 'finanzas' && <FinanzasView />}
                                {view === 'config' && <ConfigView />}
                                {view === 'share' && <ShareView />}
                                {view === 'alerts' && <AlertsView />}
                            </div>
                        </main>

                        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-20 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-2 safe-area-bottom">
                            <MobileButton icon="ShoppingCart" label="Pedidos" active={view === 'orders'} onClick={() => setView('orders')} />
                            <MobileButton icon="Package" label="Inventario" active={view === 'inventory'} onClick={() => setView('inventory')} />
                            <div className="relative -top-5">
                                <button onClick={() => setView('quotes')} className="w-14 h-14 bg-brand-red rounded-full flex items-center justify-center text-white shadow-lg shadow-red-500/40 border-4 border-gray-50 transition-transform active:scale-95">
                                    <Icon name="Plus" size={28} />
                                </button>
                            </div>
                            <MobileButton icon="Banknote" label="Finanzas" active={view === 'finanzas'} onClick={() => setView('finanzas')} />
                            <MobileButton icon="Activity" label="Calidad" active={view === 'alerts'} onClick={() => setView('alerts')} />
                        </div>
                    </div>
                </div>
            </DataProvider>
        </UIProvider>
    );
};

const MenuButton = ({ icon, label, active, isOpen, onClick }) => (
    <button onClick={onClick} className={`group w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ease-out relative overflow-hidden ${active ? 'bg-gradient-to-r from-brand-red to-red-700 text-white shadow-lg shadow-brand-red/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'} ${!isOpen && 'justify-center px-0'}`}>
        <Icon name={icon} size={22} className={`${active ? 'text-white' : 'text-gray-400 group-hover:text-white transition-colors'}`} />
        {isOpen && <span className="font-medium text-sm tracking-wide">{label}</span>}
    </button>
);

const MobileButton = ({ icon, label, active, onClick }) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${active ? 'text-brand-red' : 'text-gray-400'}`}>
        <Icon name={icon} size={24} className={active ? 'fill-current' : ''} />
        <span className="text-[10px] font-medium mt-1">{label}</span>
    </button>
);

export default App;