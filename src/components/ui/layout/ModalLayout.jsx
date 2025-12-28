import React from 'react';
import Icon from '../display/Icon';
import { TOKENS } from '../../../theme/constants';

export const ModalLayout = ({ isOpen, onClose, title, children, actions, size = 'max-w-2xl' }) => {
    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-fade-in`}>
            <div className="absolute inset-0 bg-brand-dark/40 backdrop-blur-md transition-opacity" onClick={onClose} />

            <div className={`relative bg-brand-surface w-full ${size} ${TOKENS.radius.container} shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-brand-light`}>
                <header className="px-10 py-8 flex justify-between items-center bg-brand-surface">
                    <div className="space-y-1">
                        <h3 className={TOKENS.text.h1}>{title}</h3>
                        <div className="h-1.5 w-10 bg-brand-red rounded-full shadow-lg shadow-brand-red/20" />
                    </div>
                    <button onClick={onClose} className={`p-3 text-brand-gray/30 hover:text-brand-red hover:bg-brand-red/5 ${TOKENS.radius.inner} transition-all`}>
                        <Icon name="X" size={24} />
                    </button>
                </header>

                <div className={`flex-1 overflow-y-auto px-10 pb-10 custom-scrollbar`}>
                    {children}
                </div>

                {actions && (
                    <footer className={`px-10 py-6 bg-brand-light/30 border-t border-brand-light flex justify-end gap-4`}>
                        {actions}
                    </footer>
                )}
            </div>
        </div>
    );
};

export default ModalLayout;