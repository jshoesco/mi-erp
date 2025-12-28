import { useState, useEffect } from 'react';
import { db, collection, query, onSnapshot } from '../lib/firebase';

export const useCollection = (collectionName) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!collectionName) return;

        // SUSCRIPCIÓN ÚNICA Y LIMPIA
        const q = query(collection(db, collectionName));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setData(docs);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching collection:", err);
            setError(err);
            setLoading(false);
        });

        // LIMPIEZA AL DESMONTAR
        return () => unsubscribe();
    }, [collectionName]);

    return { data, loading, error };
};

export default useCollection;