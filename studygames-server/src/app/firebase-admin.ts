import * as admin from 'firebase-admin';
import { resolve } from 'node:path';

let initialized = false;

/**
 * Khởi tạo Firebase Admin SDK một lần (singleton).
 *
 * Service Account Key lấy từ:
 *   Firebase Console → Project Settings → Service Accounts →
 *   "Generate new private key" → tải file JSON.
 *
 * Cách cấu hình (chọn 1):
 *   1. env FIREBASE_SERVICE_ACCOUNT_PATH = đường dẫn file JSON
 *   2. env FIREBASE_SERVICE_ACCOUNT     = nội dung JSON (string, dùng cho deploy)
 *   3. Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS)
 *
 * KHÔNG commit file serviceAccountKey.json vào git.
 */
export function getFirebaseAdmin(): admin.app.App {
  if (initialized) {
    return admin.app();
  }

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

  let credential: admin.credential.Credential | undefined;

  if (serviceAccountJson) {
    // Nội dung JSON trong env (deploy)
    credential = admin.credential.cert(JSON.parse(serviceAccountJson));
  } else if (serviceAccountPath) {
    // Đường dẫn file JSON (dev) — resolve relative to cwd, not source file
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    credential = admin.credential.cert(require(resolve(serviceAccountPath)));
  } else {
    // Application Default Credentials
    credential = admin.credential.applicationDefault();
  }

  admin.initializeApp({
    credential,
    projectId: process.env.FIREBASE_PROJECT_ID ?? 'xianria-4f68a',
  });

  initialized = true;
  return admin.app();
}

export function getAuth(): admin.auth.Auth {
  return getFirebaseAdmin().auth();
}

export function getFirestore(): admin.firestore.Firestore {
  return getFirebaseAdmin().firestore();
}
