import { useState, useEffect, useMemo } from 'react';
import Icon, { Spinner } from './Icon';
import { compressImage } from '../lib/utils';

const ImageUploader = ({ image, onFileSelect, loading, onClear }) => {
    const [isDragging, setIsDragging] = useState(false);
    const inputId = useMemo(() => `file-input-${Math.random().toString(36).substr(2, 9)}`, []);

    useEffect(() => {
        const handlePaste = (e) => {
            const tag = document.activeElement?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
            if (e.clipboardData && e.clipboardData.files.length > 0) { e.preventDefault(); if (e.clipboardData.files[0].type.startsWith('image/')) onFileSelect(e.clipboardData.files[0]); }
        };
        window.addEventListener('paste', handlePaste); return () => window.removeEventListener('paste', handlePaste);
    }, [onFileSelect]);

    const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) onFileSelect(e.dataTransfer.files[0]); };
    const handleButtonClick = (e) => { e.stopPropagation(); document.getElementById(inputId).click(); };

    return (
        <div 
            // CAMBIO: Bordes grises o rojos, nada de indigo
            className={`relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center h-48 cursor-pointer transition-all group ${isDragging ? 'border-brand-red bg-red-50' : 'border-slate-300 hover:border-brand-red hover:bg-slate-50 bg-white'}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onDrop={handleDrop}
            onClick={handleButtonClick}
        >
            <input id={inputId} type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && onFileSelect(e.target.files[0])} />

            {loading ? (
                <div className="flex flex-col items-center text-brand-red gap-2">
                    <Spinner /> <span className="text-xs font-bold">Subiendo...</span>
                </div>
            ) : image ? (
                <div className="relative w-full h-full">
                    <img src={image} className="w-full h-full object-contain rounded-lg" alt="Preview" />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg backdrop-blur-sm">
                        <p className="text-white text-xs font-bold flex items-center gap-1 border border-white/50 px-3 py-1.5 rounded-full">
                            <Icon name="Edit" size={14} /> Cambiar Imagen
                        </p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); if (onClear) onClear(); }} className="absolute top-2 right-2 p-1.5 bg-brand-red text-white rounded-full shadow-lg hover:scale-110 transition-transform z-10"><Icon name="Trash2" size={16} /></button>
                </div>
            ) : (
                <div className="text-slate-400 pointer-events-none flex flex-col items-center group-hover:text-slate-600 transition-colors">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-red-50 group-hover:text-brand-red transition-colors">
                         <Icon name="Image" size={24} />
                    </div>
                    <p className="text-xs font-bold mb-1 text-slate-700">Arrastra o Pega (Ctrl+V)</p>
                    <span className="text-[10px] text-slate-400">Soporta JPG, PNG</span>
                </div>
            )}
        </div>
    );
};

export default ImageUploader;