import React from 'react';
import { Button } from '../../../../../ui/display/Button';

export const ActionButtons = ({ status, onAction }) => {
    // Normalizamos el estado para evitar que una mayúscula rompa la interfaz
    const normalizedStatus = status?.toLowerCase().trim();

    return (
        <div className="flex gap-2 w-full justify-end">
            {/* ESTADO 1: PAGO AL PROVEEDOR */}
            {(normalizedStatus === 'pago-pendiente' || normalizedStatus === 'pendiente') && (
                <Button
                    variant="secondary"
                    className="text-[10px] font-black h-7 px-3 bg-amber-500 hover:bg-amber-600 text-white border-none"
                    onClick={() => onAction('pay')}
                >
                    PAGAR PROVEEDOR
                </Button>
            )}

            {/* ESTADO 2: ASIGNACIÓN DE GUÍA */}
            {normalizedStatus === 'por-despachar' && (
                <Button
                    variant="primary"
                    className="text-[10px] font-black h-7 px-3 bg-blue-600 hover:bg-blue-700 text-white border-none"
                    onClick={() => onAction('guide')}
                >
                    ASIGNAR GUÍA
                </Button>
            )}

            {/* ESTADO 3: ENTREGA FINAL */}
            {normalizedStatus === 'enviado' && (
                <Button
                    variant="success"
                    className="text-[10px] font-black h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white border-none"
                    onClick={() => onAction('deliver')}
                >
                    MARCAR ENTREGADO
                </Button>
            )}
        </div>
    );
};