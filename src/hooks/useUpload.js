import { useState } from 'react';
import { db, collection, getDocs } from '../lib/firebase';

export const useUpload = () => {
    const [loading, setLoading] = useState(false);

    const uploadImage = async (file, customName) => {
        if (!file) return null;
        setLoading(true);

        try {
            // Traemos la config directo de Firebase sin hooks intermedios
            const querySnapshot = await getDocs(collection(db, 'config_general'));
            if (querySnapshot.empty) {
                console.error("No hay configuración de Cloudinary en Firebase");
                return null;
            }
            const config = querySnapshot.docs[0].data();
            const { cloud_name, upload_preset, cloudinary_folder } = config;

            const fileName = customName || `prod_${Date.now()}`;
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', upload_preset);
            formData.append('folder', cloudinary_folder);
            formData.append('public_id', fileName);

            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            return data.secure_url;
        } catch (err) {
            console.error("Error crítico en subida:", err);
            return null;
        } finally {
            setLoading(false);
        }
    };

    return { uploadImage, loading };
};