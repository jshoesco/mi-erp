import { firebaseBatch } from '../lib/batchActions';
import { useUI } from '../context/UIContext';

export const useBatchActions = (collectionName) => {
    const { notify } = useUI();

    const archiveItems = async (ids, field, shouldArchive = true) => {
        try {
            await firebaseBatch.updateField(collectionName, ids, field, shouldArchive);
            notify(shouldArchive ? "Elementos archivados" : "Elementos restaurados", "success");
        } catch (error) {
            notify("Error en la operación masiva", "error");
        }
    };

    const deleteItems = async (ids) => {
        try {
            await firebaseBatch.deleteMany(collectionName, ids);
            notify("Elementos eliminados permanentemente", "success");
        } catch (error) {
            notify("Error al eliminar elementos", "error");
        }
    };

    return { archiveItems, deleteItems };
};