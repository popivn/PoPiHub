import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/12.17.0/firebase-analytics.js';

const firebaseConfig = {
  apiKey: 'AIzaSyCuSh7YYHsGF7M4c4wV9EwTM8YyMbPj2_o',
  authDomain: 'xianria-4f68a.firebaseapp.com',
  projectId: 'xianria-4f68a',
  storageBucket: 'xianria-4f68a.firebasestorage.app',
  messagingSenderId: '310861044830',
  appId: '1:310861044830:web:abe5a41677e136cf00a8cf',
  measurementId: 'G-KSZZ27EKY2'
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics, firebaseConfig };
