import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Proxy /api to the Nest backend (start backend on PORT, default 3001, before `npm run dev`).
// ECONNREFUSED here means nothing is listening on the proxy target.
const apiTarget = process.env.VITE_API_URL || 'http://localhost:3001'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,       // always start on 5173
    strictPort: false, // if 5173 is taken, increment rather than crash
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
})
