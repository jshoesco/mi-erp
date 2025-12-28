import { useState, useCallback } from 'react';

export const useSelection = () => {
    const [selectedIds, setSelectedIds] = useState([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    const toggle = useCallback((id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    }, []);

    const clear = useCallback(() => {
        setSelectedIds([]);
        setIsSelectionMode(false);
    }, []);

    const toggleMode = useCallback(() => {
        setIsSelectionMode(prev => {
            const next = !prev;
            if (!next) setSelectedIds([]); // Si apagas el modo, limpias la selección
            return next;
        });
    }, []);

    return {
        selectedIds,
        isSelectionMode,
        toggle,
        clear,
        toggleMode
    };
};