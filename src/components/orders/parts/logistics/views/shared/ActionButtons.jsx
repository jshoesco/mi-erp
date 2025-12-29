import React from 'react';
import { Button } from '../../../../../ui/display/Button';

export const ActionButtons = ({ status, onAction, groupType, isGrouped }) => {
    // Normalizamos el estado para evitar fallos por mayúsculas
    const normalizedStatus = status?.toLowerCase().trim();

    return (
        <div className="flex gap-2 w-full justify-end">
            {/* ACCIÓN: DESVINCULAR LOTE (Solo si es un grupo manual o acopio automático con más de 1 pedido) */}
            {isGrouped && (normalizedStatus === 'pago-pendiente' || normalizedStatus === 'por-despachar') && (
                <Button
                    variant="ghost"
                    className="text-[10px] font-black h-7 px-3 text-red-500 hover:bg-red-50 border-red-100"
                    onClick={() => onAction('unveiled_group')}
                >
                    DESHACER LOTE
                </Button>
            )}

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