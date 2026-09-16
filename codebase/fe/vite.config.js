import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Chuyển tiếp /api sang backend Express khi chạy dev
    proxy: { '/api': 'http://localhost:4000' },
  },
})
