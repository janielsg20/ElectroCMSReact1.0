import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import { App } from './App'
import { registerElectroCmsServiceWorker } from './infrastructure/pwa/register-service-worker'
import './styles.css'
import './professional-ui.css'
import './professional-ui-v2.css'
import './component-system.css'
import './workspace-refinement-v4.css'
import './micro-ux-v5.css'
import './flutterflow-builder-v6.css'
import './flutterflow-builder-v7.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('No se encontró el contenedor raíz de ElectroCMS.')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  void registerElectroCmsServiceWorker(navigator.serviceWorker)
    .then(() => {
      document.documentElement.dataset.offlineShell = 'ready'
    })
    .catch((error: unknown) => {
      console.error('No se pudo registrar el soporte offline de ElectroCMS.', error)
    })
}
