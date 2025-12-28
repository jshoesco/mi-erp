import { useMemo } from 'react';
import { getLogisticsKanban } from '../../../helpers/kanbanHelpers';

export const useLogisticsLogic = (orders, search) => {
    const logisticsData = useMemo(() => {
        // Esta función es la que tienes que ir a editar en su archivo original
        return getLogisticsKanban(orders, search);
    }, [orders, search]);

    return { logisticsData };
};