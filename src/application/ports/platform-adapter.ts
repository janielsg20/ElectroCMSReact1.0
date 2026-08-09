export const PLATFORM_ADAPTER_CONTRACT_VERSION = 1 as const

export type PlatformFamily = 'web' | 'desktop' | 'mobile'

export type PlatformCapability =
  | 'offline-shell'
  | 'installable'
  | 'native-filesystem'
  | 'native-share'
  | 'native-window'

export interface PlatformAdapterDescriptor {
  readonly contractVersion: typeof PLATFORM_ADAPTER_CONTRACT_VERSION
  readonly id: string
  readonly family: PlatformFamily
  readonly capabilities: readonly PlatformCapability[]
}

export interface PlatformAdapter {
  readonly descriptor: PlatformAdapterDescriptor
  isAvailable(): boolean
}
