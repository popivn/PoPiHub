import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
} from 'firebase/firestore'
import { getDb } from './firebase'

// Tên collection Firestore (đồng bộ với api/add-cron.ts + api/add-scheduled-task.ts).
const CRON_ZONES_COLLECTION = 'cron_zones'
const CRON_JOBS_COLLECTION = 'cron_jobs'
const SCHEDULED_TASKS_COLLECTION = 'scheduled_tasks'

export type CronZone = {
  id: string
  name: string
  createdAt: number | null
}

export type CronJob = {
  id: string
  name: string
  schedule: string
  command: string | null
  httpMethod: string
  enabled: boolean
  description: string | null
  payload: unknown
  zoneId: string
  zoneName: string
  createdAt: number | null
  updatedAt: number | null
}

export type ScheduledTask = {
  id: string
  domain: string
  endpoint: string
  dot_id: string
  startday: number | null
  endday: number | null
  zoneId: string
  zoneName: string
  status: 'pending' | 'fired' | 'error'
  fired: boolean
  firedAt: number | null
  createdAt: number | null
}

export type ZoneGroup = {
  zone: CronZone
  jobs: CronJob[]
  tasks: ScheduledTask[]
}

function tsToMs(ts: unknown): number | null {
  if (!ts) return null
  if (ts instanceof Timestamp) return ts.toMillis()
  if (typeof ts === 'object' && ts && 'seconds' in ts) {
    const s = (ts as { seconds: number }).seconds
    const ns = (ts as { nanoseconds?: number }).nanoseconds ?? 0
    return s * 1000 + Math.floor(ns / 1e6)
  }
  return null
}

export async function fetchZones(): Promise<CronZone[]> {
  const db = getDb()
  const q = query(collection(db, CRON_ZONES_COLLECTION), orderBy('name', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map((doc) => {
    const d = doc.data() as Record<string, unknown>
    return {
      id: doc.id,
      name: String(d.name ?? '(không tên)'),
      createdAt: tsToMs(d.createdAt),
    }
  })
}

export async function fetchCronJobs(): Promise<CronJob[]> {
  const db = getDb()
  const q = query(
    collection(db, CRON_JOBS_COLLECTION),
    orderBy('createdAt', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((doc) => {
    const d = doc.data() as Record<string, unknown>
    return {
      id: doc.id,
      name: String(d.name ?? ''),
      schedule: String(d.schedule ?? ''),
      command: d.command == null ? null : String(d.command),
      httpMethod: String(d.httpMethod ?? 'GET'),
      enabled: Boolean(d.enabled ?? true),
      description: d.description == null ? null : String(d.description),
      payload: d.payload ?? null,
      zoneId: String(d.zoneId ?? ''),
      zoneName: String(d.zoneName ?? ''),
      createdAt: tsToMs(d.createdAt),
      updatedAt: tsToMs(d.updatedAt),
    }
  })
}

export async function fetchScheduledTasks(): Promise<ScheduledTask[]> {
  const db = getDb()
  const q = query(
    collection(db, SCHEDULED_TASKS_COLLECTION),
    orderBy('endday', 'asc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((doc) => {
    const d = doc.data() as Record<string, unknown>
    return {
      id: doc.id,
      domain: String(d.domain ?? ''),
      endpoint: String(d.endpoint ?? ''),
      dot_id: String(d.dot_id ?? ''),
      startday: tsToMs(d.startday),
      endday: tsToMs(d.endday),
      zoneId: String(d.zoneId ?? ''),
      zoneName: String(d.zoneName ?? ''),
      status: (d.status as ScheduledTask['status']) ?? 'pending',
      fired: Boolean(d.fired ?? false),
      firedAt: tsToMs(d.firedAt),
      createdAt: tsToMs(d.createdAt),
    }
  })
}

/**
 * Gom cron jobs + scheduled tasks theo zone.
 * Zone không có job/task nào vẫn xuất hiện (nếu có trong cron_zones).
 */
export async function fetchZoneGroups(): Promise<ZoneGroup[]> {
  const [zones, jobs, tasks] = await Promise.all([
    fetchZones(),
    fetchCronJobs(),
    fetchScheduledTasks(),
  ])

  const byZoneId = new Map<string, ZoneGroup>()
  for (const zone of zones) {
    byZoneId.set(zone.id, { zone, jobs: [], tasks: [] })
  }

  // Job/task có zoneId không nằm trong list zones (zone bị xóa) → gom vào nhóm "Khác".
  const OTHERS_ID = '__others__'
  let others: ZoneGroup | null = null

  for (const job of jobs) {
    let g = byZoneId.get(job.zoneId)
    if (!g) {
      if (!others) {
        others = {
          zone: { id: OTHERS_ID, name: 'Khác', createdAt: null },
          jobs: [],
          tasks: [],
        }
        byZoneId.set(OTHERS_ID, others)
      }
      g = others
    }
    g.jobs.push(job)
  }

  for (const task of tasks) {
    let g = byZoneId.get(task.zoneId)
    if (!g) {
      if (!others) {
        others = {
          zone: { id: OTHERS_ID, name: 'Khác', createdAt: null },
          jobs: [],
          tasks: [],
        }
        byZoneId.set(OTHERS_ID, others)
      }
      g = others
    }
    g.tasks.push(task)
  }

  return Array.from(byZoneId.values()).sort((a, b) =>
    a.zone.name.localeCompare(b.zone.name),
  )
}
