import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  bumpThemePackageVersion,
  createThemePackage,
  deserializeThemePackage,
  duplicateThemePackage,
  parseThemePackageId,
  serializeThemePackage,
  updateThemePackageMetadata,
  type ThemePackage,
  type ThemePackagePartSelection,
  type ThemePackageRouteConflictPolicy,
} from '../../domain'
import { Button, Icon } from '../primitives'
import { useEditorProject, useEditorProjectStructure } from './editor-project-context'

const EMPTY_SELECTION: ThemePackagePartSelection = {
  backendTheme: false,
  documents: false,
  frontendTheme: false,
  globalComponents: false,
}

function selectionForPackage(themePackage: ThemePackage): ThemePackagePartSelection {
  return {
    backendTheme: Boolean(themePackage.contents.themes.backend),
    documents: themePackage.contents.documents.length > 0,
    frontendTheme: Boolean(themePackage.contents.themes.frontend),
    globalComponents: themePackage.contents.globalComponents.length > 0,
  }
}

function firstDiagnosticMessage(result: { readonly error: readonly { readonly message: string }[] }): string {
  return result.error[0]?.message ?? 'La operación no pudo completarse.'
}

function safeFileName(value: string): string {
  const normalized = value.trim().toLocaleLowerCase('es').replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '')
  return normalized || 'electrocms-theme'
}

export function ThemePackageManager() {
  const session = useEditorProject()
  const structure = useEditorProjectStructure()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [packages, setPackages] = useState<readonly ThemePackage[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [name, setName] = useState('Theme local')
  const [description, setDescription] = useState('')
  const [version, setVersion] = useState('1.0.0')
  const [createSelection, setCreateSelection] = useState<ThemePackagePartSelection>(() => ({
    backendTheme: true,
    documents: Object.keys(structure.documents).length > 0,
    frontendTheme: true,
    globalComponents: Object.keys(structure.globalComponents).length > 0,
  }))
  const [applySelection, setApplySelection] = useState<ThemePackagePartSelection>(EMPTY_SELECTION)
  const [routeConflict, setRouteConflict] = useState<ThemePackageRouteConflictPolicy>('abort')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [deleteArmedId, setDeleteArmedId] = useState<string | null>(null)

  const orderedPackages = useMemo(
    () => [...packages].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    [packages],
  )
  const selectedPackage = orderedPackages.find((themePackage) => themePackage.packageId === selectedId)
    ?? orderedPackages[0]

  const selectPackage = useCallback((themePackage: ThemePackage | undefined) => {
    if (!themePackage) {
      setSelectedId('')
      setApplySelection(EMPTY_SELECTION)
      return
    }
    setSelectedId(themePackage.packageId)
    setName(themePackage.name)
    setDescription(themePackage.description)
    setVersion(themePackage.version)
    setApplySelection(selectionForPackage(themePackage))
    setDeleteArmedId(null)
  }, [])

  const reload = useCallback(async (preferredId?: string) => {
    const result = await session.listThemePackages()
    if (!result.ok) {
      setMessage(result.error)
      return
    }
    setPackages(result.value)
    const next = result.value.find((themePackage) => themePackage.packageId === preferredId)
      ?? result.value.find((themePackage) => themePackage.packageId === selectedId)
      ?? [...result.value].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0]
    selectPackage(next)
  }, [selectPackage, selectedId, session])

  useEffect(() => {
    void reload()
  }, [reload])

  function toggleSelection(
    current: ThemePackagePartSelection,
    key: keyof ThemePackagePartSelection,
    setter: (selection: ThemePackagePartSelection) => void,
  ): void {
    setter({ ...current, [key]: !current[key] })
  }

  async function createPackage(): Promise<void> {
    if (pending) return
    setPending(true)
    const created = createThemePackage(structure, {
      createdAt: new Date().toISOString(),
      description,
      name,
      packageId: parseThemePackageId(crypto.randomUUID()),
      selection: createSelection,
      version,
    })
    if (!created.ok) {
      setMessage(firstDiagnosticMessage(created))
      setPending(false)
      return
    }
    const saved = await session.saveThemePackage(created.value)
    if (!saved.ok) {
      setMessage(saved.error)
      setPending(false)
      return
    }
    setMessage(`Paquete ${created.value.name} guardado localmente.`)
    await reload(created.value.packageId)
    setPending(false)
  }

  async function saveMetadata(): Promise<void> {
    if (!selectedPackage || pending) return
    const updated = updateThemePackageMetadata(selectedPackage, {
      description,
      name,
      updatedAt: new Date().toISOString(),
      version,
    })
    if (!updated.ok) {
      setMessage(firstDiagnosticMessage(updated))
      return
    }
    setPending(true)
    const saved = await session.saveThemePackage(updated.value)
    setMessage(saved.ok ? 'Metadatos y versión actualizados.' : saved.error)
    if (saved.ok) await reload(updated.value.packageId)
    setPending(false)
  }

  async function duplicateSelected(): Promise<void> {
    if (!selectedPackage || pending) return
    const duplicated = duplicateThemePackage(selectedPackage, {
      packageId: parseThemePackageId(crypto.randomUUID()),
      timestamp: new Date().toISOString(),
    })
    if (!duplicated.ok) {
      setMessage(firstDiagnosticMessage(duplicated))
      return
    }
    setPending(true)
    const saved = await session.saveThemePackage(duplicated.value)
    setMessage(saved.ok ? `Creada ${duplicated.value.name}.` : saved.error)
    if (saved.ok) await reload(duplicated.value.packageId)
    setPending(false)
  }

  async function bumpVersion(level: 'major' | 'minor' | 'patch'): Promise<void> {
    if (!selectedPackage || pending) return
    const bumped = bumpThemePackageVersion(selectedPackage, level, new Date().toISOString())
    if (!bumped.ok) {
      setMessage(firstDiagnosticMessage(bumped))
      return
    }
    setPending(true)
    const saved = await session.saveThemePackage(bumped.value)
    setMessage(saved.ok ? `Versión actualizada a ${bumped.value.version}.` : saved.error)
    if (saved.ok) await reload(bumped.value.packageId)
    setPending(false)
  }

  async function applySelected(): Promise<void> {
    if (!selectedPackage || pending) return
    setPending(true)
    const applied = await session.applyThemePackage(selectedPackage, applySelection, routeConflict)
    if (!applied.ok) {
      setMessage(applied.error)
      setPending(false)
      return
    }
    const scopes = applied.value.updatedThemeScopes.join(', ') || 'sin temas reemplazados'
    const routes = applied.value.renamedRoutes.length > 0
      ? ` ${applied.value.renamedRoutes.length} ruta(s) renombrada(s).`
      : ''
    setMessage(`Paquete aplicado: ${applied.value.importedDocuments} documentos, ${applied.value.importedGlobalComponents} componentes, ${scopes}.${routes}`)
    setPending(false)
  }

  async function removeSelected(): Promise<void> {
    if (!selectedPackage || pending) return
    if (deleteArmedId !== selectedPackage.packageId) {
      setDeleteArmedId(selectedPackage.packageId)
      setMessage('Pulsa Confirmar eliminación para borrar solo este paquete local. El proyecto no se modifica.')
      return
    }
    setPending(true)
    const removed = await session.removeThemePackage(selectedPackage.packageId)
    setMessage(removed.ok && removed.value ? 'Paquete local eliminado.' : removed.ok ? 'El paquete ya no existía.' : removed.error)
    setDeleteArmedId(null)
    if (removed.ok) await reload()
    setPending(false)
  }

  async function importFile(file: File): Promise<void> {
    setPending(true)
    try {
      const serialized = await file.text()
      const parsed = deserializeThemePackage(serialized)
      if (!parsed.ok) {
        setMessage(firstDiagnosticMessage(parsed))
        return
      }
      const saved = await session.saveThemePackage(parsed.value)
      if (!saved.ok) {
        setMessage(saved.error)
        return
      }
      setMessage(`Importado ${parsed.value.name} v${parsed.value.version}. No se aplicó automáticamente.`)
      await reload(parsed.value.packageId)
    } finally {
      setPending(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function exportSelected(): void {
    if (!selectedPackage) return
    const serialized = serializeThemePackage(selectedPackage)
    if (!serialized.ok) {
      setMessage(firstDiagnosticMessage(serialized))
      return
    }
    const url = URL.createObjectURL(new Blob([serialized.value], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${safeFileName(selectedPackage.name)}-${selectedPackage.version}.electrocms-theme.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setMessage('Paquete exportado como JSON canónico local.')
  }

  const packageAvailability = selectedPackage ? selectionForPackage(selectedPackage) : EMPTY_SELECTION

  return (
    <section aria-labelledby="theme-packages-title" className="grid gap-2">
      <div className="flex items-start gap-2 rounded-md border border-border bg-muted/30 p-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary-soft text-primary"><Icon name="content" size={15} /></span>
        <div className="min-w-0">
          <h2 className="text-xs font-bold" id="theme-packages-title">Paquetes reutilizables</h2>
          <p className="text-[0.625rem] leading-4 text-muted-foreground">Formato local versionado. Importar nunca aplica ni sobrescribe por sí solo; aplicar entra al historial reversible.</p>
        </div>
      </div>

      <div className="grid gap-2 rounded-md border border-border bg-surface p-2">
        <div className="flex items-center justify-between gap-2">
          <div><strong className="block text-xs">Crear desde el proyecto</strong><span className="text-[0.625rem] text-muted-foreground">Breakpoints se incluyen automáticamente cuando hay documentos o componentes.</span></div>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[0.625rem] font-bold text-muted-foreground">schema v1</span>
        </div>
        <label className="grid gap-1 text-xs font-semibold">Nombre<input className="min-h-11 rounded-md border border-border bg-surface px-2 text-xs font-normal focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9" maxLength={160} onChange={(event) => setName(event.target.value)} value={name} /></label>
        <label className="grid gap-1 text-xs font-semibold">Descripción<textarea className="min-h-20 resize-y rounded-md border border-border bg-surface p-2 text-xs font-normal focus-visible:ring-2 focus-visible:ring-focus" maxLength={1000} onChange={(event) => setDescription(event.target.value)} value={description} /></label>
        <label className="grid gap-1 text-xs font-semibold">Versión<input className="min-h-11 rounded-md border border-border bg-surface px-2 font-mono text-xs font-normal focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9" inputMode="numeric" onChange={(event) => setVersion(event.target.value)} value={version} /></label>
        <fieldset className="grid grid-cols-2 gap-1 border-0 p-0" aria-label="Partes del nuevo paquete">
          {([
            ['frontendTheme', 'Frontend'],
            ['backendTheme', 'Backend'],
            ['documents', `Documentos · ${Object.keys(structure.documents).length}`],
            ['globalComponents', `Componentes · ${Object.keys(structure.globalComponents).length}`],
          ] as const).map(([key, label]) => (
            <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border bg-muted/20 px-2 text-xs lg:min-h-9" key={key}>
              <input checked={createSelection[key]} className="size-4 accent-current" onChange={() => toggleSelection(createSelection, key, setCreateSelection)} type="checkbox" />
              <span className="truncate">{label}</span>
            </label>
          ))}
        </fieldset>
        <div className="flex justify-end"><Button disabled={pending || !name.trim()} onClick={() => void createPackage()} size="small"><Icon name="plus" size={12} />Guardar paquete</Button></div>
      </div>

      <div className="grid gap-2 rounded-md border border-border bg-surface p-2">
        <div className="flex items-center justify-between gap-2">
          <div><strong className="block text-xs">Biblioteca local</strong><span className="text-[0.625rem] text-muted-foreground">{orderedPackages.length} paquete(s) guardado(s)</span></div>
          <div className="flex gap-1">
            <input accept="application/json,.json" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importFile(file) }} ref={fileInputRef} type="file" />
            <Button disabled={pending} onClick={() => fileInputRef.current?.click()} size="small" variant="secondary"><Icon name="upload" size={12} />Importar</Button>
            <Button disabled={!selectedPackage} onClick={exportSelected} size="small" variant="secondary">Exportar</Button>
          </div>
        </div>

        {orderedPackages.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">Aún no hay paquetes locales. Guarda el estado actual o importa un archivo ElectroCMS.</div>
        ) : (
          <div className="grid gap-1" role="listbox" aria-label="Paquetes locales">
            {orderedPackages.map((themePackage) => (
              <button aria-selected={selectedPackage?.packageId === themePackage.packageId} className={`grid min-h-11 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md border px-2 text-left focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 ${selectedPackage?.packageId === themePackage.packageId ? 'border-primary bg-primary-soft' : 'border-border bg-muted/20 hover:bg-muted'}`} key={themePackage.packageId} onClick={() => selectPackage(themePackage)} role="option" type="button">
                <span className="min-w-0"><strong className="block truncate text-xs">{themePackage.name}</strong><span className="block truncate text-[0.625rem] text-muted-foreground">v{themePackage.version} · {themePackage.contents.documents.length} docs · {themePackage.contents.globalComponents.length} comp.</span></span>
                {selectedPackage?.packageId === themePackage.packageId ? <Icon className="text-primary" name="check" size={13} /> : null}
              </button>
            ))}
          </div>
        )}

        {selectedPackage ? (
          <div className="grid gap-2 border-t border-border pt-2">
            <div className="grid grid-cols-2 gap-1 text-[0.625rem]">
              <span className="rounded bg-muted px-2 py-1">Frontend: <strong>{selectedPackage.contents.themes.frontend ? 'sí' : 'no'}</strong></span>
              <span className="rounded bg-muted px-2 py-1">Backend: <strong>{selectedPackage.contents.themes.backend ? 'sí' : 'no'}</strong></span>
              <span className="rounded bg-muted px-2 py-1">Documentos: <strong>{selectedPackage.contents.documents.length}</strong></span>
              <span className="rounded bg-muted px-2 py-1">Componentes: <strong>{selectedPackage.contents.globalComponents.length}</strong></span>
            </div>

            <div className="grid grid-cols-3 gap-1">
              <Button disabled={pending} onClick={() => void bumpVersion('patch')} size="small" variant="secondary">+ patch</Button>
              <Button disabled={pending} onClick={() => void bumpVersion('minor')} size="small" variant="secondary">+ minor</Button>
              <Button disabled={pending} onClick={() => void bumpVersion('major')} size="small" variant="secondary">+ major</Button>
            </div>
            <div className="flex flex-wrap justify-end gap-1">
              <Button disabled={pending} onClick={() => void saveMetadata()} size="small" variant="secondary">Guardar edición</Button>
              <Button disabled={pending} onClick={() => void duplicateSelected()} size="small" variant="secondary">Duplicar</Button>
              <Button disabled={pending} onClick={() => void removeSelected()} size="small" variant="secondary">{deleteArmedId === selectedPackage.packageId ? 'Confirmar eliminación' : 'Eliminar'}</Button>
            </div>

            <fieldset className="grid grid-cols-2 gap-1 border-0 p-0" aria-label="Partes a aplicar">
              {([
                ['frontendTheme', 'Frontend'],
                ['backendTheme', 'Backend'],
                ['documents', 'Documentos'],
                ['globalComponents', 'Componentes'],
              ] as const).map(([key, label]) => (
                <label className={`flex min-h-11 items-center gap-2 rounded-md border px-2 text-xs lg:min-h-9 ${packageAvailability[key] ? 'cursor-pointer border-border bg-muted/20' : 'cursor-not-allowed border-border/60 bg-muted/10 text-muted-foreground'}`} key={key}>
                  <input checked={applySelection[key] && packageAvailability[key]} className="size-4 accent-current" disabled={!packageAvailability[key]} onChange={() => toggleSelection(applySelection, key, setApplySelection)} type="checkbox" />
                  {label}
                </label>
              ))}
            </fieldset>

            {applySelection.documents ? (
              <fieldset className="grid grid-cols-2 gap-1 border-0 p-0" aria-label="Conflictos de rutas">
                <legend className="col-span-2 text-[0.625rem] font-bold uppercase tracking-wide text-muted-foreground">Si una ruta ya existe</legend>
                {([['abort', 'Detener'], ['suffix', 'Renombrar copia']] as const).map(([value, label]) => (
                  <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border bg-muted/20 px-2 text-xs lg:min-h-9" key={value}><input checked={routeConflict === value} className="size-4 accent-current" name="route-conflict" onChange={() => setRouteConflict(value)} type="radio" />{label}</label>
                ))}
              </fieldset>
            ) : null}
            <div className="flex justify-end"><Button disabled={pending} onClick={() => void applySelected()} size="small"><Icon name="arrow-right" size={12} />Aplicar al proyecto</Button></div>
          </div>
        ) : null}
      </div>

      {message ? <p aria-live="polite" className="rounded-md border border-border bg-muted/25 p-2 text-xs text-muted-foreground">{message}</p> : null}
      <p className="text-[0.625rem] leading-4 text-muted-foreground">M08.4 empaqueta solo capacidades ya canónicas: temas, documentos, componentes y breakpoints dependientes. CPT, campos, formularios, consultas, roles, medios y demo se incorporarán en sus fases propietarias sin simular datos hoy.</p>
    </section>
  )
}
