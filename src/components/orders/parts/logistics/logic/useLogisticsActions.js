import { useOrderJoin } from '../actions/Join/useOrderJoin';
import { useOrderSplit } from '../actions/split/useOrderSplit';
import { useOrderUnveil } from './useOrderUnveil';
import { usePaymentAction } from '../actions/payments/usePaymentAction';
import { useShippingAction } from '../actions/shipping/useShippingAction';
import { SCHEMA } from '../../../../../constants/schema';
import { useProductSwap } from '../actions/swap/useProductSwap';

export const useLogisticsActions = (orders, ui, setModalState, setActiveGroup) => {
    const L = SCHEMA.LOGISTICS;

    const { joinOrders } = useOrderJoin(ui?.notify);
    const { splitOrderItem } = useOrderSplit(ui?.notify);
    const { unveilOrder, unveilGroup } = useOrderUnveil(ui?.notify);
    const { registerPayments } = usePaymentAction(ui?.notify);
    const { registerShipping } = useShippingAction(ui?.notify);
    const { swapProduct } = useProductSwap(ui?.notify);

    const handleLogisticsAction = async (type, data) => {
        switch (type) {
            case L.ACTIONS.OPEN_JOIN:
                setActiveGroup(data);
                setModalState(prev => ({ ...prev, [L.MODAL_KEYS.JOIN]: true }));
                break;
            case L.ACTIONS.PAY:
                setActiveGroup(data);
                setModalState(prev => ({ ...prev, [L.MODAL_KEYS.PAYMENT]: true }));
                break;
            case L.ACTIONS.GUIDE:
                setActiveGroup(data);
                setModalState(prev => ({ ...prev, [L.MODAL_KEYS.SHIPPING]: true }));
                break;
            case L.ACTIONS.SPLIT_ITEM:
                await splitOrderItem(data.order, data.itemIndex);
                break;
            case L.ACTIONS.UNVEIL_ORDER:
                await unveilOrder(data);
                break;
            case L.ACTIONS.UNVEIL_GROUP:
                await unveilGroup(data);
                break;
            case L.ACTIONS.OPEN_SWAP:
                setActiveGroup(data);
                setModalState(prev => ({ ...prev, [L.MODAL_KEYS.SWAP]: true }));
                break;
            default:
                break;
        }
    };

    const confirmModalAction = async (type, data, activeGroup) => {
        let success = false;

        if (type === L.MODAL_KEYS.JOIN) {
            success = await joinOrders(orders.filter(o => data.orderIds.includes(o.id)), data.masterAddress);
        } else if (type === L.MODAL_KEYS.PAYMENT) {
            success = await registerPayments({ ...data, groupId: activeGroup.id });
        } else if (type === L.MODAL_KEYS.SHIPPING) {
            success = await registerShipping(data);
        } else if (type === L.MODAL_KEYS.SWAP) {
            success = await swapProduct(
                activeGroup.order,
                activeGroup.itemIndex,
                data.newProduct
            );
        }

        if (success) {
            setModalState(prev => ({ ...prev, [type]: false }));
            setActiveGroup(null);
        }
    };

    return { handleLogisticsAction, confirmModalAction };
};