import { describe, expect, it } from 'vitest'
import type { Form } from '../../domain'
import type { FormActionExecutionContext } from '../../domain/project/form-action-engine'
import { createFormActionPreviewHandlers } from './form-action-preview-handlers'

function action(kind: Form['actions'][number]['kind'], config: Form['actions'][number]['config']): Form['actions'][number] {
  return { config, id: `action-${kind}`, kind }
}

const context = {
  actionIndex: 0,
  cms: {} as FormActionExecutionContext['cms'],
  form: {} as FormActionExecutionContext['form'],
  mappedValues: { field: 'Ada' },
  values: {},
} satisfies FormActionExecutionContext

describe('M11.4 preview action handlers', () => {
  it('muestra mensajes y prepara redirects sin navegar', async () => {
    const handlers = createFormActionPreviewHandlers({ setItem: () => undefined })
    const showMessage = handlers['show-message']
    const redirect = handlers.redirect
    expect(showMessage).toBeDefined()
    expect(redirect).toBeDefined()
    if (!showMessage || !redirect) return

    expect(await showMessage(action('show-message', { message: 'Listo' }), context)).toEqual({ ok: true, output: 'Listo' })
    expect(await redirect(action('redirect', { url: '/gracias' }), context)).toEqual({ ok: true, output: '/gracias' })
  })

  it('guarda una copia local de los valores mapeados', async () => {
    const entries = new Map<string, string>()
    const handlers = createFormActionPreviewHandlers({ setItem: (key, value) => entries.set(key, value) })
    const saveLocal = handlers['save-local']
    expect(saveLocal).toBeDefined()
    if (!saveLocal) return

    expect(await saveLocal(action('save-local', { key: 'contacto' }), context)).toEqual({ ok: true, output: 'contacto' })
    expect(JSON.parse(entries.get('electrocms:form-action:contacto') ?? '{}')).toEqual({ field: 'Ada' })
  })

  it('rechaza configuración incompleta o almacenamiento fallido', async () => {
    const broken = createFormActionPreviewHandlers({ setItem: () => { throw new Error('quota') } })
    const showMessage = broken['show-message']
    const redirect = broken.redirect
    const saveLocal = broken['save-local']
    expect(showMessage).toBeDefined()
    expect(redirect).toBeDefined()
    expect(saveLocal).toBeDefined()
    if (!showMessage || !redirect || !saveLocal) return

    expect(await showMessage(action('show-message', {}), context)).toMatchObject({ ok: false })
    expect(await redirect(action('redirect', {}), context)).toMatchObject({ ok: false })
    expect(await saveLocal(action('save-local', { key: 'x' }), context)).toMatchObject({ ok: false })
  })
})
