import { useEffect } from 'react';

/**
 * Hook para manejar atajos de teclado globales o locales.
 * @param {Object} shortcuts - Mapa de teclas y funciones { 'Enter': () => {}, 'Escape': () => {} }
 * @param {boolean} global - Si debe escuchar en toda la ventana o solo en el componente
 */
export const useShortcuts = (shortcuts, global = true) => {
    useEffect(() => {
        const handleKeyDown = (event) => {
            const key = event.key;
            
            // Si la tecla presionada está en nuestro mapa, ejecutamos su función
            if (shortcuts[key]) {
                // Evitamos conflictos si el usuario está escribiendo en un Input (opcional)
                // Pero como tú quieres control total, lo dejamos pasar o filtramos según necesites
                shortcuts[key](event);
            }
        };

        const target = global ? window : document;
        target.addEventListener('keydown', handleKeyDown);
        
        return () => target.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts, global]);
};