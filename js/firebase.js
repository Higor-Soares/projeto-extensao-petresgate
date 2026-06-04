import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDldPZ17YGCSmbGCZSNcbTx-geNDwH5E18",
  authDomain: "pet-resgate-2026.firebaseapp.com",
  projectId: "pet-resgate-2026",
  storageBucket: "pet-resgate-2026.firebasestorage.app",
  messagingSenderId: "133569134869",
  appId: "1:133569134869:web:6b0c5c3cb549cddcd7e91c"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
