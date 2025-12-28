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
  runTransaction,
  serverTimestamp // <--- INDISPENSABLE PARA TUS PRODUCTOS
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

const app = initializeApp(firebaseConfig);

const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

const auth = getAuth(app);

// AQUÍ ESTABA TU ERROR: Faltaba 'auth' y 'serverTimestamp' en la salida
export {
  db,
  auth, // <--- AHORA SÍ DISPONIBLE PARA LOGINSCREEN
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
  serverTimestamp, // <--- AHORA SÍ DISPONIBLE PARA USEINVENTORY
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};