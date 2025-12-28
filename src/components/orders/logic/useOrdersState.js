import { useState } from 'react';

export const useOrdersState = () => {
    const [tab, setTab] = useState('sales');
    const [search, setSearch] = useState('');

    return { tab, setTab, search, setSearch };
};