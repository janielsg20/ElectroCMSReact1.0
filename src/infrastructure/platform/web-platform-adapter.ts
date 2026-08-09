import {
  PLATFORM_ADAPTER_CONTRACT_VERSION,
  type PlatformAdapter,
  type PlatformAdapterDescriptor,
  type PlatformCapability,
} from '../../application/ports/platform-adapter'

export interface WebPlatformEnvironment {
  readonly serviceWorker: boolean
  readonly installPrompt: boolean
}

export class WebPlatformAdapter implements PlatformAdapter {
  readonly descriptor: PlatformAdapterDescriptor

  constructor(environment: WebPlatformEnvironment) {
    const capabilities: PlatformCapability[] = []

    if (environment.serviceWorker) {
      capabilities.push('offline-shell')
    }

    if (environment.installPrompt) {
      capabilities.push('installable')
    }

    this.descriptor = {
      contractVersion: PLATFORM_ADAPTER_CONTRACT_VERSION,
      id: 'electrocms.web',
      family: 'web',
      capabilities,
    }
  }

  isAvailable(): boolean {
    return true
  }
}
