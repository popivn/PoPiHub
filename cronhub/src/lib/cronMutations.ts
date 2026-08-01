import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore'
import { getDb } from './firebase'

const CRON_JOBS_COLLECTION = 'cron_jobs'
const CRON_ZONES_COLLECTION = 'cron_zones'
const SCHEDULED_TASKS_COLLECTION = 'scheduled_tasks'

export type CreateCronJobInput = {
  name: string
  schedule: string
  command: string | null
  httpMethod: string
  enabled: boolean
  description: string | null
  payload?: unknown
  zoneName: string
}

export async function createZone(name: string): Promise<{ id: string; name: string }> {
  const id = await ensureZone(name)
  return { id, name: name.trim() }
}

async function ensureZone(name: string): Promise<string> {
  const db = getDb()
  const trimmed = name.trim()
  const existing = await getDocs(
    query(
      collection(db, CRON_ZONES_COLLECTION),
      where('name', '==', trimmed),
      limit(1),
    ),
  )
  if (!existing.empty) return existing.docs[0].id
  const ref = await addDoc(collection(db, CRON_ZONES_COLLECTION), {
    name: trimmed,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function createCronJob(
  input: CreateCronJobInput,
): Promise<{ id: string; zoneId: string }> {
  const db = getDb()
  const zoneId = await ensureZone(input.zoneName)
  const docRef = await addDoc(collection(db, CRON_JOBS_COLLECTION), {
    name: input.name.trim(),
    schedule: input.schedule.trim(),
    command: input.command,
    httpMethod: input.httpMethod,
    enabled: input.enabled,
    description: input.description,
    payload: input.payload ?? null,
    zoneId,
    zoneName: input.zoneName.trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return { id: docRef.id, zoneId }
}

export type UpdateCronJobInput = {
  name?: string
  schedule?: string
  command?: string | null
  httpMethod?: string
  enabled?: boolean
  description?: string | null
}

export async function updateCronJob(
  id: string,
  patch: UpdateCronJobInput,
): Promise<void> {
  const db = getDb()
  const data: Record<string, unknown> = { updatedAt: serverTimestamp() }
  if (patch.name !== undefined) data.name = patch.name
  if (patch.schedule !== undefined) data.schedule = patch.schedule
  if (patch.command !== undefined) data.command = patch.command
  if (patch.httpMethod !== undefined) data.httpMethod = patch.httpMethod
  if (patch.enabled !== undefined) data.enabled = patch.enabled
  if (patch.description !== undefined) data.description = patch.description
  await updateDoc(doc(db, CRON_JOBS_COLLECTION, id), data)
}

export async function deleteCronJob(id: string): Promise<void> {
  const db = getDb()
  await deleteDoc(doc(db, CRON_JOBS_COLLECTION, id))
}

export async function deleteScheduledTask(id: string): Promise<void> {
  const db = getDb()
  await deleteDoc(doc(db, SCHEDULED_TASKS_COLLECTION, id))
}
