import React, { useState, useCallback, useRef } from 'react';
import Icon, { Spinner } from './display/Icon';
import { useData } from '../../context/DataContext';
import { useUI } from '../../context/UIContext';
import { TextLabel } from './display/Typography';

const Dropzone = ({ value, onChange, label = "Imagen o Comprobante" }) => {
    const { cloudConfig } = useData(); // Él solo busca la config global
    const { notify } = useUI();
    const [uploading, setUploading] = useState(false);
    const [isDragActive, setIsDragActive] = useState(false);
    const fileInputRef = useRef(null);

    const uploadFile = async (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            return notify("Solo se permiten imágenes (PNG, JPG, WEBP)", "error");
        }

        // Validación de infraestructura centralizada
        if (!cloudConfig?.cloud_name || !cloudConfig?.upload_preset) {
            return notify("Configuración Cloud incompleta. Revisa el panel de Sistema.", "error");
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', cloudConfig.upload_preset);

        // Si tienes una carpeta definida en la config global, la usamos
        if (cloudConfig.cloudinary_folder) {
            formData.append('folder', cloudConfig.cloudinary_folder);
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 seg para archivos grandes

            const res = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudConfig.cloud_name}/image/upload`,
                { method: 'POST', body: formData, signal: controller.signal }
            );

            clearTimeout(timeoutId);
            const data = await res.json();

            if (data.secure_url) {
                onChange(data.secure_url); // Devuelve la URL al componente padre
                notify("Imagen sincronizada con la nube");
            } else {
                throw new Error(data.error?.message || "Error de credenciales");
            }
        } catch (err) {
            notify(`Error: ${err.name === 'AbortError' ? 'Tiempo excedido' : err.message}`, "error");
        } finally {
            setUploading(false);
        }
    };

    // --- Lógica Genérica de Arrastrar ---
    const onDrag = (e) => {
        e.preventDefault(); e.stopPropagation();
        setIsDragActive(e.type === "dragenter" || e.type === "dragover");
    };

    const onDrop = (e) => {
        e.preventDefault(); e.stopPropagation();
        setIsDragActive(false);
        if (e.dataTransfer.files?.[0]) uploadFile(e.dataTransfer.files[0]);
    };

    // --- Lógica Genérica de Pegar (Paste) ---
    const onPaste = async (e) => {
        e.preventDefault(); e.stopPropagation();
        try {
            const items = await navigator.clipboard.read();
            for (const item of items) {
                const imgType = item.types.find(t => t.startsWith('image/'));
                if (imgType) {
                    const blob = await item.getType(imgType);
                    uploadFile(new File([blob], "pasted.png", { type: imgType }));
                    return;
                }
            }
            notify("No hay imagen en el portapapeles", "warning");
        } catch (err) {
            notify("Permiso de portapapeles requerido", "error");
        }
    };

    return (
        <div className="space-y-3 w-full">
            {label && <TextLabel className="ml-1">{label}</TextLabel>}

            <div
                onDragEnter={onDrag} onDragOver={onDrag} onDragLeave={onDrag} onDrop={onDrop}
                onClick={() => !uploading && !value && fileInputRef.current?.click()}
                className={`relative h-48 rounded-[2.5rem] border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center overflow-hidden
                ${isDragActive ? 'border-brand-red bg-red-50/50 scale-[1.01]' : 'border-slate-200 bg-slate-50/50'}
                ${value ? 'border-emerald-500 bg-emerald-50/10' : 'hover:border-slate-300 cursor-pointer'}`}
            >
                {uploading ? (
                    <div className="flex flex-col items-center gap-3">
                        <Spinner size={32} className="text-brand-red" />
                        <TextLabel className="animate-pulse">Subiendo...</TextLabel>
                    </div>
                ) : value ? (
                    <div className="group w-full h-full relative">
                        <img src={value} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                                onClick={(e) => { e.stopPropagation(); onChange(''); }}
                                className="p-4 bg-white text-red-500 rounded-2xl shadow-2xl hover:scale-110 transition-all"
                            >
                                <Icon name="Trash2" size={20} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center p-6 text-center">
                        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-400 mb-4">
                            <Icon name="UploadCloud" size={24} />
                        </div>
                        <div className="mb-4">
                            <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight">Arrastra o haz clic</p>
                            <TextLabel className="opacity-50">Soporta JPG, PNG, WEBP</TextLabel>
                        </div>
                        <button
                            type="button" onClick={onPaste}
                            className="relative z-20 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-brand-red transition-all shadow-lg active:scale-95"
                        >
                            <Icon name="Clipboard" size={12} /> Pegar Captura
                        </button>
                    </div>
                )}
                <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => uploadFile(e.target.files[0])} accept="image/*" />
            </div>
        </div>
    );
};

export default Dropzone;