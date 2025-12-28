import { useState, useMemo, useEffect, useCallback } from 'react';
import { useData } from '../../../../../../../context/DataContext';
import { SCHEMA } from '../../../../../../../constants/schema';

export const useCustomerLogic = (form, setForm) => {
    const { coverage, orders } = useData();
    const [activeField, setActiveField] = useState(null);

    const S = SCHEMA.ORDERS;
    const C = S.CLIENT;
    const COV = SCHEMA.COVERAGE;

    // 1. SINCRONIZACIÓN DE TARIFA Y ESTRATEGIA (Basado en SCHEMA)
    useEffect(() => {
        const currentCity = form[C.ROOT]?.[C.CITY];
        if (currentCity && coverage) {
            const cityData = coverage.find(c =>
                c[COV.CITY]?.toLowerCase() === currentCity?.toLowerCase()
            );

            if (cityData) {
                const tieneAcopio = cityData[COV.IS_ACOPIO] || false;
                const tarifaVigente = Number(cityData[COV.TARIFF] || 0);

                // Solo disparamos el setForm si hay una discrepancia real con el Schema
                const requiereUpdate =
                    form[C.ROOT]?.[C.IS_ACOPIO] !== tieneAcopio ||
                    Number(form[S.SHIPPING_COST]) !== tarifaVigente;

                if (requiereUpdate) {
                    setForm(prev => ({
                        ...prev,
                        [S.SHIPPING_COST]: tarifaVigente,
                        [S.STRATEGY]: prev[S.STRATEGY] || (tieneAcopio ? 'ACOPIO' : 'DIRECTO'),
                        [C.ROOT]: {
                            ...prev[C.ROOT],
                            [C.IS_ACOPIO]: tieneAcopio
                        }
                    }));
                }
            }
        }
    }, [form[C.ROOT]?.[C.CITY], coverage, setForm, S, C, COV]);

    // 2. SUGERENCIAS DE CLIENTES
    const clientSuggestions = useMemo(() => {
        const queryName = (form[C.ROOT]?.[C.NAME] || "").toLowerCase().trim();
        const queryTel = (form[C.ROOT]?.[C.TEL] || "").toLowerCase().trim();

        if (!activeField || activeField === 'ciudad' || (queryName.length < 1 && queryTel.length < 1) || !orders) {
            return [];
        }

        const uniqueClients = [];
        const seen = new Set();

        for (const o of orders) {
            const c = o[C.ROOT];
            if (!c?.[C.NAME] || !c?.[C.TEL]) continue;

            const key = `${c[C.NAME].toLowerCase()}-${c[C.TEL]}`;
            if (seen.has(key)) continue;

            const nameMatch = c[C.NAME].toLowerCase().includes(queryName);
            const telMatch = c[C.TEL].toLowerCase().includes(queryTel);

            if ((activeField === 'nombre' && nameMatch) || (activeField === 'telefono' && telMatch)) {
                uniqueClients.push(c);
                seen.add(key);
            }
            if (uniqueClients.length >= 5) break;
        }
        return uniqueClients;
    }, [orders, form[C.ROOT], activeField, C]);

    // 3. SUGERENCIAS DE CIUDADES
    const citySuggestions = useMemo(() => {
        const queryCity = (form[C.ROOT]?.[C.CITY] || "").toLowerCase().trim();
        if (activeField !== 'ciudad' || queryCity.length < 1 || !coverage) return [];

        return coverage.filter(c =>
            c[COV.CITY].toLowerCase().includes(queryCity) ||
            c[COV.CODE].toLowerCase().includes(queryCity)
        ).slice(0, 5);
    }, [coverage, form[C.ROOT], activeField, COV]);

    // --- ACCIONES DE SELECCIÓN CON SCHEMA ---

    const handleSelectClient = (client) => {
        setForm(prev => ({
            ...prev,
            [C.ROOT]: {
                ...prev[C.ROOT],
                [C.NAME]: client[C.NAME] || '',
                [C.TEL]: client[C.TEL] || '',
                [C.ADDRESS]: client[C.ADDRESS] || '',
                [C.CITY]: client[C.CITY] || prev[C.ROOT]?.[C.CITY] || ''
            }
        }));
        setTimeout(() => setActiveField(null), 50);
    };

    const handleSelectCity = (city) => {
        const tieneAcopio = city[SCHEMA.COVERAGE.IS_ACOPIO] || false;

        setForm(prev => ({
            ...prev,
            [SCHEMA.ORDERS.SHIPPING_COST]: Number(city[SCHEMA.COVERAGE.TARIFF] || 0),
            [SCHEMA.ORDERS.STRATEGY]: tieneAcopio ? 'ACOPIO' : 'DIRECTO', // Usa 'estrategia'
            [SCHEMA.ORDERS.CLIENT.ROOT]: {
                ...prev[SCHEMA.ORDERS.CLIENT.ROOT],
                [SCHEMA.ORDERS.CLIENT.CITY]: city[SCHEMA.COVERAGE.CITY],
                [SCHEMA.ORDERS.CLIENT.IS_ACOPIO]: tieneAcopio // Usa 'es_acopio'
            },
            paqueteria: city[SCHEMA.COVERAGE.CARRIER] || 'Interrapidisimo'
        }));

        setTimeout(() => setActiveField(null), 50);
    };

    const updateClientField = (field, value) => {
        if (activeField !== field) setActiveField(field);
        setForm(prev => ({
            ...prev,
            [C.ROOT]: { ...(prev[C.ROOT] || {}), [field]: value }
        }));
    };

    const setLogisticaModo = (modo) => {
        setForm(prev => ({ ...prev, [S.STRATEGY]: modo }));
    };

    const handleBlur = useCallback(() => {
        setTimeout(() => setActiveField(null), 250);
    }, []);

    return {
        activeField,
        setActiveField,
        clientSuggestions,
        citySuggestions,
        handleSelectClient,
        handleSelectCity,
        updateClientField,
        setLogisticaModo,
        handleBlur
    };
};