# MEMORY — contexto corto de ElectroCMS

Actualizado: 2026-08-09.

## Objetivo

Construir ElectroCMS como CMS visual local-first en React + TypeScript + Tailwind CSS, con editor no-code, contenido dinámico, backend visual y exportadores Local, React, LAMP y WordPress.

## Estado real

- Existe un scaffold funcional React 19 + TypeScript + Tailwind 4 con pantalla de fundación accesible.
- Prompt Flutter convertido a React sin eliminar ninguna de sus 33 secciones.
- Sistema de diseño base generado con `ui-ux-pro-max`; sus tokens semánticos y primitives ya tienen validación técnica inicial.
- `M01.1 — Scaffold y calidad` completada, incluido CI/CD y despliegue verificable.
- `M00.2 — Inventario de la referencia` completada: el usuario ordenó no usar ninguna aplicación externa y construir desde cero.
- Fase `F00` completada y puerta G0 cerrada.
- `M01.2 — Capas y contratos` completada con pruebas de dirección y ciclos.
- `M01.3 — Tokens y primitives` completada con contraste, foco, movimiento reducido y targets táctiles verificados.
- `M01.4 — PWA y adaptadores de plataforma` completada; puerta G1 y F01 cerradas.
- `M02.1 — Identidad y versionado` completada con envelope v1, Zod y serialización determinista.
- `M02.2 — Documentos, nodos y propiedades responsive` completada con schemas estrictos, diagnósticos e herencia probada.
- `M02.3 — Modelos CMS y backend` completada con schemas estrictos, referencias cruzadas y cardinalidades probadas.
- `M02.4 — Migraciones` completada con registry forward, backup recuperable y fixtures v0/v1.
- Fase F02 completada.
- `M03.1 — Repositorios locales` completada con IndexedDB/Dexie, transacciones, errores tipados e integridad verificada.
- Fase activa: `F03 / M03.2 — Ciclo de proyecto`; todavía no implementada.
- Por prioridad expresa del usuario se implementó anticipadamente un prototipo visual integral del editor; no equivale a cerrar F04–F07.

## Decisiones vigentes

- Núcleo web local-first/PWA; envolturas desktop y móvil desacopladas.
- Dominio y modelo canónico independientes de React/Tailwind.
- Layout adaptativo: shell de tres regiones en desktop; paneles contraíbles en tablet; canvas + sheets en móvil.
- WCAG 2.2 AA como objetivo verificable.
- Todo drag-and-drop tendrá alternativa por clic y teclado.

## Próximo paso exacto

Implementar `M03.2`: crear, duplicar, renombrar, archivar, eliminar, recuperar, importar y exportar proyectos con confirmación o recuperación para cambios destructivos.

## Riesgos abiertos

- El prompt menciona una aplicación React adjunta, pero no se proporcionó un artefacto autorizado; por decisión del usuario, no se sustituirá con otras aplicaciones.
- El scaffold pertenece a la implementación objetivo y no se utilizará como referencia circular.
- La densidad y legibilidad del editor completo todavía requieren pruebas con sus flujos reales; la fundación ya supera contraste automatizado.
- Las envolturas desktop/móvil permanecen planificadas; solo existe el contrato de capacidades v1 y no se presentan como implementadas.
- Direct Upload de Cloudflare Pages no puede convertirse después a Git Integration; cambiar requeriría otro proyecto Pages.
- El token de CI está restringido a Cloudflare Pages y almacenado solo como secreto cifrado de GitHub; deberá rotarse si cambia el responsable del repositorio.

## Evidencia técnica reciente

- `npm run lint`: correcto.
- `npm run typecheck`: correcto.
- `npm run test`: 47/47 pruebas.
- `npm run build`: correcto; Vite 7.3.6.
- Browser aislado: contenido semántico presente en desktop y 375 × 812, tema oscuro del sistema aplicado y sin overflow horizontal.
- GitHub público: `https://github.com/janielsg20/ElectroCMSReact1.0` (`main`).
- GitHub Actions: prototipo UI publicado en `14a00e9`; ejecución `31339361393` completa en verde.
- Cloudflare Pages: `https://electrocms-react.pages.dev/`, HTTPS 200 y PWA de M01.4 publicada con manifest y Service Worker actualizados.
- Arquitectura: seis capas, contrato `Repository`, adaptador en memoria, `Result`, `Renderer` y `Exporter`; 7/7 pruebas.
- UI foundation: tokens light/dark con pares WCAG AA, reset global, movimiento reducido, SVG semánticos, Button y TextField accesibles.
- PWA: manifest con iconos 192/512, `sw.js` versionado desde el bundle y cabeceras no-cache para actualizaciones.
- Offline browser: en origen limpio, React volvió a renderizar después de detener por completo el servidor.
- Plataformas: contrato público v1 documentado en `PLATFORM_ADAPTERS.md`; solo el adaptador web está implementado.
- Modelo M02.1: `electrocms.project`, `schemaVersion: 1`, UUID, revisión, UTC con milisegundos, metadata/payload JSON y objetos estrictos.
- Serialización: claves de objeto ordenadas recursivamente, arrays preservados y errores `invalid-json`/`invalid-value` tipados.
- Dependencia: Zod 4.4.3 exacto; schemas y tipos comparten una única fuente.
- Modelo M02.2: documentos y componentes globales normalizados, nodos widget/instancia, slots, properties, styles, bindings, condiciones y overrides responsive.
- Responsive: seis breakpoints base configurables con herencia acíclica; la resolución acumula overrides desde desktop hasta el breakpoint objetivo.
- Integridad estructural: diagnósticos para claves/IDs, duplicados, referencias rotas, huérfanos, padres múltiples y ciclos de nodos, componentes y breakpoints.
- Modelo M02.3: CPT, taxonomías/términos, 27 campos, registros, relaciones, consultas, formularios, RBAC, usuarios, menús y pantallas backend normalizados.
- Integridad CMS: propietarios y referencias cruzadas coherentes, campos obligatorios, jerarquías, permisos, formularios, consultas y pantallas validados semánticamente.
- Relaciones: fixtures y pruebas para 1:1, 1:N y N:N, pares duplicados y extremos incompatibles.
- Migraciones M02.4: registry inmutable de pasos forward consecutivos, v0→v1, validación antes/después y diagnósticos tipados.
- Recuperación M02.4: backup exacto incluido también en fallos; fixtures v0/v1, restauración byte por byte y reintento probados.
- Publicación M02.4: commit `3fbe4fe`, ejecución `31340253571` y producción HTTPS 200.
- Persistencia M03.1: `LocalRepository` tipado y adaptador Dexie/IndexedDB con namespace, clave compuesta e índices de versión.
- Integridad M03.1: serialización validada, huella por registro y rechazo de JSON/schema/ID/versión incoherentes.
- Resiliencia M03.1: reapertura real, transacción por lote revertida ante cuota y conexión cerrada diferenciada; 5 pruebas de integración.
- Publicación M03.1: commit `a4431fe`, ejecución `31340890680` y producción HTTPS 200.
- Publicación M02.2: commit `f987869`; ejecución `31337310722`; producción HTTPS 200.
- UI anticipada: shell final en React/Tailwind con navegación desktop, canvas, biblioteca, capas, inspector, dock móvil y bottom sheets.
- Interacciones del prototipo: filtro de widgets, tabs, viewports, tema y sheets con foco inicial, `Escape`, retención y restauración de foco.
- Browser local: 320, 375, 768, 1024, 1440 y 812 × 375 landscape sin overflow horizontal, overlay ni errores de consola.
- Publicación UI: commit `14a00e9`, ejecución `31339361393` y producción HTTPS 200.

## Punteros

- Alcance completo: `PROMPT_MAESTRO_ELECTROCMS.md`.
- Reglas: `RULES.md`.
- Fases: `DETAILED_EXECUTION_PHASES.md`.
- Diseño adaptable: `UI_UX_LAYOUT_SYSTEM.md`.
- Estado: `TRACKING.md`.
- CI/CD: `CI_CD.md`.
- Plataformas: `PLATFORM_ADAPTERS.md`.
- Modelo canónico: `DATA_MODELS.md`.
- Persistencia: `PERSISTENCE.md`.
