import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  getFirestore,
  type Firestore,
} from 'firebase/firestore'
import {
  getAnalytics,
  isSupported,
  type Analytics,
} from 'firebase/analytics'
import { firebaseConfig } from './firebaseConfig'

// Singleton Firebase app + services.
let app: FirebaseApp | null = null
let db: Firestore | null = null
let analyticsInit: Promise<Analytics | null> | null = null

export function getFirebaseApp(): FirebaseApp {
  if (!app) app = initializeApp(firebaseConfig)
  return app
}

export function getDb(): Firestore {
  if (!db) db = getFirestore(getFirebaseApp())
  return db
}

// Analytics chỉ chạy trên trình duyệt hỗ trợ (guard cho preview/SSR).
export function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (!analyticsInit) {
    analyticsInit = isSupported()
      .then((ok) => (ok ? getAnalytics(getFirebaseApp()) : null))
      .catch((err) => {
        console.warn('[firebase] analytics init failed:', err)
        return null
      })
  }
  return analyticsInit
}

// Khởi tạo analytics ngay khi module load (best-effort, không chặn UI).
void getFirebaseAnalytics()
