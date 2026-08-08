import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
    exclude: ['tests/e2e/**', 'node_modules/**', '.worktrees/**'],
    env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' }
  }
})
