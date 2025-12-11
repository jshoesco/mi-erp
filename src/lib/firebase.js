import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
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
  runTransaction 
} from "firebase/firestore";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";

// ... (imports anteriores siguen igual)

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore con la configuración para evitar errores de conexión
const db = initializeFirestore(app, {
    experimentalForceLongPolling: true
});

const auth = getAuth(app);

// Exportamos las herramientas para usarlas en los otros archivos
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
  runTransaction,
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged
};