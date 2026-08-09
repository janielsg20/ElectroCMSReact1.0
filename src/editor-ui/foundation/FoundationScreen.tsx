const foundations = [
  {
    title: 'React + TypeScript',
    description: 'Base estricta, modular y preparada para crecer por dominios.',
  },
  {
    title: 'Tailwind CSS',
    description: 'Tokens semánticos, responsive mobile-first y foco visible.',
  },
  {
    title: 'Calidad automatizada',
    description: 'Lint, typecheck, pruebas y build ejecutados en cada cambio.',
  },
  {
    title: 'Cloudflare Pages',
    description: 'Despliegue de producción reproducible desde GitHub Actions.',
  },
] as const

export function FoundationScreen() {
  return (
    <div className="min-h-dvh bg-canvas text-foreground">
      <header className="border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <a
            className="rounded-lg font-heading text-lg font-semibold tracking-tight outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
            href="#main-content"
          >
            ElectroCMS
          </a>
          <span className="rounded-full border border-border bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
            Fundación técnica
          </span>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <section aria-labelledby="foundation-title" className="max-w-3xl">
          <p className="mb-3 font-heading text-sm font-semibold uppercase tracking-[0.14em] text-primary">
            Local-first · Responsive · Accesible
          </p>
          <h1 id="foundation-title" className="text-balance font-heading text-4xl font-bold tracking-tight sm:text-5xl">
            La base verificable de ElectroCMS ya está preparada.
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground">
            Esta pantalla confirma el scaffold técnico. El editor visual y sus módulos continúan planificados; no se presentan aquí como funciones terminadas.
          </p>
        </section>

        <section aria-labelledby="capabilities-title" className="mt-12">
          <h2 id="capabilities-title" className="font-heading text-2xl font-semibold">
            Capacidades de la fundación
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {foundations.map((foundation) => (
              <li key={foundation.title} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                <h3 className="font-heading text-base font-semibold">{foundation.title}</h3>
                <p className="mt-2 leading-6 text-muted-foreground">{foundation.description}</p>
              </li>
            ))}
          </ul>
        </section>

        <aside className="mt-10 rounded-2xl border border-primary/25 bg-primary-soft p-5" aria-labelledby="next-step-title">
          <h2 id="next-step-title" className="font-heading text-lg font-semibold text-primary-strong">
            Desarrollo desde cero
          </h2>
          <p className="mt-2 max-w-3xl leading-7 text-primary-strong">
            ElectroCMS se construye exclusivamente desde sus contratos y requisitos canónicos. El editor visual se habilitará por microfases verificadas, sin simular módulos terminados.
          </p>
        </aside>
      </main>
    </div>
  )
}
