import { initializeApp } from "firebase/app";
import { 
  initializeFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  writeBatch, 
  where, 
  getDoc, 
  setDoc,
  runTransaction 
} from "firebase/firestore";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// 1. Inicializar la App
const app = initializeApp(firebaseConfig);

// 2. Inicializar Firestore (SOLO UNA VEZ) con el fix de Long Polling
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

// 3. Inicializar Auth
const auth = getAuth(app);

// 4. Exportar TODO de un solo golpe
export { 
  db, 
  auth, 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  writeBatch, 
  where, 
  getDoc, 
  setDoc,
  runTransaction,
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged
};