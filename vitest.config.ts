import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
    exclude: ['tests/e2e/**', 'node_modules/**', '.worktrees/**'],
    env: { VITE_NEON_AUTH_URL: '', VITE_NEON_DATA_API_URL: '' }
  }
})
