import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { createServiceWorkerSource } from './build/pwa-service-worker'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'electrocms-pwa-shell',
      apply: 'build',
      generateBundle(_options, bundle) {
        this.emitFile({
          type: 'asset',
          fileName: 'sw.js',
          source: createServiceWorkerSource(Object.keys(bundle)),
        })
      },
    },
  ],
  build: {
    sourcemap: true,
  },
})
