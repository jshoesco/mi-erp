import * as XLSX from 'xlsx';

export const exportToExcel = (products, selectedColumns) => {
    if (!products.length || !selectedColumns.length) return;

    // Filtramos los datos basándonos solo en las columnas seleccionadas
    const data = products.map(p => {
        const row = {};
        selectedColumns.forEach(col => {
            // Mapeo de nombre de campo a nombre legible en el Excel
            const label = col.header;
            const field = col.field;
            
            if (field === 'precio' || field === 'costo' || field === 'ganancia') {
                row[label] = Number(p[field]) || 0;
            } else {
                row[label] = p[field] || '';
            }
        });
        return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario Custom");
    XLSX.writeFile(wb, `Inventario_Personalizado_${new Date().toISOString().slice(0,10)}.xlsx`);
};

// Función para leer un archivo Excel y convertirlo en una lista de objetos
export const parseInventoryExcel = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);
                resolve(json);
            } catch (err) {
                reject("Error al procesar el archivo Excel");
            }
        };
        reader.onerror = () => reject("Error de lectura");
        reader.readAsArrayBuffer(file);
    });
};