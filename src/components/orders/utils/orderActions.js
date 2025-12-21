import { db } from '../../../lib/firebase';
import { doc, writeBatch } from 'firebase/firestore';

export const deleteOrdersBatch = async (selectedIds) => {
    const batch = writeBatch(db);
    selectedIds.forEach(id => {
        batch.delete(doc(db, 'pedidos', id));
    });
    return await batch.commit();
};