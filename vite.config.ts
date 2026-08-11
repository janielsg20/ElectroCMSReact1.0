import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { createServiceWorkerSource } from './build/pwa-service-worker'

export default defineConfig({
  resolve: {
    alias: {
      'lottie-web': 'lottie-web/build/player/lottie_light',
    },
  },
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
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/@dnd-kit/')) return 'dnd-kit'
          if (id.includes('/node_modules/dexie/')) return 'local-storage'
          if (
            id.includes('/src/domain/widgets/')
            || id.includes('/src/renderers/react/registered-widget-adapters')
            || id.includes('/src/renderers/react/content-dynamic-widget-adapters')
            || id.includes('/src/renderers/react/commerce-form-filter-widget-adapters')
          ) return 'widget-catalog'
        },
      },
    },
    sourcemap: true,
  },
})
