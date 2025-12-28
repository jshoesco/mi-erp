import { useMemo } from 'react';
import { useData } from '../../../context/DataContext';
import { useUI } from '../../../context/UIContext';
import { useOrdersState } from './useOrdersState';
import { useOrdersActions } from './useOrdersActions';
import { SCHEMA } from '../../../constants/schema';

export const useOrders = () => {
    const context = useData();
    const uiContext = useUI();

    const allOrders = context?.orders || [];
    const state = useOrdersState();
    const actions = useOrdersActions(uiContext?.notify);

    const orders = useMemo(() => {
        const S = SCHEMA.ORDERS;
        const isArchivedTab = state.tab === 'archived';
        return allOrders.filter(order => {
            const isArchived = order[S.ARCHIVED] === true;
            return isArchivedTab ? isArchived : !isArchived;
        });
    }, [allOrders, state.tab]);

    // CONFIGURACIÓN GENÉRICA DE BOTONES PARA LA VISTA
    const barActions = useMemo(() => [
        {
            label: state.tab === 'archived' ? 'Restaurar' : 'Archivar',
            icon: state.tab === 'archived' ? 'refresh-cw' : 'archive',
            actionType: 'archive'
        },
        {
            label: 'Eliminar',
            icon: 'trash',
            variant: 'danger',
            actionType: 'delete'
        }
    ], [state.tab]);

    return {
        orders,
        allOrders,
        barActions,
        ...state,
        actions,
        ui: {
            modal: uiContext?.modal,
            openModal: uiContext?.openModal,
            closeModal: uiContext?.closeModal
        }
    };
};