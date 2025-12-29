import React, { useState } from 'react';
import { SCHEMA } from '../../../../../../constants/schema';
import Input from '../../../../../ui/forms/Input';
import { useCustomerLogic } from './logic/useCustomerLogic';

const CustomerSection = ({ form, setForm }) => {
    const S = SCHEMA.ORDERS;
    const C = S.CLIENT;

    const {
        activeField,
        clientSuggestions,
        citySuggestions,
        handleSelectClient,
        handleSelectCity,
        updateClientField,
        handleBlur
    } = useCustomerLogic(form, setForm);

    return (
        <div className="grid grid-cols-2 gap-4 relative">
            {/* NOMBRE */}
            <div className="relative">
                <Input
                    label="Nombre del Cliente"
                    value={form[C.ROOT]?.[C.NAME] || ''}
                    onChange={(e) => updateClientField(C.NAME, e.target.value)}
                    onBlur={handleBlur}
                />
                {activeField === C.NAME && clientSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full bg-white border rounded-lg shadow-xl mt-1">
                        {clientSuggestions.map((c, i) => (
                            <div key={i} className="p-2 hover:bg-slate-50 cursor-pointer text-xs uppercase" onClick={() => handleSelectClient(c)}>
                                {c[C.NAME]} ({c[C.TEL]})
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* TELÉFONO */}
            <div className="relative">
                <Input
                    label="Teléfono"
                    value={form[C.ROOT]?.[C.TEL] || ''}
                    onChange={(e) => updateClientField(C.TEL, e.target.value)}
                    onBlur={handleBlur}
                />
            </div>

            {/* CIUDAD CON SUGERENCIAS DE COBERTURA */}
            <div className="relative">
                <Input
                    label="Ciudad"
                    value={form[C.ROOT]?.[C.CITY] || ''}
                    onChange={(e) => updateClientField(C.CITY, e.target.value)}
                    onBlur={handleBlur}
                />
                {activeField === C.CITY && citySuggestions.length > 0 && (
                    <div className="absolute z-50 w-full bg-white border rounded-lg shadow-xl mt-1">
                        {citySuggestions.map((city, i) => (
                            <div key={i} className="p-2 hover:bg-slate-50 cursor-pointer text-xs uppercase font-bold" onClick={() => handleSelectCity(city)}>
                                {city[SCHEMA.COVERAGE.CITY]}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Input
                label="Dirección"
                value={form[C.ROOT]?.[C.ADDRESS] || ''}
                onChange={(e) => updateClientField(C.ADDRESS, e.target.value)}
            />
        </div>
    );
};

export default CustomerSection;