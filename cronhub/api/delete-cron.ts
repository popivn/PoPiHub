import { initializeApp } from 'firebase/app'
import { getFirestore, doc, deleteDoc } from 'firebase/firestore'
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

type DeleteCronBody = { id?: unknown }

function isString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
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

  const body = (req.body || {}) as DeleteCronBody
  const { id } = body

  // Cho phép id qua query ?id= hoặc body.
  const jobId = isString(id) ? id.trim() : (req.query?.id as string | undefined)?.trim()
  if (!jobId) {
    res.status(400).json({ error: 'Trường "id" là bắt buộc.' })
    return
  }

  try {
    await deleteDoc(doc(getDb(), CRON_JOBS_COLLECTION, jobId))
    res.status(200).json({ ok: true, id: jobId, message: 'Cron job đã được xóa.' })
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}
