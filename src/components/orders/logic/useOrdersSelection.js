import { useState } from 'react';

export const useOrdersSelection = () => {
    const [selectedIds, setSelectedIds] = useState([]);

    const toggle = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const clear = () => setSelectedIds([]);

    return { selectedIds, toggle, clear };
};