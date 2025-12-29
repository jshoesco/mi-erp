import { useMemo } from 'react';
import { getLogisticsKanban } from '../../../helpers/kanbanHelpers';

export const useLogisticsLogic = (orders, search) => {
    const logisticsData = useMemo(() => {
        return getLogisticsKanban(orders, search);
    }, [orders, search]);

    return { logisticsData };
};