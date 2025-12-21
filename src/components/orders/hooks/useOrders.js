import { useState, useMemo } from 'react';
import { useData } from '../../../context/DataContext';
import { useUI } from '../../../context/UIContext';
import { getSalesKanban, getLogisticsKanban } from '../utils/orderHelpers';
import { deleteOrdersBatch } from '../utils/orderActions';

export const useOrders = () => {
    const { orders, loading, financeConfig, anomalyConfigData } = useData();
    const { notify } = useUI();

    const [tab, setTab] = useState('sales');
    const [searchText, setSearchText] = useState('');
    const [selection, setSelection] = useState({ mode: false, ids: [] });
    const [isDeleting, setIsDeleting] = useState(false);
    
    const [modals, setModals] = useState({ 
        form: { open: false, data: null }, 
        link: { open: false, data: null }, 
        guide: { open: false, data: null }, 
        payment: { open: false, data: [] }, 
        anomaly: { open: false, data: null } 
    });

    // CABLEADO: Pasamos searchText a ambos helpers y lo ponemos en dependencias
    const kanbanData = useMemo(() => ({
        sales: getSalesKanban(orders, searchText),
        logistics: getLogisticsKanban(orders, searchText)
    }), [orders, searchText]);

    const ui = {
        openModal: (name, data = null) => setModals(p => ({ ...p, [name]: { open: true, data } })),
        closeModal: (name) => setModals(p => ({ ...p, [name]: { ...p[name], open: false } })),
        toggleTab: (t) => { setTab(t); setSelection({ mode: false, ids: [] }); },
        toggleSelectionMode: () => setSelection(p => ({ mode: !p.mode, ids: [] })),
        handleSelect: (id) => setSelection(p => ({ ...p, ids: p.ids.includes(id) ? p.ids.filter(x => x !== id) : [...p.ids, id] })),
        handleBatchDelete: async () => {
            if (!window.confirm(`¿Eliminar ${selection.ids.length} pedidos?`)) return;
            setIsDeleting(true);
            try {
                await deleteOrdersBatch(selection.ids);
                notify("Borrado masivo completado");
                setSelection({ mode: false, ids: [] });
            } catch (e) { notify(e.message, "error"); }
            finally { setIsDeleting(false); }
        }
    };

    return { 
        orders, loading, tab, searchText, setSearchText, selection, 
        isDeleting, modals, kanbanData, ui, 
        config: { financeMethods: financeConfig?.methods || [], anomalyReasons: anomalyConfigData } 
    };
};