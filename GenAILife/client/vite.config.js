import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    port: 3000,
    open: true,
    host: true,
    proxy: {
      '/login': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        secure: false,
      },
      '/create-character': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      input: {
        main: './index.html',
        login: './src/views/login.html',
        createCharacter: './src/views/create_character.html'
      }
    }
  }
});
