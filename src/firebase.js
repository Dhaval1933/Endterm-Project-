import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBViqCdJcVDyIp9rPcVzHh1_r9jQ1Uyvow",
  authDomain: "friendly-d6249.firebaseapp.com",
  projectId: "friendly-d6249",
  storageBucket: "friendly-d6249.firebasestorage.app",
  messagingSenderId: "442153901591",
  appId: "1:442153901591:web:ddf625b1b9e2166a0a8652"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Use initializeFirestore with settings to prevent network hangs
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});