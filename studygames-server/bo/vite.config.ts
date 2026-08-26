import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/bo/',
  build: {
    outDir: '../bo-dist',
    emptyOutDir: true,
  },
  plugins: [react(), tailwindcss()],
})
