import React, { createContext, useContext, useState } from 'react';
import Icon from '../components/ui/display/Icon';
import { Button } from '../components/ui/display/Button';
import { TOKENS } from '../theme/constants';

const UIContext = createContext();

export const UIProvider = ({ children }) => {
    // 1. ESTADOS (Notificaciones, Confirmación y MODALES)
    const [toasts, setToasts] = useState([]);
    const [headerActions, setHeaderActions] = useState(null);
    const [modal, setModal] = useState({ type: null, data: null }); // AJUSTE: Motor de modales
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false, title: '', message: '', onConfirm: null
    });

    // 2. FUNCIONES DE MODALES (Lo que te faltaba para que funcione el botón)
    const openModal = (type, data = null) => setModal({ type, data });
    const closeModal = () => setModal({ type: null, data: null });

    // 3. FUNCIONES DE NOTIFICACIÓN Y CONFIRMACIÓN
    const notify = (message, type = 'success') => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    };

    const confirmAction = ({ title, message, onConfirm }) => {
        setConfirmModal({
            isOpen: true,
            title: title || 'Confirmar Acción',
            message: message || '¿Estás seguro?',
            onConfirm: async () => {
                await onConfirm();
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    // 4. VALOR DEL CONTEXTO (Todo lo que exportamos)
    const value = {
        notify,
        confirmAction,
        headerActions,
        setHeaderActions,
        modal,      // Necesario para OrdersModals
        openModal,  // Necesario para el botón Nuevo Pedido
        closeModal  // Necesario para cerrar formularios
    };

    return (
        <UIContext.Provider value={value}>
            {children}

            {/* RENDER DE NOTIFICACIONES */}
            <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none w-full max-w-xs">
                {toasts.map(t => (
                    <div key={t.id} className={`pointer-events-auto px-6 py-4 ${TOKENS.radius.inner} shadow-float flex items-center gap-4 text-white animate-fade-in border border-white/10 backdrop-blur-md ${t.type === 'error' ? 'bg-brand-red' : 'bg-brand-dark'}`}>
                        <Icon name={t.type === 'error' ? 'alert-circle' : 'check-circle'} size={20} />
                        <span className={TOKENS.text.tiny}>{t.message}</span>
                    </div>
                ))}
            </div>

            {/* RENDER DE CONFIRMACIÓN */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-brand-dark/60 backdrop-blur-md">
                    <div className={`bg-brand-surface ${TOKENS.radius.container} shadow-card w-full max-w-sm p-10 text-center space-y-6 border border-brand-light`}>
                        <div className={`w-16 h-16 bg-brand-red/10 text-brand-red ${TOKENS.radius.inner} flex items-center justify-center mx-auto`}>
                            <Icon name="alert-circle" size={32} />
                        </div>
                        <div className="space-y-2">
                            <h3 className={TOKENS.text.h2}>{confirmModal.title}</h3>
                            <p className={`${TOKENS.text.tiny} text-brand-gray/60 tracking-normal normal-case`}>{confirmModal.message}</p>
                        </div>
                        <div className="flex gap-4 pt-4">
                            <Button variant="secondary" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} className="flex-1 h-14">
                                CANCELAR
                            </Button>
                            <Button variant="primary" onClick={confirmModal.onConfirm} className="flex-1 h-14">
                                CONFIRMAR
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </UIContext.Provider>
    );
};

export const useUI = () => useContext(UIContext);