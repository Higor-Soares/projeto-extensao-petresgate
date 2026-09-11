import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    deleteDoc, 
    updateDoc,
    onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Configuração do projeto Firebase "resgtando-anjos"
const firebaseConfig = {
  apiKey: "AIzaSyBDtMGLECxagHOVLjXiTVrVds98qqlTp7c",
  authDomain: "resgtando-anjos.firebaseapp.com",
  projectId: "resgtando-anjos",
  storageBucket: "resgtando-anjos.firebasestorage.app",
  messagingSenderId: "131520810302",
  appId: "1:131520810302:web:2870d45c41bf150e16f06f",
  measurementId: "G-E46839Z77F"
};

// Inicializa a aplicação do Firebase
const app = initializeApp(firebaseConfig);

// Inicializa e exporta o Firestore e Authentication
export const db = getFirestore(app);
export const auth = getAuth(app);

export { 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    deleteDoc, 
    updateDoc,
    onSnapshot,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
};

