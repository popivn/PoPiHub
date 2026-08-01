import express from 'express'
import cron from 'node-cron'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// Import các handler từ api/ (tsx sẽ resolve .ts)
import addCronHandler from '../api/add-cron.ts'
import updateCronHandler from '../api/update-cron.ts'
import deleteCronHandler from '../api/delete-cron.ts'
import addScheduledTaskHandler from '../api/add-scheduled-task.ts'
import runCronHandler from '../api/run-cron.ts'
import cronRunnerHandler from '../api/cron-runner.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST_DIR = resolve(__dirname, '..', 'dist')
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000

// Kiểu Vercel-like (đồng bộ với api/*.ts)
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
type VercelHandler = (req: VercelRequest, res: VercelResponse) => Promise<void> | void

// Map route → handler
const routes: { path: string; handler: VercelHandler }[] = [
  { path: '/add-cron', handler: addCronHandler },
  { path: '/api/add-cron', handler: addCronHandler },
  { path: '/update-cron', handler: updateCronHandler },
  { path: '/api/update-cron', handler: updateCronHandler },
  { path: '/delete-cron', handler: deleteCronHandler },
  { path: '/api/delete-cron', handler: deleteCronHandler },
  { path: '/add-scheduled-task', handler: addScheduledTaskHandler },
  { path: '/api/add-scheduled-task', handler: addScheduledTaskHandler },
  { path: '/run-cron', handler: runCronHandler },
  { path: '/api/run-cron', handler: runCronHandler },
  { path: '/cron-runner', handler: cronRunnerHandler },
  { path: '/api/cron-runner', handler: cronRunnerHandler },
]

// Adapter: Express req/res → VercelRequest/VercelResponse
function adaptReq(req: express.Request): VercelRequest {
  const query: Record<string, string | string[] | undefined> = {}
  for (const [k, v] of Object.entries(req.query)) {
    query[k] = Array.isArray(v) ? v.map(String) : v != null ? String(v) : undefined
  }
  const headers: Record<string, string | string[] | undefined> = {}
  for (const [k, v] of Object.entries(req.headers)) {
    headers[k] = Array.isArray(v) ? v : v ?? undefined
  }
  return { method: req.method, body: req.body, query, headers }
}

function adaptRes(res: express.Response): VercelResponse {
  const vRes: VercelResponse = {
    status(code: number) {
      res.status(code)
      return vRes
    },
    setHeader(key: string, value: string) {
      res.setHeader(key, value)
      return vRes
    },
    json(body: unknown) {
      res.json(body)
    },
    end() {
      res.end()
    },
  }
  return vRes
}

const app = express()

// Body parser
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))

// CORS preflight cho mọi route API
app.options('/api/*', (_req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-xetmien-key, Authorization')
  res.status(204).end()
})

// Đăng ký routes API
for (const r of routes) {
  const handler: express.RequestHandler = async (req, res, next) => {
    try {
      await r.handler(adaptReq(req), adaptRes(res))
    } catch (err) {
      next(err)
    }
  }
  // Hỗ trợ cả path có/không có /api prefix
  app.all(r.path, handler)
}

// Serve static frontend từ dist
app.use(express.static(DIST_DIR))

// SPA fallback: mọi route còn lại → index.html
app.get('*', (_req, res) => {
  res.sendFile(resolve(DIST_DIR, 'index.html'))
})

// Error handler
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[server] error:', err)
  if (!res.headersSent) {
    res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    })
  }
})

// Cron nội bộ: chạy cron-runner mỗi 5 phút (tự host, không cần Vercel/Render cron)
const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '*/5 * * * *'
cron.schedule(CRON_SCHEDULE, async () => {
  const startedAt = Date.now()
  console.log(`[cron] triggering cron-runner @ ${new Date().toISOString()}`)
  try {
    // Mock VercelResponse để capture kết quả
    let status = 200
    let payload: unknown = null
    const mockRes: VercelResponse = {
      status(code: number) {
        status = code
        return mockRes
      },
      setHeader() {
        return mockRes
      },
      json(body: unknown) {
        payload = body
      },
      end() {},
    }
    // Đánh dấu là cron nội bộ (bypass auth như Vercel Cron header)
    const mockReq: VercelRequest = {
      method: 'GET',
      headers: { 'x-vercel-cron': '1' },
      query: {},
    }
    await cronRunnerHandler(mockReq, mockRes)
    console.log(
      `[cron] done in ${Date.now() - startedAt}ms status=${status}`,
      JSON.stringify(payload),
    )
  } catch (err) {
    console.error('[cron] cron-runner failed:', err)
  }
})
console.log(`[cron] scheduled cron-runner with "${CRON_SCHEDULE}"`)

app.listen(PORT, () => {
  console.log(`[server] listening on :${PORT}`)
  console.log(`[server] serving static from ${DIST_DIR}`)
})
