// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDOQpyDBGa722jsLwy94G2aOCFv1Fs8gj0",
  authDomain: "sigma7-sman7mks.firebaseapp.com",
  projectId: "sigma7-sman7mks",
  storageBucket: "sigma7-sman7mks.firebasestorage.app",
  messagingSenderId: "308864865567",
  appId: "1:308864865567:web:8929772c6753006c620c2a",
  measurementId: "G-0VP7PCX6NL"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };
