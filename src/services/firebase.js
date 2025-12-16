import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCEbLM3QPfuBZYuP1uIp4wTaP9YDfGzKkw",
    authDomain: "resume-generator-pro.firebaseapp.com",
    projectId: "resume-generator-pro",
    storageBucket: "resume-generator-pro.firebasestorage.app",
    messagingSenderId: "779345013076",
    appId: "1:779345013076:web:dc2c4a1a6953c72b0480c1",
    measurementId: "G-1YWY69DPE9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export default app;