// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";


// Replace with your Firebase project settings
const firebaseConfig = {
  apiKey: "AIzaSyAhyxaNaFnzavpbBr-1NlUfWTvmKbK2R2E",
  authDomain: "mcds-mobile.firebaseapp.com",
  projectId: "mcds-mobile",
  storageBucket: "mcds-mobile.firebasestorage.app",
  messagingSenderId: "919399915637",
  appId: "1:919399915637:web:c378d3cd19d08e44c0d83c",
  measurementId: "G-MXVRTS7C30"
};

const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
});