import { appConfig } from '../src/lib/appConfig.js'

const XETMIENKEY = appConfig.XETMIENKEY

type VercelRequest = {
  method?: string
  body?: unknown
  query?: Record<string, string | string[] | undefined>
  headers: Record<string, string | string[] | undefined>
}
type VercelResponse = {
  status(code: number): VercelResponse
  setHeader(key: string, value: string): VercelResponse
  json(body: unknown): void
  end(): void
}

type RunCronBody = {
  url?: unknown
  method?: unknown
  headers?: unknown
  body?: unknown
}

function isString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

function isUrl(v: unknown): v is string {
  if (!isString(v)) return false
  try {
    const u = new URL(v.trim())
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-xetmien-key')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' })
    return
  }

  const providedKey =
    (req.headers['x-xetmien-key'] as string | undefined) ||
    (req.query?.key as string | undefined)
  if (!providedKey || providedKey !== XETMIENKEY) {
    res.status(401).json({ error: 'Unauthorized: invalid XETMIENKEY.' })
    return
  }

  const { url, method, headers, body } = (req.body || {}) as RunCronBody

  if (!isUrl(url)) {
    res.status(400).json({ error: 'Trường "url" là bắt buộc và phải là URL http(s).' })
    return
  }

  const httpMethod = isString(method) ? method.trim().toUpperCase() : 'GET'
  const startedAt = Date.now()

  try {
    const fetchInit: RequestInit = { method: httpMethod }

    if (headers && typeof headers === 'object') {
      fetchInit.headers = headers as Record<string, string>
    }

    if (body && httpMethod !== 'GET' && httpMethod !== 'HEAD') {
      fetchInit.body = typeof body === 'string' ? body : JSON.stringify(body)
      if (!fetchInit.headers) fetchInit.headers = {}
      if (!(fetchInit.headers as Record<string, string>)['Content-Type']) {
        (fetchInit.headers as Record<string, string>)['Content-Type'] = 'application/json'
      }
    }

    const upstreamRes = await fetch(url.trim(), fetchInit)
    const responseText = await upstreamRes.text()
    const durationMs = Date.now() - startedAt

    let responseParsed: unknown = responseText
    const ct = upstreamRes.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      try {
        responseParsed = JSON.parse(responseText)
      } catch {
        // keep as text
      }
    }

    const responseHeaders: Record<string, string> = {}
    upstreamRes.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    res.status(200).json({
      ok: upstreamRes.ok,
      status: upstreamRes.status,
      statusText: upstreamRes.statusText,
      durationMs,
      headers: responseHeaders,
      body: responseParsed,
    })
  } catch (err) {
    const durationMs = Date.now() - startedAt
    res.status(200).json({
      ok: false,
      status: null,
      statusText: 'FETCH_ERROR',
      durationMs,
      error: err instanceof Error ? err.message : String(err),
      body: null,
    })
  }
}
