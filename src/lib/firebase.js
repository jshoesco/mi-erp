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

const firebaseConfig = {
    apiKey: "AIzaSyBaAlVJUSUcybQg-8eSM4n8vljURSgvubo",
    authDomain: "erp-v3-3a93c.firebaseapp.com",
    projectId: "erp-v3-3a93c",
    storageBucket: "erp-v3-3a93c.firebasestorage.app",
    messagingSenderId: "779319215390",
    appId: "1:779319215390:web:1ab5f01acb87c8a678f50f"
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