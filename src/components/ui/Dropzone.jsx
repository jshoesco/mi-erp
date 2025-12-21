import React, { useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { IconPhotoPlus, IconLoader2, IconX, IconClipboard } from '@tabler/icons-react';

const Dropzone = ({ value, onChange, loading }) => {
    
    const onDrop = useCallback(files => {
        if (files.length > 0) onChange(files[0]);
    }, [onChange]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        multiple: false
    });

    // 1. Función para leer el portapapeles (Boton o Ctrl+V)
    const handleClipboard = async (items) => {
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith('image/')) {
                const file = items[i] instanceof DataTransferItem ? items[i].getAsFile() : items[i];
                if (file) onChange(file);
                break;
            }
        }
    };

    // 2. Evento de Pegar (Teclado)
    useEffect(() => {
        const onPaste = (e) => handleClipboard(e.clipboardData.items);
        window.addEventListener('paste', onPaste);
        return () => window.removeEventListener('paste', onPaste);
    }, [onChange]);

    // 3. Función del Botón de Pegar (Clic)
    const pasteFromClick = async (e) => {
        e.stopPropagation(); // Evita abrir el selector de archivos
        try {
            const clipboardItems = await navigator.clipboard.read();
            for (const item of clipboardItems) {
                const imageTypes = item.types.filter(type => type.startsWith('image/'));
                if (imageTypes.length > 0) {
                    const blob = await item.getType(imageTypes[0]);
                    onChange(blob);
                    break;
                }
            }
        } catch (err) {
            alert("No se pudo acceder al portapapeles. Asegúrate de dar permisos.");
        }
    };

    return (
        <div {...getRootProps()} className={`relative h-44 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${isDragActive ? 'border-brand-red bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}>
            <input {...getInputProps()} />
            
            {loading ? (
                <div className="flex flex-col items-center">
                    <IconLoader2 className="animate-spin text-brand-red" size={30} />
                    <span className="text-[10px] font-black text-brand-red mt-2 uppercase italic">Subiendo a la nube...</span>
                </div>
            ) : value ? (
                <div className="relative h-full w-full p-3">
                    <img src={value} className="h-full w-full object-contain rounded-xl" alt="Preview" />
                    <button 
                        onClick={(e) => { e.stopPropagation(); onChange(null); }} 
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-xl hover:scale-110 transition-transform"
                    >
                        <IconX size={16} />
                    </button>
                </div>
            ) : (
                <div className="flex flex-col items-center p-4">
                    <IconPhotoPlus className="text-gray-300 mb-2" size={40} />
                    <span className="text-[11px] font-bold text-gray-400 uppercase text-center mb-4 leading-tight">
                        Arrastra una imagen o<br/>selecciona un archivo
                    </span>
                    
                    <button 
                        onClick={pasteFromClick}
                        className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm hover:shadow-md hover:border-brand-red transition-all group"
                    >
                        <IconClipboard size={16} className="text-gray-400 group-hover:text-brand-red" />
                        <span className="text-[10px] font-black text-gray-600 group-hover:text-brand-red uppercase">Pegar Imagen</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default Dropzone;