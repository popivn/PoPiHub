import { db, verifyKey } from './_lib/firebase.js'

const DEFAULT_ZONES = [
  { id: 'zone-1', name: 'Công việc', color: '#6366f1', icon: 'briefcase' },
  { id: 'zone-2', name: 'Cá nhân', color: '#ec4899', icon: 'user' },
  { id: 'zone-3', name: 'Học tập', color: '#10b981', icon: 'book' }
]

export default async function handler(req: any, res: any) {
  const { authorized } = await verifyKey(req)
  if (!authorized) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const method = req.method

  try {
    if (method === 'GET') {
      const targetUserId = req.query.userId
      if (!targetUserId) {
        res.status(400).json({ error: 'Missing userId query parameter' })
        return
      }

      console.log(`[ZONES API] Fetching zones for user: ${targetUserId}`)
      const snapshot = await db.collection('zones').where('userId', '==', targetUserId).get()

      if (snapshot.empty) {
        console.log(`[ZONES API] No zones found for ${targetUserId}. Seeding default zones...`)
        const seededZones = DEFAULT_ZONES.map((z) => ({
          ...z,
          id: `${targetUserId}-${z.id}`,
          userId: targetUserId
        }))

        for (const zone of seededZones) {
          await db.collection('zones').doc(zone.id).set(zone)
        }

        res.status(200).json({ zones: seededZones })
        return
      }

      const zones = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      res.status(200).json({ zones })
      return
    }

    if (method === 'POST') {
      const zone = req.body
      if (!zone || !zone.id || !zone.name) {
        res.status(400).json({ error: 'Invalid zone payload' })
        return
      }

      console.log(`[ZONES API] Saving/updating zone: ${zone.id}`)
      await db.collection('zones').doc(zone.id).set(zone)
      res.status(200).json({ success: true, zone })
      return
    }

    if (method === 'DELETE') {
      const { id } = req.query
      if (!id) {
        res.status(400).json({ error: 'Missing zone id' })
        return
      }

      console.log(`[ZONES API] Deleting zone: ${id}`)
      await db.collection('zones').doc(id).delete()
      res.status(200).json({ success: true })
      return
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (err: any) {
    console.error('[ZONES API] Error:', err.message || err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
