import { useState } from 'react';
import Button from './Button';
import Modal from './Modal';
import { useUI } from '../context/UIContext';

// Funciones auxiliares para CSV
const convertToCSV = (objArray) => {
    const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
    if (!array || !array.length) return '';
    const headers = Object.keys(array[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));
    for (const row of array) {
        const values = headers.map(header => {
            let val = row[header];
            if (val === null || val === undefined) val = '';
            const stringVal = ('' + val).replace(/"/g, '""');
            return `"${stringVal}"`;
        });
        csvRows.push(values.join(','));
    }
    return csvRows.join('\n');
};

const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const result = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const regex = /(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^",]*))/g;
        const currentline = [];
        let match;
        while (match = regex.exec(lines[i])) {
            let val = match[1] ? match[1].replace(/""/g, '"') : match[2];
            currentline.push(val);
        }
        if (currentline.length > headers.length) currentline.pop();
        const obj = {};
        for (let j = 0; j < headers.length; j++) {
            obj[headers[j]] = currentline[j] || '';
        }
        result.push(obj);
    }
    return result;
};

const BulkActions = ({ type, data, onImport, sampleData }) => {
    const { notify } = useUI();
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [file, setFile] = useState(null);

    const handleDownloadTemplate = () => {
        const exportData = data.length > 0 ? data : sampleData;
        const cleanData = exportData.map(item => {
            // Limpieza de datos para exportación
            const { id, created_at, public_id, allocations, items, cliente, ...rest } = item;
            let formattedItem = { ...rest };

            if (type === 'Finanzas' && item.allocations) {
                formattedItem.pedidos_vinculados = item.allocations.map(a => `#${a.order_visual_id}`).join(', ');
                formattedItem.productos_pagados = item.allocations.map(a => a.item_name).join(', ');
            }
            if (type === 'Pedidos' || type === 'Logística') {
                formattedItem.cliente_nombre = item.cliente?.nombre || '';
                formattedItem.cliente_telefono = item.cliente?.telefono || '';
                formattedItem.ciudad_entrega = item.cliente?.ciudad_entrega || '';
                formattedItem.detalle_productos = (item.items || []).map(i => `${i.cantidad}x ${i.modelo} (T${i.talla || '-'})`).join(' | ');
                formattedItem.guia_numero = (item.items || [])[0]?.guia?.numero || '';
            }
            return formattedItem;
        });

        const csv = convertToCSV(cleanData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${type}_data_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
    };

    const processImport = async () => {
        if (!file) return notify("Selecciona un archivo", "error");
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target.result;
                const parsedData = parseCSV(text);
                if (!parsedData.length) return notify("Archivo vacío", "error");
                await onImport(parsedData);
                setImportModalOpen(false);
                setFile(null);
            } catch (err) { notify("Error: " + err.message, "error"); }
        };
        reader.readAsText(file);
    };

    return (
        <div className="flex gap-2">
            <Button variant="secondary" onClick={handleDownloadTemplate} icon="Download" className="px-2 h-9" title="Exportar CSV">Exp</Button>
            <Button variant="secondary" onClick={() => setImportModalOpen(true)} icon="Upload" className="px-2 h-9" title="Importar CSV">Imp</Button>
            <Modal isOpen={importModalOpen} onClose={() => setImportModalOpen(false)} title={`Importar ${type}`}>
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">Sube un CSV. <br /><b>Nota:</b> Si el archivo tiene una columna "id", se actualizarán esos registros.</p>
                    <input type="file" accept=".csv" onChange={e => setFile(e.target.files[0])} className="w-full border p-2 rounded" />
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setImportModalOpen(false)}>Cancelar</Button>
                        <Button onClick={processImport}>Procesar</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default BulkActions;