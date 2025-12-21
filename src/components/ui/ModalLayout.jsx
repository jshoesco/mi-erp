import React from 'react';
import Icon from './Icon';

const ModalLayout = ({ isOpen, onClose, title, children, actions, size = 'max-w-xl' }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop con Blur - Consistencia en toda la App */}
            <div 
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" 
                onClick={onClose} 
            />

            {/* Contenedor del Modal */}
            <div className={`relative bg-white w-full ${size} rounded-[2.5rem] shadow-2xl shadow-gray-900/20 flex flex-col max-h-[90vh] overflow-hidden animate-scale-up`}>
                
                {/* Header Maestro */}
                <header className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-white">
                    <div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">
                            {title}
                        </h3>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2.5 bg-gray-50 text-gray-400 hover:text-brand-red rounded-2xl transition-all hover:rotate-90"
                    >
                        <Icon name="X" size={20} />
                    </button>
                </header>

                {/* Body: Aquí se inyectan los campos específicos (children) */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
                    {children}
                </div>

                {/* Footer: Acciones generales */}
                {actions && (
                    <footer className="px-8 py-6 bg-gray-50/50 border-t border-gray-50 flex justify-end gap-3">
                        {actions}
                    </footer>
                )}
            </div>
        </div>
    );
};

export default ModalLayout;