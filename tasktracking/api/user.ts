import { db, verifyKey } from './_lib/firebase.js'

export default async function handler(req: any, res: any) {
  const { authorized, userId } = await verifyKey(req)
  if (!authorized || !userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const method = req.method

  try {
    if (method === 'GET') {
      const doc = await db.collection('users').doc(userId).get()
      if (!doc.exists) {
        res.status(404).json({ error: 'User not found' })
        return
      }
      const user = { id: doc.id, ...doc.data() }
      res.status(200).json({ user })
      return
    }

    if (method === 'PUT' || method === 'POST') {
      const body = req.body || {}
      // Chỉ cho phép cập nhật name & email (không cho đổi key/id)
      const update: Record<string, any> = { updatedAt: new Date().toISOString() }
      if (typeof body.name === 'string') update.name = body.name.trim()
      if (typeof body.email === 'string') update.email = body.email.trim()

      await db.collection('users').doc(userId).set(update, { merge: true })
      const doc = await db.collection('users').doc(userId).get()
      const user = { id: doc.id, ...doc.data() }
      res.status(200).json({ success: true, user })
      return
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (err: any) {
    console.error('[USER API] Error:', err.message || err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
