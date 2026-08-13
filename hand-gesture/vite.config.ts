import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', () => {
            // ignore HTTP proxy errors
          })
          proxy.on('proxyReqWs', (_proxyReq, _req, socket) => {
            socket.on('error', () => {
              // ignore WS proxy socket errors (ECONNRESET, ECONNABORTED, etc.)
            })
          })
        },
      },
    },
  },
})
