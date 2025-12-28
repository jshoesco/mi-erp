import { useMemo } from 'react';
import { getSalesKanban } from '../../../helpers/kanbanHelpers';

export const useSalesLogic = (orders, search) => {
    const salesKanban = useMemo(() => getSalesKanban(orders, search), [orders, search]);
    return { salesKanban };
};