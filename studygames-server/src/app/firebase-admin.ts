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
  // projectId lấy từ service account JSON (nếu có) — tránh xung đột khi
  // FIREBASE_PROJECT_ID trong env trỏ tới project khác với key JSON.
  let saProjectId: string | undefined;

  if (serviceAccountJson) {
    // Nội dung JSON trong env (deploy). dotenv có thể bọc multi-line bằng
    // single quotes; JSON.parse tự xử lý whitespace và `\n` trong private_key.
    const sa = JSON.parse(serviceAccountJson);
    saProjectId = sa.project_id;
    credential = admin.credential.cert(sa);
  } else if (serviceAccountPath) {
    // Đường dẫn file JSON (dev) — resolve relative to cwd, not source file
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sa = require(resolve(serviceAccountPath));
    saProjectId = sa.project_id;
    credential = admin.credential.cert(sa);
  } else {
    // Application Default Credentials
    credential = admin.credential.applicationDefault();
  }

  // Ưu tiên projectId từ service account; fallback sang env (dùng cho ADC).
  const projectId = saProjectId ?? process.env.FIREBASE_PROJECT_ID;
  admin.initializeApp(
    projectId ? { credential, projectId } : { credential },
  );

  initialized = true;
  return admin.app();
}

export function getAuth(): admin.auth.Auth {
  return getFirebaseAdmin().auth();
}

export function getFirestore(): admin.firestore.Firestore {
  return getFirebaseAdmin().firestore();
}

/**
 * Cloud Storage bucket — dùng cho upload file (image banner, ...).
 * Bucket name lấy từ env FIREBASE_STORAGE_BUCKET (vd: slistudy.appspot.com).
 * Nếu không cấu hình, trả về undefined → caller fallback xử lý khác.
 */
export function getStorage(): admin.storage.Storage | undefined {
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
  if (!bucketName) return undefined;
  return getFirebaseAdmin().storage();
}
