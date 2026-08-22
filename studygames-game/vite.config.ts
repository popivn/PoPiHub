import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3636,
    host: true,
    allowedHosts: true,
    proxy: {
      '/auth': 'http://localhost:3000',
      '/players': 'http://localhost:3000',
      '/settings': 'http://localhost:3000',
      '/bo': 'http://localhost:3000',
      '/learn': 'http://localhost:3000',
    },
  },
})
