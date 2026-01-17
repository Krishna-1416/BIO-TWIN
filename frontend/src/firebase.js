import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAqPvNCer5pB657IUl_LWh3_hOwD5vt4as",
    authDomain: "bio-twin-96136.firebaseapp.com",
    projectId: "bio-twin-96136",
    storageBucket: "bio-twin-96136.firebasestorage.app",
    messagingSenderId: "357374288494",
    appId: "1:357374288494:web:8d2d6ae9f75fcab866fc7f",
    measurementId: "G-W1QPQWB5C9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Authentication
export const auth = getAuth(app);

// Initialize Storage
import { getStorage } from 'firebase/storage';
export const storage = getStorage(app);

export default app;
