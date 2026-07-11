import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  sendEmailVerification,
  updateProfile,
  sendPasswordResetEmail
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB1DQ9HQ6iqqomm3Ay9TlI-Ql_J-KQHWH4",
  authDomain: "admitto-7777c.firebaseapp.com",
  projectId: "admitto-7777c",
  storageBucket: "admitto-7777c.firebasestorage.app",
  messagingSenderId: "642526916843",
  appId: "1:642526916843:web:33c905add471a1a4e54eae",
  measurementId: "G-VLNHJC0C6F"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export {
  auth,
  db,
  app,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  sendEmailVerification,
  updateProfile,
  sendPasswordResetEmail
};
