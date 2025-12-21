import React from 'react';
import { IconX, IconArchive, IconTrash } from '@tabler/icons-react';
import Button from './Button'; 

const ActionBar = ({ count, onClear, actions = [] }) => {
    if (count === 0) return null;

    return (
        <div className="fixed bottom-10 left-0 right-0 flex justify-center z-[100] px-4 pointer-events-none">
            <div className="pointer-events-auto flex items-center bg-slate-950 p-2 rounded-2xl shadow-2xl border border-slate-800 animate-in fade-in slide-in-from-bottom-6">
                
                {/* Contador: Número RECTO y fuerte */}
                <div className="flex flex-col items-center px-5 border-r border-slate-800 mr-2">
                    <span className="text-[15px] font-black text-white leading-none">{count}</span>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Items</span>
                </div>
                
                <div className="flex items-center gap-2">
                    {actions.map((action, i) => (
                        <Button 
                            key={i}
                            onClick={action.onClick}
                            className={`
                                h-10 px-5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95
                                ${action.variant === 'danger' 
                                    ? 'bg-brand-red text-white hover:bg-red-600' 
                                    : 'bg-white text-slate-950 hover:bg-slate-200'} 
                            `}
                        >
                            <div className="flex items-center gap-2">
                                {action.variant === 'danger' ? <IconTrash size={16}/> : <IconArchive size={16}/>}
                                {action.label}
                            </div>
                        </Button>
                    ))}
                </div>

                <div className="w-[1px] h-6 bg-slate-800 mx-3" />

                <button onClick={onClear} className="pr-2 text-slate-500 hover:text-white transition-colors">
                    <IconX size={20} />
                </button>
            </div>
        </div>
    );
};

export default ActionBar;