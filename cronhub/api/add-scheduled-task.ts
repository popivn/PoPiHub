import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  limit,
  getDocs,
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

// Collections Firestore:
// - cron_zones:        zone (vd: VTTUXETMIEN)
// - scheduled_tasks:   task one-shot, trigger 1 lần tại endday
const CRON_ZONES_COLLECTION = 'cron_zones'
const SCHEDULED_TASKS_COLLECTION = 'scheduled_tasks'

const DEFAULT_ZONE = 'VTTUXETMIEN'

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

type ScheduledTaskBody = {
  domain?: unknown
  endpoint?: unknown
  dot_id?: unknown
  startday?: unknown
  endday?: unknown
  zone?: unknown
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

function isIsoDate(v: unknown): v is string {
  if (!isString(v)) return false
  return !isNaN(new Date(v.trim()).getTime())
}

async function ensureZone(name: string): Promise<string> {
  const firestore = getDb()
  const trimmed = name.trim()

  const existing = await getDocs(
    query(
      collection(firestore, CRON_ZONES_COLLECTION),
      where('name', '==', trimmed),
      limit(1),
    ),
  )
  if (!existing.empty) return existing.docs[0].id

  const ref = await addDoc(collection(firestore, CRON_ZONES_COLLECTION), {
    name: trimmed,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
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

  const body = (req.body || {}) as ScheduledTaskBody
  const { domain, endpoint, dot_id, startday, endday, zone } = body

  if (!isUrl(domain)) {
    res.status(400).json({
      error: 'Trường "domain" là bắt buộc và phải là URL http(s).',
    })
    return
  }
  if (!isUrl(endpoint)) {
    res.status(400).json({
      error: 'Trường "endpoint" là bắt buộc và phải là URL http(s).',
    })
    return
  }
  if (
    dot_id == null ||
    (typeof dot_id !== 'string' && typeof dot_id !== 'number')
  ) {
    res.status(400).json({
      error: 'Trường "dot_id" là bắt buộc (string hoặc number).',
    })
    return
  }
  if (!isIsoDate(startday)) {
    res.status(400).json({
      error: 'Trường "startday" là bắt buộc và phải là ISO 8601.',
    })
    return
  }
  if (!isIsoDate(endday)) {
    res.status(400).json({
      error: 'Trường "endday" là bắt buộc và phải là ISO 8601.',
    })
    return
  }

  const zoneName = isString(zone) ? zone.trim() : DEFAULT_ZONE
  const startdayDate = new Date(startday.trim())
  const enddayDate = new Date(endday.trim())

  try {
    const zoneId = await ensureZone(zoneName)

    const docRef = await addDoc(
      collection(getDb(), SCHEDULED_TASKS_COLLECTION),
      {
        domain: domain.trim(),
        endpoint: endpoint.trim(),
        dot_id: typeof dot_id === 'number' ? String(dot_id) : dot_id,
        startday: startdayDate,
        endday: enddayDate,
        zoneId,
        zoneName,
        status: 'pending',
        fired: false,
        firedAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
    )

    res.status(201).json({
      ok: true,
      id: docRef.id,
      zoneId,
      zoneName,
      triggerAt: enddayDate.toISOString(),
      message: `Scheduled task đã được tạo trong zone "${zoneName}", sẽ trigger lúc ${enddayDate.toISOString()}.`,
    })
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}
