import { defineConfig, type Plugin } from 'vite'
import mapApiPlugin from './src/server/mapApi'

/**
 * Vite plugin: nhận log từ browser (POST /__devlog) và in ra terminal
 * nơi chạy `npm run dev`. Dùng cho FPS/jank diagnostics.
 */
function devLogPlugin(): Plugin {
  return {
    name: 'devlog',
    configureServer(server) {
      server.middlewares.use('/__devlog', (req, res) => {
        let body = ''
        req.on('data', (chunk) => { body += chunk })
        req.on('end', () => {
          try {
            const data = JSON.parse(body)
            // In ra terminal server với màu
            const tag = data.tag ?? 'BROWSER'
            const msg = data.message ?? ''
            const extra = data.extra ? ` ${JSON.stringify(data.extra)}` : ''
            // \x1b[36m = cyan, \x1b[33m = yellow, \x1b[31m = red, \x1b[0m = reset
            let color = '\x1b[36m'
            if (data.level === 'warn') color = '\x1b[33m'
            if (data.level === 'error') color = '\x1b[31m'
            // eslint-disable-next-line no-console
            console.log(`${color}[${tag}]\x1b[0m ${msg}${extra}`)
          } catch {
            // ignore parse error
          }
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end('{"ok":true}')
        })
      })
    },
  }
}

export default defineConfig({
  server: {
    host: true,
    allowedHosts: true,
  },
  plugins: [devLogPlugin(), mapApiPlugin()],
})
