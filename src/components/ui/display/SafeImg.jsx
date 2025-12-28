import React, { useState, useEffect } from 'react';
import Icon from './Icon';

const SafeImg = ({ src, alt, className = "", fallbackIcon = "Image" }) => {
    const [error, setError] = useState(false);

    // Si cambia el src, reseteamos el error para intentar cargar la nueva imagen
    useEffect(() => {
        setError(false);
    }, [src]);

    if (!src || error) {
        return (
            <div className={`flex items-center justify-center bg-gray-100 border border-gray-200 text-gray-300 ${className}`}>
                <Icon name={fallbackIcon} size={24} />
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt || "Imagen"}
            className={`object-cover ${className}`}
            onError={() => setError(true)}
        />
    );
};

export default SafeImg;