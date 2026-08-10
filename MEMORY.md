# MEMORY — contexto corto de ElectroCMS

Actualizado: 2026-08-10.

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
- `M03.2 — Ciclo de proyecto` completada con catálogo local, papelera recuperable e import/export validado.
- `M03.3 — Guardado incremental y recuperación` completada con debounce, snapshots, journal y reapertura recuperable.
- Fase activa: `F03 / M03.4 — Command bus e historial`; todavía no implementada.
- Por prioridad expresa del usuario se rediseñó anticipadamente el editor usando únicamente la imagen adjunta autorizada; no equivale a cerrar F04–F07.
- El shell high-density dispone de ventanas reales para biblioteca e inspector: acoplar a izquierda/derecha/rail, desacoplar, mover, redimensionar, minimizar en pestañas verticales, fijar, restaurar y cerrar, con equivalentes de teclado. Maximizar fue eliminado por decisión expresa del usuario.

## Decisiones vigentes

- Núcleo web local-first/PWA; envolturas desktop y móvil desacopladas.
- Dominio y modelo canónico independientes de React/Tailwind.
- Layout adaptativo: rail redimensionable 44–168 px + biblioteca + canvas + inspector desde 1024 px; biblioteca e inspector son colapsables, redimensionables y acoplables por arrastre; tablet usa overlays y móvil usa sheets.
- Densidad adaptativa: header/toolbar de 40 px, rail de 44 px, controles y filas de 32 px en escritorio; targets táctiles de 44 px en tablet/móvil.
- WCAG 2.2 AA como objetivo verificable.
- Todo drag-and-drop tendrá alternativa por clic y teclado.

## Próximo paso exacto

Implementar `M03.4`: comandos reversibles, transacciones compuestas, límites configurables y persistencia de undo/redo con prueba de ramas nuevas.

## Riesgos abiertos

- La imagen adjunta del editor visual es la única referencia externa autorizada para este rediseño; no se consultaron otras aplicaciones.
- El scaffold pertenece a la implementación objetivo y no se utilizará como referencia circular.
- La densidad y legibilidad del editor completo todavía requieren pruebas con sus flujos funcionales reales; el shell visual ya fue probado en sus breakpoints críticos.
- Las envolturas desktop/móvil permanecen planificadas; solo existe el contrato de capacidades v1 y no se presentan como implementadas.
- Direct Upload de Cloudflare Pages no puede convertirse después a Git Integration; cambiar requeriría otro proyecto Pages.
- El token de CI está restringido a Cloudflare Pages y almacenado solo como secreto cifrado de GitHub; deberá rotarse si cambia el responsable del repositorio.

## Evidencia técnica reciente

- `npm run lint`: correcto.
- `npm run typecheck`: correcto.
- `npm run test`: 78/78 pruebas.
- `npm run build`: correcto; Vite 7.3.6.
- UI high-density: Inter Variable local; fuentes de menú de 9 px y títulos de panel de 10 px; movimiento, resize y dock por puntero/teclado; acentos azul/violeta/cian/verde/ámbar/rojo y movimiento reducido.
- Browser local: composición desktop y navegación móvil revisadas visualmente; bottom sheet y modo oscuro conservan jerarquía, legibilidad y foco accesible.
- Browser aislado: rediseño verificado en 320, 375, 768, 1024, 1440 y 812 × 375; sin overflow horizontal ni errores de consola. Paneles desktop colapsables y redimensionables por puntero/teclado; 36 px solo en desktop y 44 px en superficies touch.
- GitHub público: `https://github.com/janielsg20/ElectroCMSReact1.0` (`main`).
- Publicación UI high-density: commit `4a11d67`, GitHub Actions `31423720024` verde y bundle productivo `index-vIDVryQI.js` verificado por HTTPS 200.
- Publicación UI dockable vigente: commit `d22e67c`, GitHub Actions `31426810726` verde y bundles productivos `index-DcJefDTZ.js`/`index-B6qq0Yp1.css` verificados por HTTPS 200.
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
- Ciclo M03.2: creación, duplicado, renombrado, archivo, papelera, recuperación, exportación e importación migrada con errores tipados.
- Integridad M03.2: IDs repetidos y conflictos de importación no sobrescriben; duplicado explícito obtiene identidad y fechas nuevas.
- Persistencia M03.2: factoría `projects` conectada a IndexedDB y reapertura de `ProjectRecord` verificada.
- Publicación M03.2: commit `8e9b333`, ejecución `31341648227` y producción HTTPS 200.
- Autosave M03.3: debounce con último cambio, snapshots limitados y journal preparar→guardar→confirmar.
- Recuperación M03.3: pendientes reaplicados, commits reconciliados, corrupción restaurada y conflictos sin sobrescritura.
- Persistencia M03.3: namespace `project-recovery` y recuperación real tras cerrar/reabrir IndexedDB.
- Publicación M03.3: commit `f394d63`, ejecución `31404629844` y producción HTTPS 200.
- Publicación M02.2: commit `f987869`; ejecución `31337310722`; producción HTTPS 200.
- UI anticipada: estudio de densidad 10/10 en React/Tailwind con paleta azul/gris, rail de iconos, páginas/capas, canvas punteado, inspector Propiedades/Acción/Backend, dock móvil y sheets.
- Menús del editor: biblioteca 192 px e inspector 224 px por defecto, límites 168–280/216–320 px, colapso independiente y separadores accesibles con puntero, flechas, `Home` y `End`.
- Escala compacta: padding/gap de 4–8 px, radios pequeños y ausencia de márgenes decorativos amplios en el chrome del editor; el espacio del canvas se conserva como área de trabajo.
- Interacciones del prototipo: filtro de widgets, tabs, viewports, tema y sheets con foco inicial, `Escape`, retención y restauración de foco.
- Browser local: 320, 375, 768, 1024, 1440 y 812 × 375 landscape sin overflow horizontal, overlay ni errores de consola.
- Publicación UI vigente: densidad minimalista integral en commit `a6c13c7`, ejecución `31419886499` verde y producción HTTPS 200 con `index-B09363my.js`.

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
