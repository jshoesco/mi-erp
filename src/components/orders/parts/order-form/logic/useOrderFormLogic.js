import { useState } from 'react';
import { SCHEMA } from '../../../../../constants/schema';

export const useOrderFormLogic = (initialData) => {
    const S = SCHEMA.ORDERS;
    const C = S.CLIENT;

    // DEFINICIÓN BASADA 100% EN SCHEMA
    const defaultState = {
        [S.ID_ORDER]: '',
        [S.STRATEGY]: 'DIRECTO',
        [S.STATUS]: 'Pendiente',
        [S.DATE]: new Date().toISOString().split('T')[0],
        [S.ITEMS]: [],
        [S.SHIPPING_COST]: 0,
        [S.CLIENT.ROOT]: {
            [C.NAME]: '',
            [C.TEL]: '',
            [C.CITY]: '',
            [C.ADDRESS]: '',
        }
    };

    const [form, setForm] = useState(initialData || defaultState);

    const resetForm = () => setForm(defaultState);

    return {
        form,
        setForm,
        resetForm
    };
};