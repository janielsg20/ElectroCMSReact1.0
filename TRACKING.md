# TRACKING — ElectroCMS

Actualizado: 2026-08-10.

## Estado global

- Fase actual: `F03 — Persistencia local-first, proyectos e historial`.
- Microfase actual: `M03.4 — Command bus e historial`.
- Estado: `EN_CURSO`.
- Entrega anticipada solicitada: sistema de ventanas high-density con paneles acoplables, flotantes, minimizables y accesibles `COMPLETADA`, basado exclusivamente en la imagen adjunta autorizada y los documentos canónicos, sin cerrar las fases funcionales F04–F07.
- Iteración anticipada solicitada: dock por arrastre, pestañas verticales minimizadas, rail redimensionable con etiquetas y compactación tipográfica global `COMPLETADA`; no modifica el estado de `M03.4`.
- Iteración visual solicitada: fidelidad a la referencia adjunta, normalización azul, tipografía de controles a 12 px y sistema de dock sin acción de cerrar `COMPLETADA`; no modifica el estado de `M03.4`.
- Decisión de alcance: la imagen adjunta por el usuario es la única referencia visual externa autorizada para esta entrega; no se consultarán otras aplicaciones.
- Excepción completada: `M01.1 — Scaffold y calidad` se ejecutó anticipadamente por petición del usuario para habilitar GitHub Actions y Cloudflare Pages.
- Última evidencia local: paleta azul normalizada, controles a 12 px y dock sin cerrar/maximizar validados con lint, typecheck, 79/79 pruebas, build y navegador en 375/768/1440 px; publicación pendiente de esta entrega.

## Tablero compacto

| Fase | Estado | Evidencia requerida para cerrar |
|---|---|---|
| F00 | COMPLETADA | G0 cerrada: alcance, trazabilidad, riesgos y arquitectura documentados |
| F01 | COMPLETADA | G1 cerrada: PWA instalable, núcleo offline, contratos v1 y pruebas base verdes |
| F02 | COMPLETADA | M02.1–M02.4: schemas, invariantes, cardinalidades, migraciones y recuperación probadas |
| F03 | EN_CURSO | M03.1–M03.3 completadas; M03.4 en curso |
| F04–F18 | NO_INICIADA | Ver `DETAILED_EXECUTION_PHASES.md` |

## Bloqueos

- Ninguno. La ausencia de una referencia autorizada quedó resuelta mediante decisión explícita del usuario y clasificación `AUSENTE` en `REFERENCE_INVENTORY.md`.

## Verificaciones de esta actualización

- Completada: encabezados numerados 1–33 presentes en el prompt convertido.
- Completada: todos los archivos mínimos de la sección 30 están presentes.
- Completada: no quedan referencias de plataforma Flutter dentro del prompt convertido.
- Completada: 19 fases y 89 microfases detectadas en el plan detallado.
- Pendiente: validación de enlaces cuando exista código y estructura definitiva.
- Completada: `npm run lint` sin warnings.
- Completada: `npm run typecheck`.
- Completada: 2/2 pruebas Vitest.
- Completada: build Vite en `dist/`.
- Completada: verificación visual sin overlay/logs y sin overflow horizontal a 375 px.
- Completada: repositorio público `janielsg20/ElectroCMSReact1.0` con rama `main`.
- Completada: secretos `CLOUDFLARE_ACCOUNT_ID` y `CLOUDFLARE_API_TOKEN` configurados sin persistir sus valores en el repositorio.
- Completada: ejecución GitHub Actions `31332151380` con calidad y despliegue correctos.
- Completada: Cloudflare Pages `electrocms-react` verificado con HTTPS 200.
- Completada: `M00.2`; inventario de referencia cerrado sin sustituir el artefacto ausente por aplicaciones externas.
- Completada: `M00.3`; secciones 1–33 y equivalencias objetivo enlazadas sin requisitos huérfanos.
- Completada: `M00.4`; ADR iniciales aceptados, dependencias justificadas y puerta G0 cerrada.
- Completada: `M01.2`; seis capas creadas, contratos mínimos tipados y pruebas contra inversiones y ciclos.
- Completada: puerta local de M01.2 con lint, typecheck, 7/7 pruebas y build.
- Completada: `M01.3`; tokens semánticos light/dark, reset, tipografía local, iconos SVG y primitives accesibles.
- Completada: puerta local de M01.3 con lint, typecheck, 12/12 pruebas, build y contraste WCAG AA automatizado.
- Completada: validación aislada de la implementación objetivo en escritorio y 375 × 812, con estructura semántica y sin overflow horizontal.
- Completada: ejecución GitHub Actions `31333777914` con lint, typecheck, 12/12 pruebas, build y despliegue correctos.
- Completada: producción sirve el bundle `index-CPN-M36E.js` de M01.3 con HTTPS 200.
- Completada: `M01.4`; manifest instalable con iconos 192/512, Service Worker versionado y registro exclusivo de producción.
- Completada: contratos públicos v1 para capacidades web, desktop y mobile sin dependencias nativas en dominio.
- Completada: 17/17 pruebas, lint, typecheck y build con `sw.js` que precachea los hashes actuales.
- Completada: prueba browser en origen limpio; tras detener totalmente el servidor, React volvió a renderizar desde caché sin overlay ni overflow.
- Completada: puerta G1 y fase F01 cerradas.
- Completada: ejecución GitHub Actions `31334792028` con 17/17 pruebas, build y despliegue correctos para `16d76f3`.
- Completada: producción entrega `manifest.webmanifest` como `application/manifest+json` y `sw.js` con política `no-cache, no-store, must-revalidate`.
- Completada: `M02.1`; UUID de proyecto, timestamps UTC canónicos, revisión, metadatos JSON y envelope v1 tipado.
- Completada: Zod 4.4.3 fijado exactamente y JSON Schema estricto generado desde la misma fuente.
- Completada: validación de versión, propiedades desconocidas y cronología; serialización determinista y deserialización con errores tipados.
- Completada: puerta local de M02.1 con lint, typecheck, 22/22 pruebas y build reproducible.
- Completada: ejecución GitHub Actions `31336177234` con calidad, build y despliegue correctos para `ea034f2`.
- Completada: `M02.2`; documentos y componentes globales normalizados, nodos discriminados, slots, propiedades, estilos, bindings y condiciones con schemas estrictos.
- Completada: seis breakpoints configurables con herencia explícita y resolución acumulativa de overrides responsive.
- Completada: diagnósticos tipados para invariantes de IDs, referencias rotas, huérfanos, padres múltiples y ciclos de nodos, componentes o breakpoints.
- Completada: puerta local de M02.2 con lint, typecheck, 28/28 pruebas y build Vite reproducible.
- Completada: ejecución GitHub Actions `31337310722` con calidad, 28/28 pruebas, build y despliegue correctos para `f987869`.
- Completada: producción verificada tras M02.2 en `https://electrocms-react.pages.dev/` con HTTPS 200.
- Completada: prototipo UI del editor con header, rail, biblioteca, capas, canvas, inspector, status bar, navegación móvil y sheets accesibles.
- Completada: búsqueda de widgets, pestañas, selector de viewport, modo oscuro y apertura/cierre de sheets como interacciones reales del prototipo.
- Completada: validación browser en 320, 375, 768, 1024, 1440 y landscape 812 × 375 sin overflow horizontal ni errores de consola.
- No completada por este prototipo: publicación, historial, mutaciones del documento, rutas y módulos CMS; permanecen deshabilitados o etiquetados como planificados.
- Completada: ejecución GitHub Actions `31339361393` con lint, typecheck, pruebas, build y despliegue correctos para `14a00e9`.
- Completada: producción sirve el prototipo UI desde `https://electrocms-react.pages.dev/` con HTTPS 200.
- Completada: `M02.3`; schemas estrictos y normalizados para CPT, taxonomías, 27 tipos de campo, registros, relaciones, consultas, formularios, roles, usuarios, menús y pantallas backend.
- Completada: validación semántica de propietarios, referencias cruzadas, registros, términos, consultas, formularios, permisos, menús y pantallas.
- Completada: relaciones 1:1, 1:N y N:N verificadas, incluidos extremos incompatibles, pares duplicados y límites por cardinalidad.
- Completada: puerta local de M02.3 con lint, typecheck, 36/36 pruebas y build Vite reproducible.
- Completada: publicación M02.3 en commit `5eec589`, ejecución GitHub Actions `31339942743` verde y producción HTTPS 200.
- Completada: `M02.4`; registry forward v0→v1, validación por versión, backup previo y errores tipados para JSON, envelope, versión futura, cadena incompleta, paso fallido y resultado actual inválido.
- Completada: fixtures reales v0/v1 y restauración byte por byte con reintento de migración probado.
- Completada: puerta local de M02.4 con lint, typecheck, 42/42 pruebas y build Vite reproducible; F02 cerrada.
- Completada: publicación M02.4 en commit `3fbe4fe`, ejecución GitHub Actions `31340253571` verde y producción HTTPS 200.
- Completada: `M03.1`; puerto `LocalRepository` con resultados y errores tipados, sin filtrar excepciones de infraestructura.
- Completada: Dexie 4.4.4 sobre IndexedDB con clave compuesta por namespace/ID e índices de namespace, versión y actualización.
- Completada: escritura `saveMany` atómica, validación canónica previa y verificación de huella/schema/ID/versión al leer.
- Completada: cierre/reapertura, rollback por cuota, corrupción detectable, conexión cerrada y consultas indexadas probadas.
- Completada: puerta local de M03.1 con lint, typecheck, 47/47 pruebas y build Vite reproducible.
- Completada: publicación M03.1 en commit `a4431fe`, ejecución GitHub Actions `31340890680` verde y producción HTTPS 200.
- Completada: `M03.2`; `ProjectRecord` estricto con estados activo, archivado y papelera recuperable.
- Completada: crear, duplicar, renombrar, archivar, eliminar a papelera y recuperar al estado previo con revisión/timestamps coherentes.
- Completada: exportación canónica e importación migrada v0/v1, rechazo de conflictos o duplicado explícito sin sobrescritura silenciosa.
- Completada: factoría del repositorio de proyectos y reapertura sobre IndexedDB real probada.
- Completada: puerta local de M03.2 con lint, typecheck, 60/60 pruebas y build Vite reproducible.
- Completada: publicación M03.2 en commit `8e9b333`, ejecución GitHub Actions `31341648227` verde y producción HTTPS 200.
- Completada: `M03.3`; schemas de snapshots y journal con IDs nominales, revisiones y referencias coherentes.
- Completada: protocolo preparar→guardar→confirmar que conserva el último proyecto válido si falla la escritura.
- Completada: recuperación de journal pendiente, reconciliación de confirmación fallida, restauración por corrupción, superseded y conflictos sin sobrescritura.
- Completada: debounce sustituible con `flush`/`cancel`, poda configurable que conserva pendientes y factoría IndexedDB para recuperación.
- Completada: cierre/reapertura IndexedDB con journal pendiente y aplicación de la revisión objetivo.
- Completada: puerta local de M03.3 con lint, typecheck, 72/72 pruebas y build Vite reproducible.
- Completada: publicación M03.3 en commit `f394d63`, ejecución GitHub Actions `31404629844` verde y producción HTTPS 200.
- En curso: `M03.4`; comandos reversibles, transacciones compuestas, undo/redo, ramas nuevas e historial persistente aún no implementados.
- Completada: evolución high-density del shell con paneles acoplables, flotantes, minimizables, fijables y restaurables, sin acciones de maximizar o cerrar.
- Completada: movimiento y resize por puntero con alternativas de teclado; controles SVG con nombres accesibles, tooltips, foco visible y animaciones de 180–200 ms compatibles con `prefers-reduced-motion`.
- Completada: Inter Variable empaquetada localmente, azul de marca como acento común y colores semánticos reservados para estados; targets adaptativos de 32 px en escritorio y 44 px en superficies touch.
- Completada: puerta local de la entrega UI con lint, typecheck, 76/76 pruebas, build y revisión browser en escritorio y móvil, incluidos modo oscuro y bottom sheet.
- Completada: eliminación total de maximizar y sustitución por dock directo a izquierda, derecha o barra lateral mediante botones, teclado y arrastre con preview visible.
- Completada: minimizados convertidos en pestañas verticales de borde que ocupan la altura disponible y se reparten la barra cuando existen varios.
- Completada: rail de navegación redimensionable 44–168 px, expandible a etiquetas de 12 px y operable por puntero, teclado, `Home` y `End`.
- Completada: navegación, tabs, páginas, widgets, inspector, toolbar y dock móvil normalizados al azul `#2563EB`; rojo, ámbar y verde quedan reservados para error, advertencia y éxito.
- Completada: puerta local de esta iteración con lint, typecheck, 79/79 pruebas, build Vite y navegador sin overflow; fuentes de controles, páginas, árbol e inspector comprobadas a 12 px.
- Completada: entrega anticipada de rediseño UI con shell compacto, panel unificado de páginas/capas, canvas punteado con marcos de dispositivo e inspector Diseño/Acciones/Datos.
- Completada: adaptación con dock y bottom sheets en móvil, paneles contextuales en 768–1279 px y cuatro regiones persistentes desde 1280 px.
- Completada: verificación browser en 320, 375, 768, 1024, 1440 y 812 × 375 sin overflow, errores de consola ni targets activos menores de 44 px; `Escape` y restauración de foco probados.
- No completada por este rediseño: publicación, historial, mutaciones del documento y módulos posteriores; permanecen deshabilitados o claramente presentados como prototipo.
- Publicada: entrega UI en `30d846d`; GitHub Actions `31407539886` completó calidad y despliegue, y producción sirve `index-2JEzV0jm.js` con HTTPS 200.
- Completada: fidelidad visual de alta densidad con azul `#2563EB`, grises fríos, rail de iconos, menús Páginas/Componentes, inspector Propiedades/Acción/Backend y Generador IA planificado.
- Completada: biblioteca e inspector compactos con anchos iniciales 208/248 px, colapso independiente, arrastre por puntero y redimensionado de teclado con límites ARIA.
- Completada: densidad adaptativa de 36 px en escritorio y 44 px en tablet/móvil; 74/74 pruebas y seis viewports sin overflow ni errores de consola.
- Completada: segunda compactación integral con header/canvas toolbar de 40 px, rail de 44 px, controles/filas de 32 px, paneles 192/224 px y espaciado funcional de 4–8 px.
- Completada: targets touch de 44 px preservados fuera de desktop; validación responsive sin overflow ni errores de consola.
- Completada: cuatro regiones simultáneas desde 1024 px; overlays accesibles en 768–1023 px y dock/sheets en móvil.
- Publicada: refinamiento de alta densidad en `7bad321`; GitHub Actions `31412507711` y el despliegue Cloudflare finalizaron correctamente.
- Publicada: compactación y paneles redimensionables en `b57b85a`; GitHub Actions `31417203626` y Cloudflare Pages finalizaron correctamente con `index-CRq1OgZM.js` verificado en producción.
- Publicada: densidad minimalista integral en `a6c13c7`; GitHub Actions `31419886499` y Cloudflare Pages finalizaron correctamente con `index-B09363my.js` verificado en producción.


## Plantilla de relevo

- Cambié:
- Verifiqué:
- No verifiqué:
- Decidí:
- Riesgo nuevo:
- Próxima microfase:
