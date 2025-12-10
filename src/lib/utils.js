// src/lib/utils.js

export const formatCurrency = (val) => {
    return val ? '$' + parseInt(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : '$0';
};

export const normalizeText = (text) => {
    if (!text) return "indefinido";
    return text.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
};

export const compressImage = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1024;
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => {
                    if (blob) resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
                    else reject(new Error("Error comprimiendo"));
                }, 'image/jpeg', 0.8);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

export const uploadToCloudinary = async (file, config, publicId, folderOverride) => {
    if (!config.cloud_name || !config.upload_preset) throw new Error("Falta configuración de Cloudinary");
    
    const compressedFile = await compressImage(file);
    const formData = new FormData();
    formData.append('file', compressedFile);
    formData.append('upload_preset', config.upload_preset);
    
    const folder = folderOverride || config.cloudinary_folder;
    if (folder) formData.append('folder', folder);
    if (publicId) formData.append('public_id', publicId);
    
    const res = await fetch(`https://api.cloudinary.com/v1_1/${config.cloud_name}/image/upload`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error("Error subiendo imagen");
    
    return await res.json();
};

export const generateSignature = async (params, apiSecret) => {
    const sortedKeys = Object.keys(params).sort();
    const stringToSign = sortedKeys.map(key => `${key}=${params[key]}`).join('&') + apiSecret;
    const msgBuffer = new TextEncoder().encode(stringToSign);
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
};

export const deleteFromCloudinary = async (publicId, config) => {
    if (!config.api_key || !config.api_secret || !publicId) return false;
    try {
        const timestamp = Math.round((new Date()).getTime() / 1000);
        const signature = await generateSignature({ public_id: publicId, timestamp: timestamp }, config.api_secret);
        const formData = new FormData();
        formData.append('public_id', publicId);
        formData.append('api_key', config.api_key);
        formData.append('timestamp', timestamp);
        formData.append('signature', signature);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${config.cloud_name}/image/destroy`, { method: 'POST', body: formData });
        const data = await res.json();
        return data.result === 'ok';
    } catch (e) { return false; }
};

export const copyToClipboard = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (e) {
        return false;
    }
};