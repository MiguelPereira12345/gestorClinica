import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      '/auth': { target: 'http://localhost:3001', changeOrigin: true },
      '/plano': { target: 'http://localhost:3001', changeOrigin: true },
      '/dependentes': { target: 'http://localhost:3001', changeOrigin: true },
      '/consultas': { target: 'http://localhost:3001', changeOrigin: true },
      '/gestores': { target: 'http://localhost:3001', changeOrigin: true },
      '/utilizadores': { target: 'http://localhost:3001', changeOrigin: true },
      '/patients': { target: 'http://localhost:3001', changeOrigin: true },
      '/medical-records': { target: 'http://localhost:3001', changeOrigin: true },
      '/schedule': { target: 'http://localhost:3001', changeOrigin: true },
      '/files': { target: 'http://localhost:3001', changeOrigin: true },
      '/notifications': { target: 'http://localhost:3001', changeOrigin: true },
      '/declarations': { target: 'http://localhost:3001', changeOrigin: true },
      '/audit': { target: 'http://localhost:3001', changeOrigin: true },
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
      '/login': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
})
