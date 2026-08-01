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
// - cron_zones: zone (vd: VTTUXETMIEN)
// - cron_jobs:  cron recurring thuộc zone (via zoneId)
const CRON_ZONES_COLLECTION = 'cron_zones'
const CRON_JOBS_COLLECTION = 'cron_jobs'

const DEFAULT_ZONE = 'VTTUXETMIEN'

// Khởi tạo Firebase client app một lần per cold start.
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

type AddCronBody = {
  name?: unknown
  schedule?: unknown
  command?: unknown
  enabled?: unknown
  description?: unknown
  payload?: unknown
  zone?: unknown
}

function isString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

const CRON_RE = /^\S+(\s+\S+){4,5}$/

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

  const body = (req.body || {}) as AddCronBody
  const { name, schedule, command, enabled, description, payload, zone } = body

  if (!isString(name)) {
    res.status(400).json({ error: 'Trường "name" là bắt buộc.' })
    return
  }
  if (!isString(schedule) || !CRON_RE.test(schedule.trim())) {
    res.status(400).json({
      error: 'Trường "schedule" là bắt buộc và phải là cron expression (5-6 field).',
    })
    return
  }

  const zoneName = isString(zone) ? zone.trim() : DEFAULT_ZONE

  try {
    const zoneId = await ensureZone(zoneName)

    const docRef = await addDoc(collection(getDb(), CRON_JOBS_COLLECTION), {
      name: name.trim(),
      schedule: schedule.trim(),
      command: isString(command) ? command.trim() : null,
      enabled: typeof enabled === 'boolean' ? enabled : true,
      description: isString(description) ? description.trim() : null,
      payload: payload ?? null,
      zoneId,
      zoneName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    res.status(201).json({
      ok: true,
      id: docRef.id,
      zoneId,
      zoneName,
      message: `Cron job đã được tạo trong zone "${zoneName}".`,
    })
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}
