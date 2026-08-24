import 'dotenv/config'
import express, { type Request, type Response, type NextFunction } from 'express'
import { createServer } from 'vite'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function createDevServer() {
  const app = express()
  app.use(express.json())

  // Simple Request Logging Middleware
  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now()
    res.on('finish', () => {
      const duration = Date.now() - start
      console.log(`[API] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} (${duration}ms)`)
    })
    next()
  })

  const vite = await createServer({
    root: __dirname,
    server: {
      middlewareMode: true,
      allowedHosts: true,
    },
    appType: 'spa',
  })

  app.all('/api/auth', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mod = await import('./api/auth.ts')
      await mod.default(req, res)
    } catch (err) {
      next(err)
    }
  })

  app.all('/api/zones', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mod = await import('./api/zones.ts')
      await mod.default(req, res)
    } catch (err) {
      next(err)
    }
  })

  app.all('/api/tasks', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mod = await import('./api/tasks.ts')
      await mod.default(req, res)
    } catch (err) {
      next(err)
    }
  })

  app.all('/api/ai', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mod = await import('./api/ai.ts')
      await mod.default(req, res)
    } catch (err) {
      next(err)
    }
  })

  app.use(vite.middlewares)

  app.listen(5173, '0.0.0.0', () => {
    console.log('Dev server running at http://localhost:5173')
    console.log('API endpoints: /api/auth, /api/zones, /api/tasks, /api/ai')
  })
}

createDevServer().catch((err) => {
  console.error('Failed to start dev server:', err)
  process.exit(1)
})
