import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  addDoc,
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

let app: ReturnType<typeof initializeApp> | null = null
let db: ReturnType<typeof getFirestore> | null = null

function getDb() {
  if (!app) app = initializeApp(firebaseConfig)
  if (!db) db = getFirestore(app)
  return db
}

const CRON_JOBS_COLLECTION = 'cron_jobs'
const API_LOGS_COLLECTION = 'api_logs'

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

// Simple cron expression parser — supports: * * * * * and */N * * * *
// All times are interpreted in Asia/Ho_Chi_Minh (UTC+7)
function shouldRun(schedule: string, now: Date): boolean {
  const parts = schedule.trim().split(/\s+/)
  if (parts.length !== 5) return false
  const [min, hour, dom, month, dow] = parts

  // Convert UTC `now` to UTC+7 components
  const utc7 = new Date(now.getTime() + 7 * 60 * 60 * 1000)
  const m = utc7.getUTCMinutes()
  const h = utc7.getUTCHours()
  const d = utc7.getUTCDate()
  const mo = utc7.getUTCMonth() + 1
  const dw = utc7.getUTCDay()

  function matchField(expr: string, value: number, min: number, max: number): boolean {
    if (expr === '*') return true
    if (expr.startsWith('*/')) {
      const step = parseInt(expr.slice(2), 10)
      if (isNaN(step) || step <= 0) return false
      return value % step === 0
    }
    // Handle comma-separated values
    if (expr.includes(',')) {
      return expr.split(',').some((v) => matchField(v.trim(), value, min, max))
    }
    // Handle ranges (e.g., 0-23)
    if (expr.includes('-')) {
      const [start, end] = expr.split('-').map((v) => parseInt(v, 10))
      if (isNaN(start) || isNaN(end)) return false
      return value >= start && value <= end
    }
    const n = parseInt(expr, 10)
    if (isNaN(n)) return false
    return n === value
  }

  return (
    matchField(min, m, 0, 59) &&
    matchField(hour, h, 0, 23) &&
    matchField(dom, d, 1, 31) &&
    matchField(month, mo, 1, 12) &&
    matchField(dow, dw, 0, 6)
  )
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*')

  // Cho phép Vercel Cron gọi tự động (CRON_SECRET header) hoặc manual với key
  const authHeader =
    (req.headers['authorization'] as string | undefined) || ''
  const providedKey =
    (req.headers['x-xetmien-key'] as string | undefined) ||
    (req.query?.key as string | undefined)

  const isVercelCron = req.headers['x-vercel-cron'] === '1'
  const isAuthorized =
    isVercelCron ||
    (providedKey && providedKey === XETMIENKEY) ||
    (authHeader && authHeader === `Bearer ${XETMIENKEY}`)

  if (!isAuthorized) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const db = getDb()
  const now = new Date()

  // Lấy tất cả cron jobs đang bật
  const q = query(
    collection(db, CRON_JOBS_COLLECTION),
    where('enabled', '==', true),
  )
  const snap = await getDocs(q)
  const jobs = snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>
    return {
      id: d.id,
      name: String(data.name ?? ''),
      schedule: String(data.schedule ?? ''),
      command: data.command ? String(data.command) : null,
      httpMethod: String(data.httpMethod ?? 'GET'),
    }
  })

  const results: { id: string; name: string; status: number | null; ok: boolean; error?: string }[] = []

  for (const job of jobs) {
    if (!job.command) continue
    if (!shouldRun(job.schedule, now)) continue

    const startedAt = Date.now()
    try {
      const fetchInit: RequestInit = { method: job.httpMethod }
      const upstreamRes = await fetch(job.command, fetchInit)
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

      // Ghi log vào api_logs
      try {
        await addDoc(collection(db, API_LOGS_COLLECTION), {
          method: job.httpMethod,
          url: job.command,
          status: upstreamRes.status,
          statusText: upstreamRes.statusText,
          ok: upstreamRes.ok,
          durationMs,
          responseBody: responseParsed,
          jobName: job.name,
          jobId: job.id,
          source: 'cron-runner',
          createdAt: serverTimestamp(),
          createdAtClient: Date.now(),
        })
      } catch (logErr) {
        console.error('[cron-runner] Failed to write log for job', job.id, logErr)
      }

      // Cập nhật updatedAt
      try {
        await updateDoc(doc(db, CRON_JOBS_COLLECTION, job.id), {
          updatedAt: serverTimestamp(),
          lastRunAt: serverTimestamp(),
          lastRunStatus: upstreamRes.status,
        })
      } catch {
        // best-effort
      }

      results.push({
        id: job.id,
        name: job.name,
        status: upstreamRes.status,
        ok: upstreamRes.ok,
      })
    } catch (err) {
      const durationMs = Date.now() - startedAt
      const errorMsg = err instanceof Error ? err.message : String(err)

      try {
        await addDoc(collection(db, API_LOGS_COLLECTION), {
          method: job.httpMethod,
          url: job.command,
          status: null,
          statusText: 'FETCH_ERROR',
          ok: false,
          durationMs,
          responseBody: null,
          error: errorMsg,
          jobName: job.name,
          jobId: job.id,
          source: 'cron-runner',
          createdAt: serverTimestamp(),
          createdAtClient: Date.now(),
        })
      } catch {
        // best-effort
      }

      results.push({
        id: job.id,
        name: job.name,
        status: null,
        ok: false,
        error: errorMsg,
      })
    }
  }

  res.status(200).json({
    ranAt: now.toISOString(),
    totalJobs: jobs.length,
    executed: results.length,
    results,
  })
}
