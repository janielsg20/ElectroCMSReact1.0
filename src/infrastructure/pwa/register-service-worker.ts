export const SERVICE_WORKER_PATH = '/sw.js'

export interface ServiceWorkerRegistrar {
  readonly ready: Promise<unknown>
  readonly controller: object | null
  register(scriptURL: string, options: { scope: string }): Promise<unknown>
  addEventListener(
    type: 'controllerchange',
    listener: () => void,
    options: { once: true },
  ): void
}

export async function registerElectroCmsServiceWorker(
  registrar: ServiceWorkerRegistrar,
): Promise<void> {
  await registrar.register(SERVICE_WORKER_PATH, { scope: '/' })
  await registrar.ready

  if (!registrar.controller) {
    await new Promise<void>((resolve) => {
      registrar.addEventListener('controllerchange', resolve, { once: true })
    })
  }
}
