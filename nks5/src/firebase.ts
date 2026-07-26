import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAf4Qy3H852ZRe3hWRvWoGvAFqr8SCp6h8",
  authDomain: "nks5-273d6.firebaseapp.com",
  projectId: "nks5-273d6",
  storageBucket: "nks5-273d6.firebasestorage.app",
  messagingSenderId: "595416409567",
  appId: "1:595416409567:web:91b4fe5bb65a30ec7d906a",
  measurementId: "G-X5JMHZF3PJ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp 
};
