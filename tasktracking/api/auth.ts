import { db } from './_lib/firebase.js'
import process from 'node:process'

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { key } = req.body || {}
  if (!key || typeof key !== 'string') {
    res.status(400).json({ error: 'Missing key parameter' })
    return
  }

  try {
    console.log(`[AUTH API] Verifying access key: ${key}...`)
    const rootKey = process.env.ROOT_KEY || '363636'

    if (key === rootKey) {
      console.log(`[AUTH API] Root key matched! Ensuring default user with id='1' exists...`)
      const userRef = db.collection('users').doc('1')
      const doc = await userRef.get()

      const defaultUser = {
        id: '1',
        key: rootKey,
        name: 'Root User',
        createdAt: new Date().toISOString(),
      }

      if (!doc.exists) {
        await userRef.set(defaultUser)
        console.log(`[AUTH API] Default root user seeded in DB.`)
      }

      res.status(200).json({ user: defaultUser })
      return
    }

    // Normal user check
    const snapshot = await db.collection('users').where('key', '==', key).get()
    if (snapshot.empty) {
      console.log(`[AUTH API] Key ${key} is invalid (not found in DB).`)
      res.status(401).json({ error: 'Invalid or incorrect key' })
      return
    }

    const docSnap = snapshot.docs[0]
    const user = { id: docSnap.id, ...docSnap.data() } as any
    console.log(`[AUTH API] Key matched successfully for user:`, user.name)
    res.status(200).json({ user })
  } catch (err: any) {
    console.error('[AUTH API] Error in auth endpoint:', err.message || err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
