import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/rdi_mis/',
  server: {
    proxy: {
      '/rdi_mis/api/pms': {
        target: 'http://localhost:3802',
        rewrite: (path) => path.replace(/^\/rdi_mis/, '')
      },
      '/rdi_mis/api/activities': {
        target: 'http://localhost:3803',
        rewrite: (path) => path.replace(/^\/rdi_mis/, '')
      },
      '/rdi_mis/api/qa': {
        target: 'http://localhost:3805',
        rewrite: (path) => path.replace(/^\/rdi_mis/, '')
      },
      '/rdi_mis/api': {
        target: 'http://localhost:3801',
        rewrite: (path) => path.replace(/^\/rdi_mis/, '')
      }
    }
  }
})
