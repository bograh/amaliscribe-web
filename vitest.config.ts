import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  resolve: {
    alias: { '@': root.replace(/[\\/]$/, '') },
  },
  test: {
    projects: [
      {
        // API handlers, repository and validation: plain Node, no DOM.
        resolve: { alias: { '@': root.replace(/[\\/]$/, '') } },
        test: {
          name: 'api',
          environment: 'node',
          include: ['lib/**/*.test.ts'],
        },
      },
      {
        // Server components rendered without a request context.
        plugins: [react()],
        resolve: { alias: { '@': root.replace(/[\\/]$/, '') } },
        test: {
          name: 'ui',
          environment: 'jsdom',
          include: ['components/**/*.test.tsx'],
          setupFiles: ['./test/setup.ts'],
        },
      },
    ],
  },
})
