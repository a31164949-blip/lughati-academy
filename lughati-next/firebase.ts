import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
const firebaseConfig = {
  apiKey: "AIzaSyCA5LuxMnHHPER7QnjQoX5LHeTZAdoQoCg",
  authDomain: "lughati-academy.firebaseapp.com",
  projectId: "lughati-academy",
  storageBucket: "lughati-academy.firebasestorage.app",
  messagingSenderId: "425183010935",
  appId: "1:425183010935:web:d6a49acbc493369927a672"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);