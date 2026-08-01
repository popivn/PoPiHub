import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { appConfig } from '../src/lib/appConfig.js'

const XETMIENKEY = appConfig.XETMIENKEY

const firebaseConfig = {
  apiKey: 'AIzaSyACB0Eek3omM1b-eEhWdsuCvrIywlJZerU',
  authDomain: 'popihub-crons.firebaseapp.com',
  projectId: 'popihub-crons',
  storageBucket: 'popihub-crons.firebasestorage.app',
  messagingSenderId: '160039984443',
  appId: '1:160039984443:web:3efd97bec4cee0b712ab1e',
  measurementId: 'G-SZ7JS64JLL',
}

const CRON_JOBS_COLLECTION = 'cron_jobs'

let app: ReturnType<typeof initializeApp> | null = null
let db: ReturnType<typeof getFirestore> | null = null
function getDb() {
  if (!app) app = initializeApp(firebaseConfig)
  if (!db) db = getFirestore(app)
  return db
}

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

type UpdateCronBody = {
  id?: unknown
  name?: unknown
  schedule?: unknown
  command?: unknown
  enabled?: unknown
  description?: unknown
}

function isString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

const CRON_RE = /^\S+(\s+\S+){4,5}$/

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

  const body = (req.body || {}) as UpdateCronBody
  const { id, name, schedule, command, enabled, description } = body

  if (!isString(id)) {
    res.status(400).json({ error: 'Trường "id" là bắt buộc.' })
    return
  }
  if (schedule !== undefined && (!isString(schedule) || !CRON_RE.test(schedule.trim()))) {
    res.status(400).json({
      error: 'Trường "schedule" phải là cron expression (5-6 field).',
    })
    return
  }

  const data: Record<string, unknown> = { updatedAt: serverTimestamp() }
  if (name !== undefined) data.name = isString(name) ? name.trim() : name
  if (schedule !== undefined) data.schedule = schedule.trim()
  if (command !== undefined) data.command = isString(command) ? command.trim() : null
  if (enabled !== undefined) data.enabled = typeof enabled === 'boolean' ? enabled : Boolean(enabled)
  if (description !== undefined) data.description = isString(description) ? description.trim() : null

  try {
    await updateDoc(doc(getDb(), CRON_JOBS_COLLECTION, id.trim()), data)
    res.status(200).json({ ok: true, id: id.trim(), message: 'Cron job đã được cập nhật.' })
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}
