import { useState } from 'react'
import type { Form } from '../../domain'
import {
  formExportCompatibilityMatrix,
  type FormCompatibilityStatus,
} from '../../domain/project/form-export-compatibility'
import {
  DEFAULT_FORM_FILE_POLICY,
  formSecurityRequirements,
} from '../../domain/project/form-security-contract'
import { HelpTip, Icon } from '../primitives'
import { useFormSession } from './form-session-context'

const statusLabels: Readonly<Record<FormCompatibilityStatus, string>> = {
  'contract-ready': 'Vista previa validada',
  'adapter-required': 'Necesita adaptador del destino',
  'exporter-pending': 'Exportador aún no disponible',
  'not-applicable': 'No aplica',
}

const statusClasses: Readonly<Record<FormCompatibilityStatus, string>> = {
  'contract-ready': 'border-primary/25 bg-primary-soft text-primary-strong',
  'adapter-required': 'border-border bg-muted/30 text-foreground',
  'exporter-pending': 'border-border bg-muted/40 text-muted-foreground',
  'not-applicable': 'border-border bg-surface text-muted-foreground',
}

function StatusBadge({ status }: { readonly status: FormCompatibilityStatus }) {
  return <span className={`rounded-md border px-1.5 py-0.5 text-[0.625rem] font-semibold ${statusClasses[status]}`}>{statusLabels[status]}</span>
}

export function FormSecuritySettings({ form }: { readonly form: Form }) {
  const forms = useFormSession()
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState<{ readonly kind: 'error' | 'success'; readonly text: string } | null>(null)
  const requirements = formSecurityRequirements(form)
  const compatibility = formExportCompatibilityMatrix(form)

  async function toggleCsrf(): Promise<void> {
    setPending(true)
    const result = await forms.updateForm(form.id, { csrfProtection: !form.csrfProtection })
    setPending(false)
    setNotice(result.ok
      ? { kind: 'success', text: form.csrfProtection ? 'Protección CSRF desactivada como requisito del formulario.' : 'Protección CSRF activada para destinos con servidor.' }
      : { kind: 'error', text: result.error })
  }

  return (
    <section aria-labelledby="form-security-settings-heading" className="grid gap-2 rounded-lg border border-border bg-surface p-2.5">
      <div className="flex items-start gap-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary-soft text-primary"><Icon name="check" size={14} /></span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <h3 className="text-xs font-bold text-foreground" id="form-security-settings-heading">Seguridad y destinos</h3>
            <HelpTip
              description="ElectroCMS valida el payload antes de ejecutar acciones y declara qué protecciones debe aplicar cada destino con servidor. No inventa tokens ni servicios que todavía no existen."
              label="Seguridad de formularios"
              reference="WordPress Nonces · validación del servidor · escape de salida"
            />
          </div>
          <p className="text-[0.625rem] leading-4 text-muted-foreground">Revisa qué protege ya el formulario y qué deberá implementar el exportador o servidor final.</p>
        </div>
      </div>

      {notice ? <p className={`rounded-md px-2 py-1.5 text-xs ${notice.kind === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-primary-soft text-primary-strong'}`} role={notice.kind === 'error' ? 'alert' : 'status'}>{notice.text}</p> : null}

      <div className="flex min-h-11 items-center gap-2 rounded-md border border-border bg-muted/15 px-2 lg:min-h-9">
        <button
          aria-checked={form.csrfProtection}
          aria-label="Exigir protección CSRF en destinos con servidor"
          className="grid size-11 shrink-0 place-items-center rounded-md focus-visible:ring-2 focus-visible:ring-focus lg:h-8 lg:w-11"
          disabled={pending}
          onClick={() => { void toggleCsrf() }}
          role="switch"
          type="button"
        >
          <span aria-hidden="true" className={`relative block h-6 w-11 rounded-full border transition-colors ${form.csrfProtection ? 'border-primary bg-primary' : 'border-border bg-surface'}`}>
            <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform ${form.csrfProtection ? 'translate-x-[1.15rem]' : 'translate-x-0.5'}`} />
          </span>
        </button>
        <span className="min-w-0 flex-1">
          <strong className="block text-xs text-foreground">Exigir protección CSRF en destinos con servidor</strong>
          <span className="block text-[0.625rem] leading-4 text-muted-foreground">El editor no fabrica tokens. El exportador deberá generar y verificar la protección adecuada para su plataforma.</span>
        </span>
      </div>

      <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ['Validar de nuevo en servidor', requirements.serverInputValidation],
          ['Limitar solicitudes abusivas', requirements.rateLimit],
          ['Honeypot antispam', requirements.honeypot],
          ['Escapar al mostrar contenido', requirements.outputEscaping],
          ['Revalidar archivos en servidor', requirements.serverFileRevalidation],
          ['CAPTCHA opcional según destino', requirements.captcha === 'optional'],
        ].map(([label, active]) => (
          <div className="flex min-h-11 items-center gap-2 rounded-md border border-border bg-muted/10 px-2 lg:min-h-9" key={String(label)}>
            <Icon name={active ? 'check' : 'close'} size={12} />
            <span className="text-[0.625rem] font-semibold text-foreground">{String(label)}</span>
          </div>
        ))}
      </div>

      <details className="rounded-md border border-border bg-muted/10">
        <summary className="min-h-11 cursor-pointer px-2 py-2 text-xs font-bold text-foreground focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9">Política portable de archivos</summary>
        <div className="grid gap-1 border-t border-border p-2 text-[0.625rem] leading-4 text-muted-foreground">
          <span><strong className="text-foreground">Tamaño máximo:</strong> {Math.round(DEFAULT_FORM_FILE_POLICY.maxBytes / (1024 * 1024))} MB.</span>
          <span><strong className="text-foreground">Extensiones permitidas:</strong> {DEFAULT_FORM_FILE_POLICY.allowedExtensions.join(', ')}.</span>
          <span><strong className="text-foreground">Tipos permitidos:</strong> {DEFAULT_FORM_FILE_POLICY.allowedMimeTypes.join(', ')}.</span>
          <span>El servidor final debe volver a verificar el archivo; los metadatos del navegador no se consideran una garantía de seguridad.</span>
        </div>
      </details>

      <div className="grid gap-2">
        <div>
          <strong className="block text-xs text-foreground">Compatibilidad por destino</strong>
          <span className="text-[0.625rem] leading-4 text-muted-foreground">La vista previa local no significa que un exportador ya esté terminado. Los destinos futuros permanecen marcados como pendientes.</span>
        </div>
        <div className="grid gap-1.5 md:grid-cols-2">
          {compatibility.map((target) => (
            <details className="rounded-md border border-border bg-muted/10" key={target.target}>
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-2 py-2 focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9">
                <span className="min-w-0">
                  <strong className="block text-xs text-foreground">{target.label}</strong>
                  <span className="block text-[0.625rem] text-muted-foreground">{target.availability === 'editor-preview-only' ? 'Vista previa disponible; exportación pendiente' : 'Exportador aún no disponible'}</span>
                </span>
                <StatusBadge status={target.availability === 'editor-preview-only' ? 'contract-ready' : 'exporter-pending'} />
              </summary>
              <div className="grid gap-2 border-t border-border p-2">
                <div className="grid gap-1" aria-label={`Acciones compatibles con ${target.label}`}>
                  {target.actions.map((action) => (
                    <div className="flex min-h-9 items-center justify-between gap-2 rounded-md border border-border/70 bg-surface px-2" key={action.kind}>
                      <span className="min-w-0 truncate text-[0.625rem] font-semibold text-foreground">{action.label}</span>
                      <StatusBadge status={action.status} />
                    </div>
                  ))}
                </div>
                <p className="text-[0.625rem] leading-4 text-muted-foreground">Las protecciones de servidor y el escape de salida se verificarán cuando este destino tenga un exportador ejecutable.</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
