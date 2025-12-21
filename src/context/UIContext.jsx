import React, { createContext, useContext, useState } from 'react';
import Icon from '../components/ui/Icon';
import Button from '../components/ui/Button';

const UIContext = createContext();

export const UIProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const [confirmModal, setConfirmModal] = useState({ 
        isOpen: false, 
        title: '', 
        message: '', 
        onConfirm: null 
    });

    // Función para mostrar notificaciones
    const notify = (message, type = 'success') => {
        // CORRECCIÓN: Agregamos Math.random() para asegurar que la llave sea única
        // aunque ocurran dos notificaciones en el mismo milisegundo.
        const id = Date.now() + Math.random(); 
        
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    };

    // Función para pedir confirmación (Sí/No)
    const confirmAction = ({ title, message, onConfirm }) => {
        setConfirmModal({
            isOpen: true,
            title: title || 'Confirmar',
            message: message || '¿Seguro?',
            onConfirm: async () => {
                await onConfirm();
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    return (
        <UIContext.Provider value={{ notify, confirmAction }}>
            {children}
            
            {/* Renderizado de Toasts (Notificaciones) */}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none w-full max-w-xs px-4 md:px-0 md:w-auto">
                {toasts.map(t => (
                    <div key={t.id} className={`pointer-events-auto px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 text-white w-full animate-bounce-in ${t.type === 'error' ? 'bg-rose-600' : t.type === 'info' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                        <Icon name={t.type === 'error' ? 'AlertCircle' : t.type === 'info' ? 'Info' : 'CheckCircle'} size={18} />
                        {t.message}
                    </div>
                ))}
            </div>

            {/* Renderizado del Modal de Confirmación */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4">
                        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                            <Icon name="AlertTriangle" size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">{confirmModal.title}</h3>
                        <p className="text-sm text-slate-500">{confirmModal.message}</p>
                        <div className="flex gap-3 pt-2">
                            <Button variant="secondary" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} className="flex-1 h-12">
                                Cancelar
                            </Button>
                            <Button variant="danger" onClick={confirmModal.onConfirm} className="flex-1 h-12">
                                Sí, Confirmar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </UIContext.Provider>
    );
};

export const useUI = () => useContext(UIContext);