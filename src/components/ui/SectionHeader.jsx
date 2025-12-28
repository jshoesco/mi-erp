import React from 'react';
import Icon from './display/Icon';

const SectionHeader = ({
    title,
    subtitle,
    isSidebarOpen,
    setSidebarOpen,
    actions // Aquí irán los botones de cada sección
}) => {
    return (
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 shrink-0 z-20 shadow-sm">
            <div className="flex items-center gap-6">
                {/* Botón Sidebar - SE QUEDA AQUÍ */}
                <button
                    onClick={() => setSidebarOpen(!isSidebarOpen)}
                    className="p-2.5 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-brand-dark transition-all border border-transparent hover:border-gray-100"
                >
                    <Icon name={isSidebarOpen ? "PanelLeftClose" : "PanelLeftOpen"} size={22} />
                </button>

                <div className="flex flex-col">
                    <h2 className="text-2xl font-black uppercase italic text-gray-900 tracking-tighter leading-none">
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 ml-0.5">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>

            {/* ZONA DINÁMICA: Aquí se inyectan los botones de cada vista */}
            <div className="flex items-center gap-4">
                {actions}

                <div className="h-8 w-[1px] bg-gray-100 mx-2 hidden md:block" />

                <div className="hidden md:flex text-[10px] font-black font-mono text-gray-400 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 uppercase tracking-tighter">
                    {new Date().toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                </div>
            </div>
        </header>
    );
};

export default SectionHeader;