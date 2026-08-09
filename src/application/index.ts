export type { Repository } from './ports/repository'
export type { LocalRepository, LocalRepositoryError } from './ports/local-repository'
export {
  ProjectLifecycleService,
  type CreateProjectInput,
  type ImportProjectOptions,
  type ProjectLifecycleDependencies,
  type ProjectLifecycleError,
} from './projects/project-lifecycle-service'
export {
  PLATFORM_ADAPTER_CONTRACT_VERSION,
  type PlatformAdapter,
  type PlatformAdapterDescriptor,
  type PlatformCapability,
  type PlatformFamily,
} from './ports/platform-adapter'
