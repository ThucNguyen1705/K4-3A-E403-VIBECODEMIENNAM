import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Cổng backend: lấy từ biến môi trường API_PORT, hoặc PORT trong ../be/.env, mặc định 8000
function backendPort() {
  if (process.env.API_PORT) return process.env.API_PORT
  try {
    return readFileSync(new URL('../be/.env', import.meta.url), 'utf8').match(/^PORT=(\d+)/m)?.[1] ?? '8000'
  } catch {
    return '8000'
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Chuyển tiếp /api sang backend Express khi chạy dev
    proxy: { '/api': `http://localhost:${backendPort()}` },
  },
})
