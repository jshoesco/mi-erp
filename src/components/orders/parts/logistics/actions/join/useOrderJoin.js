import { executeJoin } from './logic';

export const useOrderJoin = (notify) => {
    const joinOrders = async (orders, masterAddress) => {
        return await executeJoin(orders, masterAddress, notify);
    };

    return { joinOrders };
};