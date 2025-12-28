import { db } from './firebase';
import { doc, writeBatch } from 'firebase/firestore';

export const firebaseBatch = {
    updateField: async (collectionName, ids, field, value) => {
        const batch = writeBatch(db);
        ids.forEach(id => {
            const ref = doc(db, collectionName, id);
            batch.update(ref, { [field]: value });
        });
        return await batch.commit();
    },
    deleteMany: async (collectionName, ids) => {
        const batch = writeBatch(db);
        ids.forEach(id => {
            const ref = doc(db, collectionName, id);
            batch.delete(ref);
        });
        return await batch.commit();
    }
};