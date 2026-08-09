# Arquitectura

Estado: aceptada en `M00.4` el 2026-08-09.

## Principios

- ElectroCMS se construye desde cero; no hereda arquitectura ni código de otras aplicaciones.
- El modelo canónico versionado es la única fuente de verdad para editor, previews y exportadores.
- El dominio permanece independiente de React, Tailwind, DOM, almacenamiento y destinos de exportación.
- Toda entrada no confiable se valida en el límite antes de alcanzar casos de uso o persistencia.
- Local-first es el modo normal, no una degradación sin conexión.

## Capas y dependencias permitidas

```text
editor-ui ───────┐
renderers ───────┼──> application ──> domain
infrastructure ──┘         │
exporters ─────────────────┘
```

- `domain`: entidades, value objects, invariantes, comandos puros y contratos.
- `application`: casos de uso, transacciones, historial y puertos requeridos.
- `infrastructure`: IndexedDB/OPFS, archivos, workers, PWA y adaptadores.
- `editor-ui`: React, Tailwind, accesibilidad, shell, canvas e inspector.
- `renderers`: preview frontend/backend desde el modelo canónico.
- `exporters`: Local, React, LAMP y WordPress mediante contratos versionados.

`domain` no importa ninguna otra capa. `application` solo importa `domain`. Las capas exteriores pueden importar hacia dentro y comunicarse entre sí únicamente mediante puertos de aplicación.

## ADR iniciales

### ADR-001 — Aplicación web estática local-first

- Decisión: SPA/PWA con Vite; Cloudflare Pages distribuye archivos estáticos.
- Motivo: edición, guardado, preview y exportación deben funcionar sin servidor.
- Consecuencia: servicios externos serán adaptadores opcionales y nunca requisitos de arranque.

### ADR-002 — Routing explícito en Data Mode

- Decisión: React Router en Data Mode cuando `M04` introduzca URLs navegables.
- Motivo: permite rutas, loaders/actions y estados pendientes conservando control sobre Vite y abstracciones de servidor.
- Límite: el estado persistente del proyecto no vive en loaders ni componentes de ruta.

### ADR-003 — Estado mediante comandos y store de aplicación

- Decisión: comandos puros e inmutables en `application`, expuestos a React mediante contexto y `useSyncExternalStore`.
- Motivo: mantener historial, pruebas y dominio reutilizables sin acoplarlos a una librería global.
- Revisión: una librería externa de estado solo se acepta con una necesidad medida que el contrato actual no cubra.

### ADR-004 — Schemas ejecutables y migraciones

- Decisión: Zod 4 para validar límites y derivar tipos cuando el schema sea la fuente de verdad.
- Motivo: validación TypeScript-first, sin dependencias externas y utilizable en navegador.
- Regla: cada schema persistente declara `schemaVersion`; ningún cambio incompatible se guarda sin migración probada.

### ADR-005 — Persistencia IndexedDB y assets OPFS

- Decisión: Dexie sobre IndexedDB para datos estructurados; OPFS detrás de un puerto para blobs grandes cuando esté disponible.
- Motivo: transacciones, índices y evolución versionada sin depender de red.
- Respaldo: exportación portable completa; nunca se asume que datos ligados a un origen sean copia suficiente.

### ADR-006 — Interacciones espaciales accesibles

- Decisión: `@dnd-kit` para sensores de puntero y teclado cuando se implemente drag-and-drop.
- Regla: toda operación también tendrá controles de insertar, mover, reordenar y redimensionar sin arrastre.
- Límite: la lógica de árbol y geometría permanece en dominio/aplicación, no dentro de sensores React.

### ADR-007 — Extensibilidad por registros versionados

- Decisión: widgets, campos, temas, fuentes de datos y exportadores se registran mediante contratos explícitos.
- Cada definición incluye ID estable, versión, schema, renderer/adapter y diagnóstico de compatibilidad.
- Ninguna extensión puede ejecutar código arbitrario importado desde un proyecto de usuario.

### ADR-008 — Shell PWA generado y adaptadores de plataforma

- Decisión: Vite emite un Service Worker propio cuya versión deriva de los nombres del bundle; precachea el shell mínimo y elimina versiones obsoletas al activar.
- Estrategia: navegación network-first con fallback a `index.html`; assets same-origin cache-first. La coincidencia del precache ignora `Vary` porque el mismo asset puede solicitarse desde el worker y como módulo ES con encabezados distintos.
- Registro: solo se ejecuta en producción y deja evidencia DOM cuando el worker activo controla la página actual.
- Contrato: `application` publica un descriptor v1 de familia y capacidades; web, futuras envolturas desktop y futuras envolturas mobile lo implementan desde `infrastructure`.
- Límite: las APIs nativas concretas obtendrán puertos específicos en su microfase; no se inventan operaciones genéricas ni se importan SDK nativos en dominio.

## Dependencias aprobadas y momento de adopción

| Dependencia | Uso autorizado | Microfase de incorporación |
|---|---|---|
| React Router | Rutas internas y estados de navegación | M04.x |
| Zod 4 | Validación y tipos de schemas canónicos | M02.x |
| Dexie | Repositorios IndexedDB y migraciones | M03.x |
| `@dnd-kit` | Sensores accesibles de interacción espacial | M05.x |
| Vitest + Testing Library | Unitarias e integración de componentes | Ya incorporadas |
| Playwright | Flujos E2E y accesibilidad en navegadores | M18.x o antes si una puerta lo exige |

El soporte PWA de M01.4 no añade una dependencia de runtime: manifiesto, registro y generación del Service Worker pertenecen al repositorio.

Las versiones exactas se fijan en `package-lock.json` al incorporarse y se verifican contra documentación oficial en esa microfase.

## Puertas arquitectónicas

- No se permiten ciclos entre capas.
- Preview y todos los exportadores consumen el mismo modelo canónico.
- Una capacidad no representable produce diagnóstico; nunca se omite silenciosamente.
- Persistencia, importación y exportación validan schema, versión, tamaño y errores recuperables.
- Efectos de almacenamiento, red y archivos no se ejecutan durante render.

## Fuentes técnicas consultadas

- https://reactrouter.com/start/modes
- https://zod.dev/
- https://dexie.org/docs
- https://dndkit.com/
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Tutorials/CycleTracker/Service_workers
