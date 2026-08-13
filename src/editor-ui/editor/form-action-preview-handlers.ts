import type { JsonValue } from '../../domain'
import type { FormActionHandlerResult, FormActionHandlers } from '../../domain/project/form-action-engine'

export interface PreviewLocalStorage {
  setItem(key: string, value: string): void
}

function configString(config: Readonly<Record<string, JsonValue>>, key: string): string | null {
  const value = config[key]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function failure(message: string): FormActionHandlerResult {
  return { ok: false, message }
}

export function createFormActionPreviewHandlers(storage: PreviewLocalStorage): FormActionHandlers {
  return {
    'show-message': (action) => {
      const message = configString(action.config, 'message')
      return message ? { ok: true, output: message } : failure('La acción Mostrar mensaje necesita un texto.')
    },
    'save-local': (action, context) => {
      const key = configString(action.config, 'key')
      if (!key) return failure('La acción Guardar en este dispositivo necesita un nombre.')
      try {
        storage.setItem(`electrocms:form-action:${key}`, JSON.stringify(context.mappedValues))
        return { ok: true, output: key }
      } catch {
        return failure('El navegador no pudo guardar los datos de esta acción.')
      }
    },
    redirect: (action) => {
      const url = configString(action.config, 'url')
      return url ? { ok: true, output: url } : failure('La acción Redirigir necesita un destino.')
    },
  }
}
