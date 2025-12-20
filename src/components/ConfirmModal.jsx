import React from 'react';
import Icon from './Icon';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, type = 'danger' }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-scale-up">
                
                {/* Icono Superior */}
                <div className={`p-6 flex justify-center ${type === 'danger' ? 'bg-red-50 text-red-500' : 'bg-brand-dark/5 text-brand-dark'}`}>
                    <div className={`p-3 rounded-full ${type === 'danger' ? 'bg-red-100' : 'bg-white'}`}>
                        <Icon name={type === 'danger' ? "AlertTriangle" : "HelpCircle"} size={32} />
                    </div>
                </div>

                {/* Contenido */}
                <div className="p-6 text-center">
                    <h3 className="text-xl font-black text-gray-800 mb-2">{title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
                </div>

                {/* Botones */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 grid grid-cols-2 gap-3">
                    <button 
                        onClick={onClose}
                        className="py-3 px-4 rounded-xl font-bold text-gray-500 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={() => { onConfirm(); onClose(); }}
                        className={`py-3 px-4 rounded-xl font-bold text-white shadow-lg transition-all ${
                            type === 'danger' 
                            ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' 
                            : 'bg-brand-dark hover:bg-black shadow-gray-800/30'
                        }`}
                    >
                        {type === 'danger' ? 'Sí, Eliminar' : 'Confirmar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;