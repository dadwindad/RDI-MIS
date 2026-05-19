import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/rdi_mis/',
  server: {
    proxy: {
      '/rdi_mis/api': {
        target: 'http://localhost:3001',
        rewrite: (path) => path.replace(/^\/rdi_mis/, '')
      }
    }
  }
})
