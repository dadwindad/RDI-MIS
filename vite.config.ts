import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/RDI-MIS/',
  server: {
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
})
