export interface ExportDiagnostic {
  readonly code: string
  readonly message: string
  readonly severity: 'warning' | 'error'
  readonly path?: string
}

export interface ExportArtifact {
  readonly fileName: string
  readonly mediaType: string
  readonly bytes: Uint8Array
}

export interface Exporter<TModel> {
  readonly id: string
  readonly version: string
  diagnose(model: TModel): readonly ExportDiagnostic[]
  export(model: TModel): Promise<ExportArtifact>
}
