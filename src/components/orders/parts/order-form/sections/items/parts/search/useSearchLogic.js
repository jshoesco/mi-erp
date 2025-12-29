import { useState, useMemo } from 'react';
import { useData } from '../../../../../../../../context/DataContext';
import { SCHEMA } from '../../../../../../../../constants/schema';

export const useSearchLogic = (onAdd) => {
    const { products } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeIndex, setActiveIndex] = useState(null);

    const P = SCHEMA.PRODUCTS;

    const suggestions = useMemo(() => {
        if (!searchTerm || searchTerm.length < 1 || !products) return [];
        const query = searchTerm.toLowerCase().trim();

        return products
            .filter(p => [P.SKU, P.REF, P.BRAND, P.VERSION].some(key =>
                String(p[key] || "").toLowerCase().includes(query)
            ))
            .slice(0, 5)
            .map(p => ({
                id: p[P.SKU],
                title: `${p[P.BRAND]} - ${p[P.VERSION] || p[P.REF]}`,
                subtitle: `SKU: ${p[P.SKU]}`,
                price: `$${Number(p[P.PRICE]).toLocaleString()}`,
                raw: p
            }));
    }, [products, searchTerm, P]);

    const handlers = {
        onChange: (e) => {
            setSearchTerm(e.target.value);
            setActiveIndex('search');
        },
        onSelect: (product) => {
            onAdd(product);
            setSearchTerm('');
            setActiveIndex(null);
        },
        onFocus: () => setActiveIndex('search'),
        onBlur: () => setTimeout(() => setActiveIndex(null), 250)
    };

    return {
        searchTerm,
        suggestions,
        isOpen: activeIndex === 'search' && suggestions.length > 0,
        handlers
    };
};