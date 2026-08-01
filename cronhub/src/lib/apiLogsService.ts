import {
  collection,
  getDocs,
  orderBy,
  query,
  limit,
  Timestamp,
} from 'firebase/firestore'
import { getDb } from './firebase'
import { API_LOGS_COLLECTION } from './apiLogger'

export type ApiLogRow = {
  id: string
  method: string
  url: string
  status: number | null
  statusText: string
  ok: boolean
  durationMs: number
  error?: string
  createdAtClient: number | null
  createdAtServer: number | null
  requestBody?: unknown
  responseBody?: unknown
  requestHeaders?: Record<string, string>
  responseHeaders?: Record<string, string>
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

/**
 * Đọc tối đa `max` log gần nhất từ Firestore `api_logs`,
 * sắp xếp theo createdAtClient giảm dần (client time ổn định hơn serverTimestamp).
 */
export async function fetchApiLogs(max = 100): Promise<ApiLogRow[]> {
  const db = getDb()
  const q = query(
    collection(db, API_LOGS_COLLECTION),
    orderBy('createdAtClient', 'desc'),
    limit(max),
  )
  const snap = await getDocs(q)
  return snap.docs.map((doc) => {
    const d = doc.data() as Record<string, unknown>
    return {
      id: doc.id,
      method: String(d.method ?? ''),
      url: String(d.url ?? ''),
      status: (d.status as number | null) ?? null,
      statusText: String(d.statusText ?? ''),
      ok: Boolean(d.ok),
      durationMs: Number(d.durationMs ?? 0),
      error: d.error ? String(d.error) : undefined,
      createdAtClient: (d.createdAtClient as number) ?? null,
      createdAtServer: tsToMs(d.createdAt),
      requestBody: d.requestBody,
      responseBody: d.responseBody,
      requestHeaders: d.requestHeaders as Record<string, string> | undefined,
      responseHeaders: d.responseHeaders as Record<string, string> | undefined,
    }
  })
}
