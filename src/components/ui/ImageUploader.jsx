import React, { useState, useRef } from 'react';
import Icon, { Spinner } from './Icon';
import { uploadToCloudinary } from '../../lib/utils';
import { useData } from '../../context/DataContext';
import { useUI } from '../../context/UIContext';

const ImageUploader = ({ onFileSelect, label = "Subir Imagen", currentImg = "" }) => {
    const { generalConfig } = useData();
    const { notify } = useUI();
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!generalConfig?.cloud_name) {
            return notify("Falta configuración de Cloudinary en Ajustes", "error");
        }

        setUploading(true);
        try {
            const res = await uploadToCloudinary(file, generalConfig, `ERP-${Date.now()}`);
            onFileSelect(res.secure_url); // Le pasamos la URL al padre
            notify("Imagen subida con éxito");
        } catch (e) {
            notify("Error al subir: " + e.message, "error");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</label>
            <div 
                onClick={() => !uploading && fileInputRef.current.click()}
                className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all ${
                    uploading ? 'bg-gray-50 border-gray-200' : 'hover:border-brand-red hover:bg-red-50 border-gray-300'
                }`}
            >
                <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept="image/*" />
                
                {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                        <Spinner className="text-brand-red" />
                        <span className="text-[10px] font-bold text-gray-400">SUBIENDO...</span>
                    </div>
                ) : currentImg ? (
                    <img src={currentImg} alt="Preview" className="h-20 w-20 object-cover rounded-lg shadow-sm" />
                ) : (
                    <>
                        <Icon name="Camera" size={24} className="text-gray-400 mb-1" />
                        <span className="text-[10px] font-bold text-gray-400">CLICK PARA SUBIR</span>
                    </>
                )}
            </div>
        </div>
    );
};

export default ImageUploader;