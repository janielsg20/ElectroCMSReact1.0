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
    const storage = { setItem: () => undefined }
    const handlers = createFormActionPreviewHandlers(storage)

    await expect(handlers['show-message']?.(action('show-message', { message: 'Listo' }), context)).resolves.toEqual({ ok: true, output: 'Listo' })
    await expect(handlers.redirect?.(action('redirect', { url: '/gracias' }), context)).resolves.toEqual({ ok: true, output: '/gracias' })
  })

  it('guarda una copia local de los valores mapeados', async () => {
    const entries = new Map<string, string>()
    const handlers = createFormActionPreviewHandlers({ setItem: (key, value) => entries.set(key, value) })

    await expect(handlers['save-local']?.(action('save-local', { key: 'contacto' }), context)).resolves.toEqual({ ok: true, output: 'contacto' })
    expect(JSON.parse(entries.get('electrocms:form-action:contacto') ?? '{}')).toEqual({ field: 'Ada' })
  })

  it('rechaza configuración incompleta o almacenamiento fallido', async () => {
    const broken = createFormActionPreviewHandlers({ setItem: () => { throw new Error('quota') } })
    await expect(broken['show-message']?.(action('show-message', {}), context)).resolves.toMatchObject({ ok: false })
    await expect(broken.redirect?.(action('redirect', {}), context)).resolves.toMatchObject({ ok: false })
    await expect(broken['save-local']?.(action('save-local', { key: 'x' }), context)).resolves.toMatchObject({ ok: false })
  })
})
