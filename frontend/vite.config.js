import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const proxyTarget = (env.VITE_API_URL && String(env.VITE_API_URL).trim())
    ? String(env.VITE_API_URL).trim()
    : 'https://gestorclinica.onrender.com'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/auth': { target: proxyTarget, changeOrigin: true },
        '/plano': { target: proxyTarget, changeOrigin: true },
        '/dependentes': { target: proxyTarget, changeOrigin: true },
        '/consultas': { target: proxyTarget, changeOrigin: true },
        '/gestores': { target: proxyTarget, changeOrigin: true },
        '/utilizadores': { target: proxyTarget, changeOrigin: true },
        '/patients': { target: proxyTarget, changeOrigin: true },
        '/medical-records': { target: proxyTarget, changeOrigin: true },
        '/schedule': { target: proxyTarget, changeOrigin: true },
        '/files': { target: proxyTarget, changeOrigin: true },
        '/notifications': { target: proxyTarget, changeOrigin: true },
        '/declarations': { target: proxyTarget, changeOrigin: true },
        '/audit': { target: proxyTarget, changeOrigin: true },
        '/api': { target: proxyTarget, changeOrigin: true },
        '/login': { target: proxyTarget, changeOrigin: true },
      },
    },
  }
})
