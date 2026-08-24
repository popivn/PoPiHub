import { db, verifyKey } from './_lib/firebase.js'

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

      console.log(`[TASKS API] Fetching tasks for user: ${targetUserId}`)
      const snapshot = await db.collection('tasks').where('userId', '==', targetUserId).get()
      const tasks = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

      // Sort tasks by createdAt descending
      tasks.sort((a: any, b: any) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return timeB - timeA
      })

      res.status(200).json({ tasks })
      return
    }

    if (method === 'POST') {
      const task = req.body
      if (!task || !task.id || !task.title) {
        res.status(400).json({ error: 'Invalid task payload' })
        return
      }

      console.log(`[TASKS API] Saving/updating task: ${task.id} ("${task.title}")`)
      await db.collection('tasks').doc(task.id).set(task)
      res.status(200).json({ success: true, task })
      return
    }

    if (method === 'DELETE') {
      const { id } = req.query
      if (!id) {
        res.status(400).json({ error: 'Missing task id' })
        return
      }

      console.log(`[TASKS API] Deleting task: ${id}`)
      await db.collection('tasks').doc(id).delete()
      res.status(200).json({ success: true })
      return
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (err: any) {
    console.error('[TASKS API] Error:', err.message || err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
