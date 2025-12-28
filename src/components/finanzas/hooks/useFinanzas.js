import { useState, useMemo } from 'react';
import useCollection from '../../../hooks/useCollection';
import { useUI } from '../../../context/UIContext';
import { useTableConfig } from '../../../hooks/useTableConfig';
import { db, doc, updateDoc } from '../../../lib/firebase';

export const useFinanzas = () => {
    const { data: rawTransactions } = useCollection('finanzas');
    const { data: finConfigData } = useCollection('config_finanzas');
    const { notify } = useUI();

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [filter, setFilter] = useState('');

    const finConfig = finConfigData?.[0];

    const masterColumns = [
        { key: 'tipo', label: 'TIPO (ESTADO)', visible: true },
        { key: 'fecha', label: 'FECHA', visible: true },
        { key: 'concepto', label: 'CONCEPTO', visible: true },
        { key: 'categoria', label: 'CATEGORÍA', visible: true },
        { key: 'metodo', label: 'MÉTODO PAGO', visible: true },
        { key: 'monto', label: 'VALOR', visible: true }
    ];

    // USAMOS EL SUPER HOOK ACTUALIZADO
    const { columns, setColumns, availableKeys, saveConfig } = useTableConfig({
        masterColumns,
        data: rawTransactions,
        remoteColumns: finConfig?.columns,
        dbParams: { collection: 'config_finanzas', id: finConfig?.id }
    });

    const handleSaveConfig = async (cols) => {
        if (await saveConfig(cols)) {
            setIsSettingsOpen(false);
        }
    };

    const stats = useMemo(() => {
        const ingresos = rawTransactions?.filter(t => t.tipo === 'INGRESO').reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0) || 0;
        const gastos = rawTransactions?.filter(t => t.tipo === 'GASTO').reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0) || 0;
        return { ingresos, gastos, total: ingresos - gastos };
    }, [rawTransactions]);

    const transactions = useMemo(() => {
        return (rawTransactions || [])
            .filter(t => (t.concepto || t.descripcion || '').toLowerCase().includes(filter.toLowerCase()))
            .sort((a, b) => (b.fecha?.seconds || 0) - (a.fecha?.seconds || 0));
    }, [rawTransactions, filter]);

    return {
        transactions, stats, finConfig, filter, setFilter,
        isSettingsOpen, setIsSettingsOpen, isTransactionModalOpen, setIsTransactionModalOpen,
        editingItem, setEditingItem, notify,
        columns,
        setColumns,
        availableKeys,
        saveColumnsConfig: handleSaveConfig
    };
};