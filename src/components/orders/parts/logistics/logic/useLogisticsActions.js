import { SCHEMA } from '../../../../../constants/schema';

export const useLogisticsActions = (orders, ui, setModalState, setActiveGroup) => {
    const L = SCHEMA.LOGISTICS;

    const handleLogisticsAction = async (type, data) => {
        switch (type) {
            case L.ACTIONS.PAY:
                setActiveGroup(data);
                setModalState(prev => ({ ...prev, [L.MODAL_KEYS.PAYMENT]: true }));
                break;

            case L.ACTIONS.GUIDE:
                setActiveGroup(data);
                setModalState(prev => ({ ...prev, [L.MODAL_KEYS.SHIPPING]: true }));
                break;

            case L.ACTIONS.OPEN_SWAP:
                setActiveGroup(data);
                setModalState(prev => ({ ...prev, [L.MODAL_KEYS.SWAP]: true }));
                break;

            default:
                // CUALQUIER OTRA COSA (JOIN, SPLIT, UNVEIL) NO HACE NADA.
                break;
        }
    };

    const confirmModalAction = async (type, data, activeGroup) => {
        return { success: true };
    };

    return { handleLogisticsAction, confirmModalAction };
};