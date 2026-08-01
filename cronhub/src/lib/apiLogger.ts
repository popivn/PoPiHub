import {
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore'
import { getDb } from './firebase'

// Tên collection Firestore lưu log mọi request/response.
export const API_LOGS_COLLECTION = 'api_logs'

export type ApiLog = {
  method: string
  url: string
  requestHeaders?: Record<string, string>
  requestBody?: unknown
  status: number | null
  statusText: string
  responseHeaders?: Record<string, string>
  responseBody?: unknown
  durationMs: number
  ok: boolean
  error?: string
  createdAt: ReturnType<typeof serverTimestamp>
  // Giá trị do client ghi (serverTimestamp sẽ override trên server).
  createdAtClient: number
}

type ApiFetchInit = RequestInit & {
  // Có log body request/response hay không (mặc định true).
  // Tắt cho dữ liệu lớn/nhạy cảm.
  logBody?: boolean
  // Đánh dấu log nhạy cảm để redact sau (mặc định false).
  sensitive?: boolean
}

function redactHeaders(
  headers: Headers | undefined,
): Record<string, string> | undefined {
  if (!headers) return undefined
  const out: Record<string, string> = {}
  headers.forEach((value, key) => {
    const lk = key.toLowerCase()
    if (
      lk === 'authorization' ||
      lk === 'cookie' ||
      lk === 'set-cookie' ||
      lk.startsWith('x-api-key')
    ) {
      out[key] = '[REDACTED]'
    } else {
      out[key] = value
    }
  })
  return out
}

async function readBody(
  res: Response,
  logBody: boolean,
): Promise<{ text: string | null; parsed: unknown }> {
  if (!logBody) return { text: null, parsed: null }
  // Clone để không phá stream gốc.
  const clone = res.clone()
  const text = await clone.text().catch(() => null)
  let parsed: unknown = null
  if (text) {
    const ct = res.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      try {
        parsed = JSON.parse(text)
      } catch {
        parsed = text
      }
    } else {
      parsed = text
    }
  }
  return { text, parsed }
}

/**
 * Wrapper quanh fetch — ghi log mọi request/response vào Firestore `api_logs`.
 *
 * Chỉ những call đi qua apiFetch() mới được log (theo lựa chọn của bạn).
 * Trả về Response giống fetch thường để dùng tiếp.
 */
export async function apiFetch(
  input: string | URL,
  init: ApiFetchInit = {},
): Promise<Response> {
  const { logBody = true, sensitive = false, ...fetchInit } = init
  const url = typeof input === 'string' ? input : input.toString()
  const method = (fetchInit.method || 'GET').toUpperCase()
  const startedAt = performance.now()
  const createdAtClient = Date.now()

  let reqBodyParsed: unknown = null
  if (logBody && fetchInit.body != null) {
    if (typeof fetchInit.body === 'string') {
      try {
        reqBodyParsed = JSON.parse(fetchInit.body)
      } catch {
        reqBodyParsed = fetchInit.body
      }
    } else {
      reqBodyParsed = '[non-string body]'
    }
  }

  let res: Response | null = null
  let errorMsg: string | undefined
  try {
    res = await fetch(url, fetchInit)
    return res
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : String(err)
    throw err
  } finally {
    const durationMs = Math.round(performance.now() - startedAt)
    const status = res?.status ?? null
    const statusText = res?.statusText ?? (errorMsg ? 'ERROR' : 'UNKNOWN')
    const ok = res?.ok ?? false

    let resBodyParsed: unknown = null
    if (res) {
      const { parsed } = await readBody(res, logBody).catch(() => ({
        text: null,
        parsed: null,
      }))
      resBodyParsed = parsed
    }

    const log: ApiLog = {
      method,
      url,
      requestHeaders: redactHeaders(
        fetchInit.headers instanceof Headers
          ? fetchInit.headers
          : undefined,
      ),
      requestBody: sensitive ? '[REDACTED]' : reqBodyParsed,
      status,
      statusText,
      responseHeaders: redactHeaders(res?.headers),
      responseBody: sensitive ? '[REDACTED]' : resBodyParsed,
      durationMs,
      ok,
      error: errorMsg,
      createdAt: serverTimestamp(),
      createdAtClient,
    }

    // Best-effort ghi log — không làm fail request chính.
    try {
      console.log('[apiLogger] writing log to', API_LOGS_COLLECTION, { method, url, status, ok })
      await addDoc(collection(getDb(), API_LOGS_COLLECTION), log as never)
      console.log('[apiLogger] log written successfully')
    } catch (err) {
      console.error('[apiLogger] FAILED to write log:', err)
    }
  }
}
