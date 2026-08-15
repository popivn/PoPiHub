/**
 * Firebase Web Config (dùng chung)
 *
 * File này chỉ lưu giá trị config, KHÔNG import firebase npm.
 * - Client: dùng qua CDN (xem `firebase-cdn.example.html`).
 * - Server: nếu cần verify token thì dùng `firebase-admin` (riêng biệt).
 *
 * For Firebase JS SDK v7.20.0 and later, measurementId is optional
 */
export const firebaseConfig = {
  apiKey: 'AIzaSyCuSh7YYHsGF7M4c4wV9EwTM8YyMbPj2_o',
  authDomain: 'xianria-4f68a.firebaseapp.com',
  projectId: 'xianria-4f68a',
  storageBucket: 'xianria-4f68a.firebasestorage.app',
  messagingSenderId: '310861044830',
  appId: '1:310861044830:web:89704d2e9e490fa900a8cf',
  measurementId: 'G-6F540J0N0T',
} as const;

export type FirebaseConfig = typeof firebaseConfig;
