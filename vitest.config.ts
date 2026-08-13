import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    // Several UI suites share browser-like globals and lazy modules. Running
    // files concurrently makes their timing nondeterministic in CI and local
    // validation, while the individual contracts remain independent.
    fileParallelism: false,
    setupFiles: './src/test/setup.ts',
    testTimeout: 15_000,
  },
})
