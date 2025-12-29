import { SCHEMA } from '../../../../../../../constants/schema';

export const useStrategyLogic = (form, setForm) => {
    const S = SCHEMA.ORDERS;

    // Solo se permite elegir si la ciudad original permitía acopio
    // o si el pedido ya viene marcado como tal.
    const canSwitchMode = form[S.STRATEGY] === 'ACOPIO' || form[S.STRATEGY] === 'DIRECTO';

    const setModo = (modo) => {
        setForm(prev => ({
            ...prev,
            [S.STRATEGY]: modo
        }));
    };

    return {
        strategy: form[S.STRATEGY],
        canSwitchMode,
        setModo
    };
};