/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const kraApiKey = env.KRA_API_KEY || ''

  return {
    plugins: [react()],
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/__tests__/setup.ts'],
    },
    server: {
      proxy: {
        '/api/kra': {
          target: 'http://apis.data.go.kr',
          changeOrigin: true,
          rewrite: (path) => path.replace('/api/kra', '/B551015'),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              const url = new URL(proxyReq.path, 'http://localhost')
              url.searchParams.set('serviceKey', kraApiKey)
              url.searchParams.set('_type', 'json')
              proxyReq.path = url.pathname + url.search
            })
          },
        },
      },
    },
  }
})
