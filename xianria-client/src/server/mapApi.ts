import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'http'
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs'
import { join, resolve } from 'path'

/**
 * Vite plugin: Map API endpoints for save/load/delete maps.
 *
 * Endpoints:
 *   GET    /api/maps              → list all maps
 *   GET    /api/maps/:id          → load a specific map
 *   POST   /api/maps/:id          → save a map (upsert)
 *   DELETE /api/maps/:id          → delete a map
 *   GET    /api/tilesets          → list available tilesets
 */
function mapApiPlugin(): Plugin {
  const mapsDir = resolve(process.cwd(), 'public', 'maps')

  function ensureMapsDir(): void {
    if (!existsSync(mapsDir)) mkdirSync(mapsDir, { recursive: true })
  }

  function parseBody(req: IncomingMessage): Promise<any> {
    return new Promise((resolvePromise, reject) => {
      let body = ''
      req.on('data', (chunk: Buffer) => { body += chunk })
      req.on('end', () => {
        try {
          resolvePromise(body ? JSON.parse(body) : {})
        } catch (e) {
          reject(e)
        }
      })
      req.on('error', reject)
    })
  }

  function sendJson(res: ServerResponse, status: number, data: any): void {
    res.writeHead(status, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(data))
  }

  return {
    name: 'map-api',
    configureServer(server) {
      // List all maps
      server.middlewares.use('/api/maps', (req: IncomingMessage, res: ServerResponse) => {
        if (req.method === 'GET') {
          ensureMapsDir()
          try {
            const files = readdirSync(mapsDir).filter((f: string) => f.endsWith('.json'))
            const maps = files.map((f: string) => {
              const id = f.replace('.json', '')
              try {
                const raw = readFileSync(join(mapsDir, f), 'utf-8')
                const data = JSON.parse(raw)
                return {
                  id,
                  name: data.name ?? id,
                  widthTiles: data.map?.widthTiles ?? 0,
                  heightTiles: data.map?.heightTiles ?? 0,
                  updatedAt: data.exportedAt ?? null,
                }
              } catch {
                return { id, name: id, widthTiles: 0, heightTiles: 0, updatedAt: null }
              }
            })
            sendJson(res, 200, { maps })
          } catch (e) {
            sendJson(res, 500, { error: 'Failed to list maps' })
          }
          return
        }
      })

      // Individual map CRUD: /api/maps/:id
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = req.url || ''
        // Match /api/maps/:id (no further slashes)
        const match = url.match(/^\/api\/maps\/([^/]+)$/)
        if (!match) { next(); return }
        const id = match[1].replace('.json', '')

        if (!id) {
          sendJson(res, 400, { error: 'Map id required' })
          return
        }

        const filePath = join(mapsDir, `${id}.json`)

        if (req.method === 'GET') {
          if (!existsSync(filePath)) {
            sendJson(res, 404, { error: 'Map not found' })
            return
          }
          try {
            const raw = readFileSync(filePath, 'utf-8')
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(raw)
          } catch (e) {
            sendJson(res, 500, { error: 'Failed to read map' })
          }
          return
        }

        if (req.method === 'POST') {
          parseBody(req).then((data) => {
            ensureMapsDir()
            const mapData = {
              format: 'meowa-map',
              version: 1,
              exportedAt: new Date().toISOString(),
              ...data,
            }
            writeFileSync(filePath, JSON.stringify(mapData, null, 2), 'utf-8')
            sendJson(res, 200, { ok: true, id })
          }).catch(() => {
            sendJson(res, 400, { error: 'Invalid JSON body' })
          })
          return
        }

        if (req.method === 'DELETE') {
          if (!existsSync(filePath)) {
            sendJson(res, 404, { error: 'Map not found' })
            return
          }
          try {
            unlinkSync(filePath)
            sendJson(res, 200, { ok: true, id })
          } catch (e) {
            sendJson(res, 500, { error: 'Failed to delete map' })
          }
          return
        }

        next()
      })

      // List tilesets from public/Map/Map/assets/tilesets/
      server.middlewares.use('/api/tilesets', (req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'GET') return
        const tilesetsDir = resolve(process.cwd(), 'public', 'Map', 'Map', 'assets', 'tilesets')
        try {
          const files = existsSync(tilesetsDir)
            ? readdirSync(tilesetsDir).filter((f: string) => f.endsWith('.png'))
            : []
          const tilesets = files.map((f: string) => ({
            id: f.replace('.png', ''),
            name: f.replace('.png', ''),
            url: `/Map/Map/assets/tilesets/${f}`,
          }))
          sendJson(res, 200, { tilesets })
        } catch (e) {
          sendJson(res, 500, { error: 'Failed to list tilesets' })
        }
      })
    },
  }
}

export default mapApiPlugin
