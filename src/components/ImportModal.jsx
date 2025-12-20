import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import Icon from './Icon';
import { parseInventoryExcel } from '../lib/inventoryActions';
import { db, collection, addDoc } from '../lib/firebase';

const ImportModal = ({ isOpen, onClose, notify, providers }) => {
    const [previewData, setPreviewData] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const json = await parseInventoryExcel(file);
            // Validamos que el Excel tenga las columnas mínimas
            const validated = json.map(row => ({
                fecha: row.Fecha || new Date().toISOString().slice(0, 10),
                sku: row.SKU || `AUTO-${Math.floor(1000 + Math.random() * 9000)}`,
                marca: row.Marca || '',
                modelo: row.Modelo || '',
                nombre: row.Nombre || '',
                costo: Number(row.Costo) || 0,
                precio: Number(row.Precio) || 0,
                ganancia: Number(row.Ganancia) || 0,
                status: 'Activo'
            }));
            setPreviewData(validated);
        } catch (err) {
            notify?.("Error al leer el Excel", "error");
        }
    };

    const handleImport = async () => {
        setLoading(true);
        try {
            const batch = previewData.map(prod => 
                addDoc(collection(db, 'productos'), {
                    ...prod,
                    created_at: new Date().toISOString()
                })
            );
            await Promise.all(batch);
            notify?.(`Se importaron ${previewData.length} productos con éxito`);
            setPreviewData([]);
            onClose();
        } catch (err) {
            notify?.("Error al subir a la base de datos", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Importación Masiva (Excel)">
            <div className="space-y-4">
                {!previewData.length ? (
                    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 bg-gray-50">
                        <Icon name="FileSpreadsheet" size={48} className="text-emerald-500" />
                        <div className="text-center">
                            <p className="text-sm font-bold text-gray-700">Selecciona tu archivo Excel</p>
                            <p className="text-xs text-gray-400">Columnas requeridas: Marca, Modelo, Precio, Costo</p>
                        </div>
                        <input 
                            type="file" 
                            accept=".xlsx, .xls" 
                            onChange={handleFileChange}
                            className="hidden" 
                            id="excel-upload"
                        />
                        <label 
                            htmlFor="excel-upload" 
                            className="bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold text-sm cursor-pointer hover:bg-emerald-600 transition-colors"
                        >
                            Buscar Archivo
                        </label>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="max-h-60 overflow-y-auto border rounded-xl">
                            <table className="w-full text-[10px] text-left">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="p-2">SKU</th>
                                        <th className="p-2">Modelo</th>
                                        <th className="p-2">Precio</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.map((p, i) => (
                                        <tr key={i} className="border-t">
                                            <td className="p-2 font-mono">{p.sku}</td>
                                            <td className="p-2">{p.modelo}</td>
                                            <td className="p-2">${p.precio.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-between items-center bg-blue-50 p-3 rounded-xl border border-blue-100">
                            <span className="text-xs font-bold text-blue-700">
                                Se cargarán {previewData.length} productos
                            </span>
                            <div className="flex gap-2">
                                <Button variant="secondary" onClick={() => setPreviewData([])}>Limpiar</Button>
                                <Button onClick={handleImport} disabled={loading} className="bg-emerald-500 text-white">
                                    {loading ? 'Procesando...' : 'Confirmar Subida'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ImportModal;