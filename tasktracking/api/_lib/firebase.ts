import admin from 'firebase-admin'
import process from 'node:process'

function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT environment variable')
  }
  try {
    return JSON.parse(raw)
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is not valid JSON')
  }
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(getServiceAccount()),
  })
}

export const db = admin.firestore()

/**
 * Helper to verify access key from Authorization: Bearer <key> header
 */
export async function verifyKey(req: any): Promise<{ authorized: boolean; userId?: string }> {
  const authHeader = req.headers.authorization || ''
  const key = authHeader.replace(/^Bearer\s+/i, '').trim()

  if (!key) {
    return { authorized: false }
  }

  // 1. Check if it is the ROOT_KEY
  const rootKey = process.env.ROOT_KEY || '363636'
  if (key === rootKey) {
    return { authorized: true, userId: '1' }
  }

  // 2. Query users collection
  try {
    const snapshot = await db.collection('users').where('key', '==', key).get()
    if (snapshot.empty) {
      return { authorized: false }
    }
    const userDoc = snapshot.docs[0]
    return { authorized: true, userId: userDoc.id }
  } catch (err) {
    console.error('Error verifying key:', err)
    return { authorized: false }
  }
}
