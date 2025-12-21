import { useState } from 'react';

export const useSelection = (items = []) => {
    const [selectedIds, setSelectedIds] = useState([]);

    const toggleSelect = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (selectedIds.length === items.length && items.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(items.map(item => item.id));
        }
    };

    const clearSelection = () => setSelectedIds([]);

    return { selectedIds, toggleSelect, toggleAll, clearSelection };
};