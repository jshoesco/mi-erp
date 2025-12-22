import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { IconPhoto, IconUpload, IconX, IconLoader2 } from '@tabler/icons-react';
import { uploadToCloudinary } from '../../lib/utils';
import { useData } from '../../context/DataContext';

const Dropzone = ({ value, onChange, label = "Imagen del Producto" }) => {
    const [loading, setLoading] = useState(false);
    const { generalConfig } = useData(); // Obtenemos la config de Cloudinary globalmente

    const onDrop = useCallback(async (acceptedFiles) => {
        if (acceptedFiles.length === 0) return;

        const file = acceptedFiles[0];
        const cloudConfig = generalConfig?.[0];

        if (!cloudConfig?.cloud_name) {
            alert("Error: Configuración de Cloudinary no encontrada.");
            return;
        }

        setLoading(true);
        try {
            // El componente se encarga de la subida
            const res = await uploadToCloudinary(file, cloudConfig, `IMG-${Date.now()}`);
            onChange(res.secure_url); // Devolvemos la URL limpia al padre
        } catch (error) {
            console.error("Error subiendo imagen:", error);
            alert("Error al subir la imagen.");
        } finally {
            setLoading(false);
        }
    }, [generalConfig, onChange]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        multiple: false,
        disabled: loading
    });

    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">
                {label}
            </label>

            <div
                {...getRootProps()}
                className={`
                    relative h-48 rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden
                    ${isDragActive ? 'border-brand-red bg-red-50' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}
                    ${loading ? 'cursor-wait opacity-70' : ''}
                `}
            >
                <input {...getInputProps()} />

                {value ? (
                    <div className="relative h-full w-full group">
                        <img src={value} alt="Preview" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <IconUpload className="text-white" size={32} />
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); onChange(''); }}
                            className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-lg text-red-500 hover:scale-110 transition-transform"
                        >
                            <IconX size={16} />
                        </button>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2 p-4 text-center">
                        {loading ? (
                            <IconLoader2 size={32} className="animate-spin text-brand-red" />
                        ) : (
                            <IconPhoto size={32} />
                        )}
                        <p className="text-[10px] font-bold uppercase tracking-tight">
                            {loading ? "Subiendo archivo..." : "Arrastra o haz clic para subir"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dropzone;