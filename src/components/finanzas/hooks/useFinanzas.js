import { useState, useMemo } from 'react';
import useCollection from '../../../hooks/useCollection';
import { useUI } from '../../../context/UIContext';

export const useFinanzas = () => {
    const { data: rawTransactions } = useCollection('finanzas');
    const { data: finConfigData } = useCollection('config_finanzas');
    const { notify } = useUI();

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null); // <-- Faltaba esto
    const [filter, setFilter] = useState('');

    const stats = useMemo(() => {
        const ingresos = rawTransactions.filter(t => t.tipo === 'INGRESO').reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0);
        const gastos = rawTransactions.filter(t => t.tipo === 'GASTO').reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0);
        return { ingresos, gastos, total: ingresos - gastos };
    }, [rawTransactions]);

    const transactions = useMemo(() => {
        return rawTransactions
            .filter(t => (t.descripcion || '').toLowerCase().includes(filter.toLowerCase()))
            .sort((a, b) => (b.fecha?.seconds || 0) - (a.fecha?.seconds || 0));
    }, [rawTransactions, filter]);

    return {
        transactions, stats, finConfig: finConfigData?.[0],
        filter, setFilter, isSettingsOpen, setIsSettingsOpen,
        isTransactionModalOpen, setIsTransactionModalOpen,
        editingItem, setEditingItem, notify
    };
};