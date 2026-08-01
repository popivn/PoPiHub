// Firebase configuration for the CronHub web app.
// Project: popihub-crons
// Console: https://console.firebase.google.com/project/popihub-crons
//
// Firebase SDK được nạp qua npm package `firebase` (xem src/lib/firebase.ts).

export const firebaseConfig = {
  apiKey: 'AIzaSyACB0Eek3omM1b-eEhWdsuCvrIywlJZerU',
  authDomain: 'popihub-crons.firebaseapp.com',
  projectId: 'popihub-crons',
  storageBucket: 'popihub-crons.firebasestorage.app',
  messagingSenderId: '160039984443',
  appId: '1:160039984443:web:3efd97bec4cee0b712ab1e',
  measurementId: 'G-SZ7JS64JLL',
} as const

export type FirebaseConfig = typeof firebaseConfig
