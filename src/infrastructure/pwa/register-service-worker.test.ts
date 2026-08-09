import { describe, expect, it, vi } from 'vitest'
import {
  registerElectroCmsServiceWorker,
  SERVICE_WORKER_PATH,
} from './register-service-worker'

describe('registro PWA', () => {
  it('registra el worker sobre todo el origen', async () => {
    const register = vi.fn().mockResolvedValue(undefined)
    const addEventListener = vi.fn()

    await registerElectroCmsServiceWorker({
      ready: Promise.resolve(undefined),
      controller: {},
      register,
      addEventListener,
    })

    expect(register).toHaveBeenCalledWith(SERVICE_WORKER_PATH, { scope: '/' })
    expect(addEventListener).not.toHaveBeenCalled()
  })

  it('espera hasta que el worker controla la página actual', async () => {
    const addEventListener = vi.fn(
      (_type: 'controllerchange', listener: () => void) => listener(),
    )

    await registerElectroCmsServiceWorker({
      ready: Promise.resolve(undefined),
      controller: null,
      register: vi.fn().mockResolvedValue(undefined),
      addEventListener,
    })

    expect(addEventListener).toHaveBeenCalledWith(
      'controllerchange',
      expect.any(Function),
      { once: true },
    )
  })
})
