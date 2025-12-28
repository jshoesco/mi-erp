import React from 'react';
import { IconX } from '@tabler/icons-react';
import { Button } from '../display/Button';
import Icon from '../display/Icon';

const ActionBar = ({ count, onClear, actions = [] }) => {
    if (count === 0) return null;

    return (
        <div className="fixed bottom-10 left-0 right-0 flex justify-center z-[100] px-4 pointer-events-none">
            <div className="pointer-events-auto flex items-center bg-slate-950 p-2 rounded-2xl shadow-2xl border border-slate-800 animate-in fade-in slide-in-from-bottom-6 duration-300">

                {/* Contador de selección */}
                <div className="flex flex-col items-center px-6 border-r border-slate-800 mr-2">
                    <span className="text-[16px] font-black text-white leading-none">{count}</span>
                    <span className="text-[7px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1.5">Selección</span>
                </div>

                {/* Acciones dinámicas */}
                <div className="flex items-center gap-2">
                    {actions.map((action, i) => (
                        <Button
                            key={i}
                            onClick={action.onClick}
                            variant="none"
                            className={`
                                h-10 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2
                                ${action.variant === 'danger'
                                    ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20'
                                    : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'} 
                            `}
                        >
                            <Icon
                                name={action.icon}
                                size={14}
                                strokeWidth={3}
                            />
                            {action.label}
                        </Button>
                    ))}
                </div>

                <div className="w-[1px] h-8 bg-slate-800 mx-4" />

                {/* Botón de cerrar/limpiar */}
                <button
                    onClick={onClear}
                    className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 rounded-full transition-all hover:rotate-90"
                >
                    <IconX size={20} />
                </button>
            </div>
        </div>
    );
};

export default ActionBar;