import React from 'react';
import { useStrategyLogic } from './logic/useStrategyLogic';

const StrategySection = ({ form, setForm }) => {
    // Recibimos VALS desde el hook
    const { strategy, canSwitchMode, setModo, VALS } = useStrategyLogic(form, setForm);

    if (!canSwitchMode) return null;

    return (
        <div className="col-span-2 flex items-center gap-4 bg-indigo-50 p-3 rounded-xl border border-indigo-100 mt-4">
            <span className="text-[10px] font-black text-indigo-900 uppercase ml-2">
                Estrategia de Despacho:
            </span>
            <div className="flex bg-white p-1 rounded-lg border border-indigo-200 shadow-sm">
                <button
                    type="button"
                    onClick={() => setModo(VALS.ACOPIO)} // Envía 'acopio'
                    className={`px-4 py-1.5 rounded-md text-[10px] font-black transition-all ${strategy === VALS.ACOPIO ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-400'
                        }`}
                >
                    MODO ACOPIO
                </button>
                <button
                    type="button"
                    onClick={() => setModo(VALS.DIRECTO)} // Envía 'directo'
                    className={`px-4 py-1.5 rounded-md text-[10px] font-black transition-all ${strategy === VALS.DIRECTO ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-400'
                        }`}
                >
                    ENVÍO DIRECTO
                </button>
            </div>
        </div>
    );
};

export default StrategySection;