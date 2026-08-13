import type { FormActionKind } from './form-action-engine'

export type FormActionCapability = 'content' | 'identity' | 'messaging' | 'local-storage' | 'navigation' | 'network' | 'relations' | 'files'

export interface FormActionConfigField {
  readonly key: string
  readonly label: string
  readonly required: boolean
  readonly type: 'text' | 'url' | 'email' | 'textarea' | 'content-type' | 'relation' | 'control'
}

export interface FormActionDefinition {
  readonly capability: FormActionCapability
  readonly description: string
  readonly fields: readonly FormActionConfigField[]
  readonly kind: FormActionKind
  readonly label: string
  readonly reference: string
}

export const FORM_ACTION_DEFINITIONS: Readonly<Record<FormActionKind, FormActionDefinition>> = {
  'save-record': {
    capability: 'content', kind: 'save-record', label: 'Guardar registro',
    description: 'Guarda los campos conectados en el contenido asociado al formulario.',
    fields: [], reference: 'JetFormBuilder — Insert/Update Post',
  },
  'create-content': {
    capability: 'content', kind: 'create-content', label: 'Crear contenido',
    description: 'Crea una nueva entrada en un tipo de contenido.',
    fields: [{ key: 'contentTypeId', label: 'Tipo de contenido', required: true, type: 'content-type' }],
    reference: 'JetFormBuilder — Insert/Update Post',
  },
  'update-content': {
    capability: 'content', kind: 'update-content', label: 'Actualizar contenido actual',
    description: 'Actualiza el registro que esté abierto en el contexto donde se use el formulario.',
    fields: [], reference: 'JetFormBuilder — Update Post',
  },
  'register-user': {
    capability: 'identity', kind: 'register-user', label: 'Registrar usuario',
    description: 'Crea una cuenta usando los controles del formulario cuando el destino ofrece gestión de usuarios.',
    fields: [
      { key: 'emailControl', label: 'Campo de correo', required: true, type: 'control' },
      { key: 'nameControl', label: 'Campo de nombre', required: false, type: 'control' },
    ],
    reference: 'JetFormBuilder — Register User',
  },
  'sign-in': {
    capability: 'identity', kind: 'sign-in', label: 'Iniciar sesión',
    description: 'Autentica a una persona usando los controles elegidos cuando el destino ofrece autenticación.',
    fields: [
      { key: 'emailControl', label: 'Campo de correo', required: true, type: 'control' },
      { key: 'passwordControl', label: 'Campo de contraseña', required: true, type: 'control' },
    ],
    reference: 'WordPress — Log In · JetFormBuilder',
  },
  'send-email': {
    capability: 'messaging', kind: 'send-email', label: 'Enviar correo',
    description: 'Envía una notificación cuando el destino dispone de un servicio de correo configurado.',
    fields: [
      { key: 'to', label: 'Enviar a', required: true, type: 'email' },
      { key: 'subject', label: 'Asunto', required: true, type: 'text' },
      { key: 'message', label: 'Mensaje', required: true, type: 'textarea' },
    ],
    reference: 'Elementor Forms — Email · JetFormBuilder — Send Email',
  },
  'save-local': {
    capability: 'local-storage', kind: 'save-local', label: 'Guardar en este dispositivo',
    description: 'Conserva una copia local de los valores en el navegador.',
    fields: [{ key: 'key', label: 'Nombre del guardado local', required: true, type: 'text' }],
    reference: 'ElectroCMS Local-first',
  },
  redirect: {
    capability: 'navigation', kind: 'redirect', label: 'Redirigir',
    description: 'Abre otra ruta o URL cuando las acciones anteriores terminan correctamente.',
    fields: [{ key: 'url', label: 'Destino', required: true, type: 'url' }],
    reference: 'Elementor Forms — Redirect · JetFormBuilder — Redirect to Page',
  },
  'show-message': {
    capability: 'navigation', kind: 'show-message', label: 'Mostrar mensaje',
    description: 'Muestra una confirmación adicional después de procesar el formulario.',
    fields: [{ key: 'message', label: 'Mensaje', required: true, type: 'textarea' }],
    reference: 'Elementor Forms — Success Message',
  },
  webhook: {
    capability: 'network', kind: 'webhook', label: 'Enviar a webhook',
    description: 'Envía los datos a un endpoint externo cuando el destino dispone de esa capacidad.',
    fields: [{ key: 'url', label: 'URL del webhook', required: true, type: 'url' }],
    reference: 'Elementor Forms — Webhook · JetFormBuilder — Call Webhook',
  },
  'update-relation': {
    capability: 'relations', kind: 'update-relation', label: 'Actualizar relación',
    description: 'Conecta el registro procesado con otra entidad usando una relación existente.',
    fields: [
      { key: 'relationId', label: 'Relación', required: true, type: 'relation' },
      { key: 'relatedRecordControl', label: 'Campo con el contenido relacionado', required: true, type: 'control' },
    ],
    reference: 'JetEngine — Relations',
  },
  'upload-file': {
    capability: 'files', kind: 'upload-file', label: 'Procesar archivo',
    description: 'Entrega un archivo elegido en el formulario al sistema de archivos del destino.',
    fields: [{ key: 'control', label: 'Campo de archivo', required: true, type: 'control' }],
    reference: 'JetFormBuilder — Media/File Upload',
  },
}

export const FORM_ACTION_KINDS = Object.keys(FORM_ACTION_DEFINITIONS) as readonly FormActionKind[]

export function formActionDefinition(kind: FormActionKind): FormActionDefinition {
  return FORM_ACTION_DEFINITIONS[kind]
}
