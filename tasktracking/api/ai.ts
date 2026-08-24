import { verifyKey } from './_lib/firebase.js'
import process from 'node:process'

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  // 1. Verify access key
  const { authorized } = await verifyKey(req)
  if (!authorized) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const { provider, payload } = req.body || {}
  if (!provider || !payload) {
    res.status(400).json({ error: 'Missing provider or payload' })
    return
  }

  try {
    if (provider === 'gemini') {
      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey) {
        res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server' })
        return
      }

      console.log('[AI PROXY] Proxying request to Gemini API...')
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`

      const geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!geminiRes.ok) {
        const errText = await geminiRes.text()
        console.error('[AI PROXY] Gemini returned error:', errText)
        res.status(geminiRes.status).send(errText)
        return
      }

      const data = await geminiRes.json()
      res.status(200).json(data)
      return
    }

    if (provider === 'openrouter') {
      const apiKey = process.env.OPENROUTER_API_KEY
      if (!apiKey) {
        res.status(500).json({ error: 'OPENROUTER_API_KEY is not configured on the server' })
        return
      }

      console.log('[AI PROXY] Proxying request to OpenRouter API...')
      const openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions'

      const referer = process.env.OPENROUTER_REFERER || 'https://tasktracking-jade.vercel.app'
      const title = process.env.OPENROUTER_TITLE || 'Task Tracker'

      const openRouterRes = await fetch(openRouterUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': referer,
          'X-Title': title,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!openRouterRes.ok) {
        const errText = await openRouterRes.text()
        console.error('[AI PROXY] OpenRouter returned error:', errText)
        res.status(openRouterRes.status).send(errText)
        return
      }

      const data = await openRouterRes.json()
      res.status(200).json(data)
      return
    }

    res.status(400).json({ error: `Unsupported AI provider: ${provider}` })
  } catch (err: any) {
    console.error('[AI PROXY] Error proxying request:', err.message || err)
    res.status(500).json({ error: 'Internal server error in AI proxy' })
  }
}
