import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDGRC-CIWD0n92DpTSTNv-7Gpx77xMSXpA",
  authDomain: "cafeteria-27958.firebaseapp.com",
  projectId: "cafeteria-27958",
  storageBucket: "cafeteria-27958.appspot.com",
  messagingSenderId: "811743507718",
  appId: "1:811743507718:web:42e0381f2f481d01961a87",
  measurementId: "G-D40B5XKJT5"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app); 