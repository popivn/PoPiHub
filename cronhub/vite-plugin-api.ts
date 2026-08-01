import type { Plugin, ViteDevServer } from 'vite'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

type VercelHandler = (
  req: VercelRequestLike,
  res: VercelResponseLike,
) => Promise<void> | void

type VercelRequestLike = {
  method?: string
  body?: unknown
  query?: Record<string, string | string[] | undefined>
  headers: Record<string, string | string[] | undefined>
}

type VercelResponseLike = {
  status(code: number): VercelResponseLike
  setHeader(key: string, value: string): VercelResponseLike
  json(body: unknown): void
  end(): void
}

// Node req/res types (giản lược, dùng any trong middleware).

/**
 * Vite plugin chạy serverless functions trong `api/` khi `npm run dev`.
 * Map route → file handler, convert Node req/res ↔ Vercel req/res.
 */
export function vercelApiPlugin(): Plugin {
  const apiDir = resolve(process.cwd(), 'api')

  // Map route path → handler file (tên file không có đuôi .ts).
  const routes: { path: string; file: string }[] = [
    { path: '/add-cron', file: 'add-cron.ts' },
    { path: '/api/add-cron', file: 'add-cron.ts' },
    { path: '/update-cron', file: 'update-cron.ts' },
    { path: '/api/update-cron', file: 'update-cron.ts' },
    { path: '/delete-cron', file: 'delete-cron.ts' },
    { path: '/api/delete-cron', file: 'delete-cron.ts' },
    { path: '/add-scheduled-task', file: 'add-scheduled-task.ts' },
    { path: '/api/add-scheduled-task', file: 'add-scheduled-task.ts' },
    { path: '/run-cron', file: 'run-cron.ts' },
    { path: '/api/run-cron', file: 'run-cron.ts' },
    { path: '/cron-runner', file: 'cron-runner.ts' },
    { path: '/api/cron-runner', file: 'cron-runner.ts' },
  ]

  return {
    name: 'vercel-api-dev',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
      // Cache handler đã load.
      const handlerCache = new Map<string, VercelHandler>()

      async function getHandler(file: string): Promise<VercelHandler> {
        if (handlerCache.has(file)) return handlerCache.get(file)!
        const fullPath = resolve(apiDir, file)
        // ssrLoadModule để Vite transform TS + HMR.
        const mod = await server.ssrLoadModule(pathToFileURL(fullPath).pathname)
        const handler = mod.default as VercelHandler
        if (typeof handler !== 'function') {
          throw new Error(`api/${file} không export default function`)
        }
        handlerCache.set(file, handler)
        return handler
      }

      // Lắng nghe thay đổi file để clear cache.
      server.watcher.on('change', (filePath) => {
        const rel = resolve(filePath)
        if (rel.startsWith(apiDir)) {
          for (const r of routes) {
            if (resolve(apiDir, r.file) === rel) {
              handlerCache.delete(r.file)
              server.config.logger.info(`[api] reloaded ${r.file}`, {
                timestamp: true,
              })
            }
          }
        }
      })

      server.middlewares.use(async (req: any, res: any, next: () => void) => {
        const url = req.url || ''
        // Tìm route match (path trước query string).
        const pathname = url.split('?')[0]
        const route = routes.find((r) => r.path === pathname)
        if (!route) return next()

        // Parse query string.
        const query: Record<string, string | string[] | undefined> = {}
        const qs = url.split('?')[1]
        if (qs) {
          for (const pair of qs.split('&')) {
            const [k, v] = pair.split('=')
            if (k) query[decodeURIComponent(k)] = v ? decodeURIComponent(v) : ''
          }
        }

        // Đọc body nếu có (POST/PUT/PATCH).
        let body: unknown = undefined
        if (
          req.method &&
          ['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase())
        ) {
          const chunks: Buffer[] = []
          body = await new Promise((resolveBody) => {
            req.on('data', (chunk: unknown) => {
              chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)))
            })
            req.on('end', () => {
              const raw = Buffer.concat(chunks).toString('utf8')
              const ct = String(req.headers['content-type'] || '')
              if (ct.includes('application/json') && raw) {
                try {
                  resolveBody(JSON.parse(raw))
                } catch {
                  resolveBody(raw)
                }
              } else {
                resolveBody(raw || undefined)
              }
            })
            req.on('error', () => resolveBody(undefined))
          })
        }

        // Adapter: Node res → VercelResponseLike.
        const vRes: VercelResponseLike = {
          status(code: number) {
            res.statusCode = code
            return vRes
          },
          setHeader(key: string, value: string) {
            res.setHeader(key, value)
            return vRes
          },
          json(payload: unknown) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify(payload))
          },
          end() {
            res.end()
          },
        }

        // Adapter: Node req → VercelRequestLike.
        const vReq: VercelRequestLike = {
          method: req.method,
          body,
          query,
          headers: req.headers,
        }

        try {
          const handler = await getHandler(route.file)
          server.config.logger.info(`[api] ${route.path} method=${req.method} body=${JSON.stringify(body)}`, { timestamp: true })
          await handler(vReq, vRes)
        } catch (err) {
          server.config.logger.error(`[api] ${route.path} error: ${err}`, {
            timestamp: true,
          })
          if (!res.statusCode || res.statusCode < 400) res.statusCode = 500
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(
            JSON.stringify({
              ok: false,
              error: err instanceof Error ? err.message : String(err),
            }),
          )
        }
      })
    },
  }
}
