import { SCHEMA } from '../../../../../../../constants/schema';

export const useStrategyLogic = (form, setForm) => {
    const S = SCHEMA.ORDERS;
    const VALS = S.STRATEGY_VALUES;

    const current = String(form[S.STRATEGY] || '').toLowerCase().trim();

    // Ahora sí coincidirán porque ambos vienen del mismo SCHEMA
    const canSwitchMode = current === VALS.ACOPIO || current === VALS.DIRECTO;

    const setModo = (modo) => {
        setForm(prev => ({
            ...prev,
            [S.STRATEGY]: modo
        }));
    };

    return {
        strategy: current,
        canSwitchMode,
        setModo,
        VALS
    };
};