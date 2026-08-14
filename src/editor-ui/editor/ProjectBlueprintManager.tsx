import { useState } from 'react'
import { PROJECT_BLUEPRINTS, type ProjectBlueprint } from '../../domain'
import { Button, HelpTip, Icon } from '../primitives'
import { useEditorProject } from './editor-project-context'

export function ProjectBlueprintManager() {
  const session = useEditorProject()
  const [selected, setSelected] = useState<ProjectBlueprint>(PROJECT_BLUEPRINTS[0])
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('Elige un modelo para preparar páginas, contenido y administración editables.')

  async function apply(): Promise<void> {
    if (pending) return
    if (!session.applyProjectBlueprint) {
      setMessage('Esta sesión todavía no permite aplicar modelos de proyecto.')
      return
    }
    setPending(true)
    const result = await session.applyProjectBlueprint(selected)
    setPending(false)
    setMessage(result.ok
      ? `Modelo ${selected.name} aplicado: ya puedes editar sus páginas, contenido y panel administrativo.`
      : `No se pudo aplicar el modelo: ${result.error}`)
  }

  return (
    <section aria-labelledby="project-blueprints-title" className="grid gap-3 p-3 lg:p-4">
      <div className="flex items-start gap-2"><span className="grid size-11 shrink-0 place-items-center rounded-md bg-primary-soft text-primary lg:size-9"><Icon name="layers" size={16} /></span><div className="min-w-0 flex-1"><h2 className="text-sm font-bold text-foreground" id="project-blueprints-title">Empezar con un modelo</h2><p className="mt-0.5 text-xs leading-5 text-muted-foreground">Prepara una base editable con páginas, datos y administración para el tipo de proyecto que quieres crear.</p></div><HelpTip description="Crea una estructura inicial editable sin reemplazar tu trabajo actual. Si ya existe una URL o un tipo equivalente, ElectroCMS detiene la operación." example="El modelo Estudio de tatuajes prepara reservas, categorías, una consulta y un panel para administrarlas." label="Modelos de proyecto" reference="WordPress starter site · Elementor Kit · JetEngine" /></div>
      <div aria-label="Modelos disponibles" className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3" role="list">
        {PROJECT_BLUEPRINTS.map((blueprint) => <button aria-label={blueprint.name} aria-pressed={selected.id === blueprint.id} className={`min-h-24 rounded-lg border p-3 text-left focus-visible:ring-2 focus-visible:ring-focus ${selected.id === blueprint.id ? 'border-primary bg-primary-soft text-primary-strong' : 'border-border bg-surface text-foreground hover:bg-muted'}`} key={blueprint.id} onClick={() => setSelected(blueprint)} role="listitem" type="button"><strong className="block text-xs">{blueprint.name}</strong><span className="mt-1 block text-[0.6875rem] leading-4 text-muted-foreground">{blueprint.description}</span></button>)}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/25 p-3"><p className="text-xs leading-5 text-muted-foreground"><strong className="text-foreground">Seleccionado: {selected.name}.</strong> Se crearán páginas, {selected.primaryContentLabel.toLocaleLowerCase('es')}s y un panel de gestión; podrás deshacerlo si cambias de idea.</p><Button disabled={pending} onClick={() => void apply()}>{pending ? 'Preparando…' : `Usar ${selected.name}`}</Button></div>
      <p aria-live="polite" className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">{message}</p>
    </section>
  )
}
