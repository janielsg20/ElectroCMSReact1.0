# TRACKING — ElectroCMS

Actualizado: 2026-08-11.

- Auditoría actual M04.1: corregida la colisión de las cuatro pestañas de Biblioteca en el panel estrecho. El componente responde a su propio ancho, mantiene etiquetas accesibles completas y presenta `Docs` en vez de recortar o juntar `Documentos`. Verificado visualmente a 1440, 768 y 375 px; typecheck y 17 pruebas focalizadas verdes.

## Estado global

- Fase actual: `F04 — Application shell, navegación y workspaces responsive`.
- Microfase actual: `M04.1 — Shell desktop`.
- Estado: `EN_CURSO — auditoría solicitada`.
- Auditoría actual M04.1: en curso la reorganización del chrome del canvas y de la información global/proyecto; se elimina información redundante del lienzo y se separan apariencia local, documentos y temas exportables.
- Auditoría actual M04.1: completada la pasada de canvas y navegación local. La barra se distribuye en tres regiones sin solapamiento y adapta sus controles por contenedor; se retiró el estado inferior duplicado. Apariencia queda local en TopBar; temas Frontend/Backend se movieron a Diseño, y Plantillas se renombró Documentos. Verificación visual en 1440, 1024, 768 y 375 px.
- `F04` se reabre exclusivamente para auditoría y corrección; su evidencia de cierre histórica se conserva. `M08.4` queda en pausa.
- Auditoría M04.1: corregida cancelación reversible de interacciones de ventana y normalización de coordenadas de puntero; prueba de persistencia desktop 3/3 y typecheck verdes.
- Auditoría visual M04.1: el popover de Apariencia ya no hereda controles compactos de la barra superior, conserva tarjetas legibles en móvil y se limita por encima del dock; en tableta el disparador se reduce a icono con nombre accesible para no quedar recortado. Verificación manual en 1440, 1024, 768, 375 y 812 px sin overflow horizontal; pruebas de apariencia, tema y workspace 13/13 verdes.
- Auditoría F08 en curso: dependencias restauradas desde el lockfile y primer hallazgo UI corregido (target táctil del nombre de tema); falta completar la revisión y la puerta global.
- F00–F04: `COMPLETADA`.
- `M05.1 — Operaciones del árbol`: `COMPLETADA`.
- `M05.2 — Canvas y renderer`: `COMPLETADA`.
- `M05.3 — Drag/drop y alternativas accesibles`: `COMPLETADA`.
- `M05.4 — Direct manipulation`: `COMPLETADA`.
- `M05.5 — Selección, zoom y viewport`: `COMPLETADA`.
- F05: `COMPLETADA`.
- `M06.1 — Contrato de widget`: `COMPLETADA`.
- `M06.2 — Estructurales y básicos`: `COMPLETADA`.
- `M06.3 — Contenido y dinámicos`: `COMPLETADA`.
- `M06.4 — Comercio, formularios y filtros`: `COMPLETADA`.
- `M06.5 — UX de biblioteca`: `COMPLETADA`.
- F06: `COMPLETADA`.
- `M07.1 — Inspector generado por schema`: `COMPLETADA`.
- `M07.2 — Controles y validación`: `COMPLETADA`.
- `M07.3 — Motor de estilos`: `COMPLETADA`.
- `M07.4 — Motor de breakpoints`: `COMPLETADA`.
- `M07.5 — Datos, condiciones y accesibilidad`: `COMPLETADA`.
- F07: `COMPLETADA`.
- `M08.1 — Tres ámbitos de tema`: `COMPLETADA`.
- `M08.2 — Presets visuales`: `COMPLETADA`.
- `M08.3 — Motor de plantillas`: `COMPLETADA`.
- F08: `EN_CURSO` en M08.4.
- F09–F18: `NO_INICIADA` salvo entregas UI anticipadas que no cierran sus fases funcionales.
- F19–F31: `NO_INICIADA`; añadidas como ampliación documental de paridad funcional tipo FlutterFlow.

## Roadmap ampliado

| Fase | Estado | Alcance |
|---|---|---|
| F00 | COMPLETADA | Descubrimiento y contratos |
| F01 | COMPLETADA | Plataforma React/Tailwind/PWA |
| F02 | COMPLETADA | Modelo canónico y migraciones |
| F03 | COMPLETADA | Persistencia local-first, proyectos, autosave, recuperación y Command Bus/History |
| F04 | COMPLETADA | Shell desktop/tablet/móvil, workspace persistente y temas del editor |
| F05 | COMPLETADA | Árbol, renderer, DnD, manipulación directa, selección simple y viewport |
| F06 | COMPLETADA | Registro versionado, 115 widgets, adapters y biblioteca funcional |
| F07 | COMPLETADA | Inspector, controles, estilos, responsive, bindings, condiciones y ARIA |
| F08 | EN_CURSO | M08.1–M08.3 completadas; M08.4 paquetes theme activa |
| F09–F18 | NO_INICIADA | Roadmap base restante |
| F19 | NO_INICIADA | Visual Builder avanzado y workspace |
| F20 | NO_INICIADA | Component/Design System |
| F21 | NO_INICIADA | Data Types, State, Variables y condiciones |
| F22 | NO_INICIADA | Action Flow/Graph y App Events |
| F23 | NO_INICIADA | Database Builder y Backend Queries |
| F24 | NO_INICIADA | API Manager/Tester/Mapping |
| F25 | NO_INICIADA | Authentication/RBAC/Security |
| F26 | NO_INICIADA | Media/Routing/Storyboard/Responsive/Localization/SEO |
| F27 | NO_INICIADA | Custom Code/Dependencies/Environments/Integrations |
| F28 | NO_INICIADA | Test Mode/Debug/Automated Tests |
| F29 | NO_INICIADA | Versioning/Branching/Collaboration |
| F30 | NO_INICIADA | AI Builder/Agents/Command Palette |
| F31 | NO_INICIADA | Export ampliado/Deployment/Production validation |

## Cierres relevantes previos

- F03 cerró persistencia local-first, ProjectCommandBus e historial reversible persistente.
- F04 cerró shell responsive, workspace persistente y `appearance.v1`; la navegación aspiracional y su command palette se retiraron después para que la UI muestre solo áreas construidas.
- M04.5 / PR #11 / run `31455514122`: 32 archivos / 132 pruebas y build Vite 7.3.6 verdes.

## Cierre M05.1 — Operaciones del árbol

- Añadido `hidden` como propiedad base canónica de nodo con default retrocompatible `false`; los overrides responsive continúan pudiendo sobrescribirla por breakpoint.
- `resolveNodeResponsiveState` parte de `node.hidden` y después aplica la cadena de overrides responsive.
- Nuevo `src/domain/project/tree-operations.ts` opera directamente sobre `ProjectStructure`; no existe un árbol UI paralelo.
- Implementadas operaciones: insertar, mover, anidar, agrupar, copiar, pegar, duplicar, bloquear, ocultar y renombrar.
- Las operaciones multi-nodo normalizan la selección: si un ancestro y su descendiente están seleccionados, el subárbol se procesa una sola vez.
- Move/nest rechazan nodos bloqueados, padres bloqueados, padres inexistentes y destinos dentro del propio subárbol.
- Group exige nodos hermanos del mismo contenedor, conserva el orden original e inserta el grupo en la posición del primero.
- Copy/paste y duplicate copian subárboles completos, generan IDs nuevos y remapean slots y bindings internos `node-property`.
- Cada mutación termina pasando `validateProjectStructure`; ciclos, padres múltiples, huérfanos y referencias rotas no pueden persistirse silenciosamente.
- Nuevo `ProjectStructureCommand` adapta una mutación de árbol al `ProjectCommandBus<ProjectStructure>` existente, sin crear otra capa de history.
- Pruebas de integración verifican execute/undo/redo, revisiones monotónicas, movimiento multi-nodo como una sola entrada y rechazo de comandos inválidos sin revisión/historial.
- El primer CI detectó que el fixture tipado histórico de `structure.test.ts` debía declarar `hidden`; el schema de entrada ya era retrocompatible mediante default y solo se ajustó el fixture explícito.
- Puerta técnica PR #12 / run `31456269215`: lint, typecheck, **34 archivos de test / 150 pruebas verdes** y build Vite 7.3.6 correcto.

## Entregas UI anticipadas que continúan pendientes de su fase propietaria

- El árbol visual, canvas e inspector existen con UI anticipada, pero F05 es quien formaliza ahora su motor funcional.
- `src/ui-integrity-v11.css` sigue como guardrail cross-theme para tamaño, selección, foco y overflow.
- M05.1 formaliza operaciones de dominio; no cierra renderer, drag/drop, direct manipulation ni Selection Manager futuro de F19.

## Cierre M05.2 — Canvas y renderer

- `CanvasPreview` dejó de renderizar un documento HTML duplicado y consume `ProjectStructure` mediante `CanonicalProjectRenderer`.
- `ProjectStructureRenderStore` valida cada reemplazo, conserva el modelo normalizado como única fuente y publica snapshots estables por `NodeId` con `useSyncExternalStore`.
- La resolución responsive de estructuras ya validadas evita revalidar el árbol completo por cada nodo.
- El renderer conserva orden de raíces y slots, expande componentes globales y representa `hidden` y `locked` por breakpoint.
- Cada nodo dispone de error boundary local; un adapter defectuoso no derriba ramas hermanas ni el documento completo.
- Una prueba de conteo de renders demuestra que actualizar un nodo no repinta su ancestro ni sus hermanos.
- Pruebas adicionales cubren orden, responsive, locked, componentes globales, rechazo atómico de estructuras inválidas y recuperación local de errores.
- Puerta local: lint, typecheck, **35 archivos / 156 pruebas** y build Vite 7.3.6 verdes.
- La verificación con navegador se intentó tras iniciar Vite; el CLI temporal no pudo iniciar su daemon por restricciones del runtime. Tests DOM y build sí completaron correctamente.

## Cierre M05.3 — Drag/drop y alternativas accesibles

- El panel dejó de consumir `layerItems`: deriva raíces, slots, profundidad y orden directamente del documento canónico.
- `@dnd-kit` aporta sensores independientes para pointer (umbral 4 px), touch (delay 180 ms/tolerancia 6 px) y teclado sortable, además de autoscroll.
- Cada capa muestra handle accesible, estado locked, anuncios de screen reader e indicador de inserción antes/después.
- El menú alternativo permite elegir destino y mover antes, después o dentro sin arrastrar.
- `BrowserEditorProjectSession` compone IndexedDB, `ProjectCommandBus`, `ProjectStructureCommand` y el render store; la UI nunca escribe el árbol ni crea history paralelo.
- Corregido el cálculo de índice al mover hacia delante dentro del mismo contenedor.
- Los chunks de DnD y persistencia local se separaron del entry principal para mantener el bundle principal bajo 500 kB.
- Puerta local: lint, typecheck, **36 archivos / 162 pruebas** y build Vite 7.3.6 verdes; entry principal 435.61 kB, DnD 56.94 kB y persistencia 96.43 kB.

## Cierre M05.4 — Direct manipulation

- Nuevo contrato puro de dominio para tamaño y box spacing canónicos, límites, locked state y snapping a retícula/guías.
- Los cambios se escriben en el override del breakpoint activo mediante `ProjectStructureCommand` y el `ProjectCommandBus` persistente.
- Cuatro handles accesibles admiten pointer/touch y flechas; el menú contextual permite editar ancho, alto, padding y margen sin arrastrar.
- Reglas horizontal/vertical y guías de snapping quedan superpuestas dentro de la región bidimensional del canvas.
- Breadcrumbs y árbol consumen la misma selección simple; el store de selección usa snapshots booleanos por nodo para evitar rerenders globales.
- Undo/redo del header ya ejecuta el history real y republica el estado aceptado por persistencia.
- Puerta local: lint, typecheck, **38 archivos / 169 pruebas**, build Vite 7.3.6 y `git diff --check` verdes; entry principal 451.84 kB.

## Cierre M05.5 — Selección, zoom y viewport

- Zoom, pan, fit, herramienta activa, orientación y viewport se integran de forma retrocompatible en `workspace.v1`.
- El pan está acotado, la región bidimensional mantiene overflow interno y zoom/pan nunca modifican `ProjectStructure`.
- Device frames móvil/tablet alternan orientación; toolbar y teclado controlan zoom/pan/fit.
- Foco explícito entre Capas/Canvas/Inspector mediante botones y `Alt+1/2/3`, con anillo visible en el viewport.
- Puerta local: lint, typecheck, **40 archivos / 175 pruebas**, build Vite 7.3.6 y `git diff --check` verdes; entry principal 457.58 kB.
- F05 queda completada y F06 comienza en M06.1.

## Cierre M06.1 — Contrato de widget

- Definido `WidgetDefinition` versionado con schema/defaults, rendererId, inspector declarativo, icono SVG, accesibilidad, migraciones y soporte por exportador.
- `WidgetRegistry` valida contratos completos, evita duplicados y mantiene el dominio libre de React/DOM/exportadores concretos.
- Diagnósticos tipados distinguen errores y warnings de compatibilidad Local/React/LAMP/WordPress.
- Puerta local: lint, typecheck, **41 archivos / 179 pruebas**, build Vite 7.3.6 y `git diff --check` verdes; entry principal 457.59 kB.

## Cierre M06.2 — Estructurales y básicos

- Registradas las 15 definiciones estructurales y 20 básicas exigidas por la sección 9 con schema/defaults, inspector, icono, accesibilidad y matriz completa de exportadores.
- `ReactWidgetAdapterRegistry` resuelve `rendererId` fuera del dominio y verifica correspondencia 1:1 para las 35 definiciones.
- `renderCanonicalWidget` valida defaults + overrides y usa el registro antes del fallback; los casos equivalentes fueron retirados del switch provisional.
- HTML nunca se interpreta en el preview y los iframes inválidos se aíslan en `about:blank` con sandbox.
- La revisión React mantuvo adapters a nivel de módulo, sin hooks/estado duplicado ni componentes inline, y evitó imports barrel en la nueva capa.
- Puerta local: lint, typecheck, **43 archivos / 188 pruebas**, build Vite 7.3.6 y `git diff --check` verdes; entry principal 483.30 kB.

## Cierre M06.3 — Contenido y dinámicos

- Registradas 20 definiciones de contenido y 14 dinámicas; el catálogo acumulado alcanza 69 widgets sin un segundo registro.
- Cada definición valida defaults, expone todas sus propiedades en inspector y declara soporte Local/React/LAMP/WordPress.
- Los adapters React representan fallbacks, bindings y estados vacíos sin ejecutar queries, relaciones, expresiones ni condiciones externas.
- Retirados del switch provisional los casos `content.card` y `content.metric` ya cubiertos por el registro.
- El chunk `widget-catalog` de 130.36 kB mantiene el entry principal en 379.66 kB y elimina el warning de 500 kB.
- Puerta local: lint, typecheck, **45 archivos / 197 pruebas**, build Vite 7.3.6 y `git diff --check` verdes.

## Cierre M06.4 — Comercio, formularios y filtros

- Registradas 15 definiciones de comercio, 20 de formularios y 11 filtros; el catálogo acumulado alcanza 115 widgets.
- Checkout, carrito, wishlist, CAPTCHA, submit, queries, filtros y carga progresiva se representan como contratos/estados declarativos sin backend simulado.
- Campos y filtros usan controles HTML nativos; destinos inseguros o ausentes se bloquean y el preview impide submit remoto.
- El chunk `widget-catalog` crece a 153.39 kB mientras el entry principal permanece en 379.66 kB.
- Puerta local: lint, typecheck, **47 archivos / 206 pruebas**, build Vite 7.3.6 y `git diff --check` verdes.

## Ajuste de integridad de alcance durante M06.5

- Retirada por decisión de producto la “demo final” y sus datos: dashboard, módulos futuros, métricas, rutas profundas, command palette y navegación a páginas no implementadas.
- Eliminados controles inertes que aparentaban funciones futuras: Run, preview, IA, bindings, acciones, backend, páginas y creación/inserción aún inexistentes.
- El runtime arranca con `Proyecto local / Página inicial`, una estructura canónica mínima de cuatro nodos y una base IndexedDB v2 separada de la antigua demo.
- La biblioteca consume directamente las 115 definiciones del `WidgetRegistry`; este corte de limpieza fue la base previa a la inserción formal de M06.5.
- El inspector dejó de mantener inputs decorativos: muestra selección, estado, propiedades, estilos y overrides tomados del nodo canónico.
- Desktop conserva rail, canvas, paneles acoplables/flotantes, capas, direct manipulation, historial, responsive, zoom/pan y apariencia; móvil queda reducido a Widgets, Capas, Canvas e Inspector.
- En este corte aún no existían favoritos, recientes, filtros por categoría ni inserción; esas capacidades quedaron completadas después en el cierre formal de M06.5.
- Puerta local posterior a la limpieza: lint, typecheck, **46 archivos / 200 pruebas**, build Vite 7.3.6 y `git diff --check` verdes; entry 316.13 kB y catálogo 153.39 kB.

## Cierre M06.5 — UX de biblioteca

- La biblioteca ofrece búsqueda diferida, categorías y vistas Todos/Favoritos/Recientes/Guardados sobre las 115 definiciones canónicas.
- Cada tarjeta usa la miniatura SVG declarada por su `WidgetDefinition`, conserva descripción y expone inserción por clic y handle DnD.
- DnD usa sensores pointer, touch y teclado; el canvas muestra un destino explícito y el botón Insertar mantiene la alternativa completa sin arrastre.
- `library.v1` persiste favoritos, recientes y hasta 50 presets locales fuera de `ProjectStructure`, con schema estricto y recuperación segura ante datos corruptos.
- Guardar selección conserva propiedades, estilos y overrides responsive, pero elimina hijos, bindings y condiciones para no crear referencias rotas.
- La inserción genera un nodo válido desde el registro, lo coloca dentro del contenedor estructural seleccionado o después de la selección y ejecuta `ProjectStructureCommand` mediante el `ProjectCommandBus` persistente.
- El nodo insertado se selecciona y una prueba IndexedDB verifica inserción y undo real.
- Puerta local: lint, typecheck, **49 archivos / 209 pruebas**, build Vite 7.3.6 y `git diff --check` verdes; entry 329.71 kB, DnD 53.27 kB, persistencia 96.44 kB y catálogo 153.39 kB.
- F06 queda completada y `M07.1 — Inspector generado por schema` pasa a `EN_CURSO`.

## Cierre M07.1 — Inspector generado por schema

- `generateInspectorSections` usa exclusivamente `WidgetDefinition.inspector` y produce las nueve secciones normativas en orden estable.
- Cada campo expone descriptor, tipo de control previsto, opciones, obligatoriedad, valor efectivo y origen Nodo/Predeterminado.
- Las secciones usan `details/summary`, targets touch y estados vacíos; un widget sin definición no genera datos ni controles ficticios.
- El inspector conserva estado canónico visible y no adelanta edición, validación, reset, bindings, condiciones ni animaciones.
- Pruebas cubren agrupación, orden, fallback a defaults, origen de valores, semántica y ausencia de inputs inertes.
- Puerta local: lint, typecheck, **51 archivos / 213 pruebas**, build Vite 7.3.6 y `git diff --check` verdes; entry 332.28 kB y catálogo 153.39 kB.
- `M07.2 — Controles y validación` pasa a `EN_CURSO`.

## Cierre M07.2 — Controles y validación

- `InspectorFieldControl` genera controles nativos para texto, JSON complejo, número, booleano, select, color, asset y binding desde el descriptor de M07.1.
- Cada campo mantiene un draft local y crea una única mutación al aplicar; no se añade historial por cada pulsación.
- `updateWidgetProperty` valida defaults + propiedades explícitas con `WidgetDefinition.propertySchema` antes de ejecutar el comando.
- Parseo y schema producen error inline anunciado; campos locked o no declarados se rechazan.
- Reset elimina el override explícito y vuelve al default mediante otra operación reversible.
- `setNodeProperties` valida la estructura final; update/reset pasan por `ProjectStructureCommand`, `ProjectCommandBus`, IndexedDB y render store.
- Pruebas de integración cubren rechazo inválido, update, reset y undo; pruebas UI cubren control tipado, envío y error accesible.
- Puerta local: lint, typecheck, **51 archivos / 215 pruebas**, build Vite 7.3.6 y `git diff --check` verdes; entry 337.13 kB y catálogo 153.39 kB.
- `M07.3 — Motor de estilos` pasa a `EN_CURSO`.

## Cierre M07.4 — Motor de breakpoints

- `breakpoint-engine.ts` crea, edita, reordena y restablece overrides sobre `ProjectStructure.breakpoints`, siempre con validación integral e inmutabilidad.
- IDs, anchos, orientación y herencia son canónicos; padres inexistentes, autoreferencia y ciclos se rechazan antes del historial.
- `BreakpointManager` ofrece selección completa, alta/edición, padre, orden por botones y reset del override activo con diálogo accesible.
- El canvas usa el ancho real del breakpoint activo y conserva ID/orientación de preview en `workspace.v1`, fuera del proyecto.
- Cada mutación pasa por `ProjectStructureCommand`, `ProjectCommandBus`, IndexedDB y renderer; pruebas cubren undo del reset.
- Puerta local: lint, typecheck, **54 archivos / 229 pruebas**, build Vite 7.3.6 y `git diff --check` verdes; entry 360.86 kB y catálogo 153.39 kB.
- `M07.5 — Datos, condiciones y accesibilidad` pasa a `EN_CURSO`.

## Cierre M07.5 — Datos, condiciones y accesibilidad

- `data-condition-engine.ts` resuelve bindings literales, rutas de proyecto y propiedades de otros nodos sobre propiedades responsive ya heredadas.
- Condiciones `all/any/negate` controlan visibilidad; rutas ausentes producen diagnóstico fail-visible y `exists` conserva semántica predecible.
- Segmentos peligrosos, valores no JSON, comparaciones incompatibles, roles no permitidos y bindings a campos no declarados se rechazan.
- `node.accessibility` opcional conserva label, description, role y tabIndex; el frame canónico los aplica sin romper el frame interactivo del editor.
- El inspector ofrece edición JSON estructurada, errores inline, diagnósticos y reset; cada submit genera una sola operación reversible.
- Store y renderer invalidan snapshots dinámicos cuando cambia un nodo fuente, sin repintar nodos estáticos no relacionados.
- Update/reset pasan por Command Bus e IndexedDB; pruebas cubren persistencia, renderer reactivo y undo.
- Puerta local: lint, typecheck, **55 archivos / 236 pruebas**, build Vite 7.3.6 y `git diff --check` verdes; entry 370.25 kB y catálogo 153.40 kB.
- F07 queda completada y `M08.1 — Tres ámbitos de tema` pasa a `EN_CURSO`.

## Cierre M08.1 — Tres ámbitos de tema

- `ThemeScopeSchema` declara editor/frontend/backend; el contrato de persistencia fija editor en `appearance.v1` y frontend/backend dentro de `ProjectStructure.themes`.
- Las estructuras anteriores reciben defaults independientes mediante el schema, sin copiar el preset visual del editor al proyecto.
- Cada tema de proyecto usa schema v1 y tokens semánticos estrictos para color, tipografía, espaciado, radios, sombras, movimiento y densidad.
- `setProjectTheme` y `resetProjectTheme` validan entradas completas y las sesiones persisten cada cambio por `ProjectStructureCommand`, `ProjectCommandBus` e IndexedDB con undo/redo.
- `compileThemeStyleTokens` alimenta el motor de estilos; `CanonicalProjectRenderer` usa frontend por defecto y admite backend explícito sin compartir tokens.
- El store conserva snapshots granulares y emite cambios por ámbito, evitando invalidar nodos cuando el tema no cambia.
- Ajustes de apariencia incorpora selector Editor/Frontend/Backend; editor conserva sus controles y los temas de salida ofrecen paleta, edición validada, aplicar y restablecer sin controles ficticios.
- Puerta local: lint, typecheck, **57 archivos / 246 pruebas**, build Vite 7.3.6 y `git diff --check` verdes; entry 380.58 kB y catálogo 153.40 kB.

## Cierre M08.2 — Presets visuales

- `EDITOR_THEME_PRESETS` implementa High Density, Google Bento Grid, Minimal Clean, Elegant Editorial, Sophisticated Dark, SaaS Glassmorphism, Material Neutral, Neobrutalist Modern y Corporate Pro.
- Cada preset del editor define claro/oscuro, tipografía, sombras, radios, densidad y gramática estructural mediante tokens; `appearance.v1` migra Studio/Bento/Flow a IDs canónicos.
- `PROJECT_THEME_PRESETS` implementa Bento Grid, Minimal Clean, Elegant, Sophisticated Dark, High Density, Material, Glassmorphism, Neobrutalism, Corporate, Editorial y Dashboard técnico.
- Cada preset de proyecto declara layout, componentes, bordes, elevación, perfil responsive y WCAG 2.2 AA; aplicar copia el tema al ámbito elegido sin tocar documentos ni breakpoints.
- Frontend/backend permanecen independientes y editables después de aplicar; cada cambio usa el Command Bus e IndexedDB con undo/redo.
- Los dos catálogos usan radiogroups con flechas, Home/End, foco roving y paletas visibles; no hay botones inertes ni valores visuales dispersos en JSX.
- Pruebas automáticas validan contraste AA en 20 variantes de editor y 11 temas de proyecto, catálogo completo, migración, aplicación, persistencia y undo.
- Puerta local: lint, typecheck, **59 archivos / 271 pruebas**, build Vite 7.3.6 y `git diff --check` verdes; entry 396.37 kB y catálogo 153.40 kB.

## Cierre M08.3 — Motor de plantillas

- `Document` formaliza página, template, header, footer, single, archive y 404 dentro de `ProjectStructure`; las páginas admiten ruta directa y las rutas duplicadas se rechazan.
- Condiciones tipadas resuelven target, prefijo de ruta, tipo de contenido y prioridad. La composición selecciona main/header/footer por prioridad, especificidad e ID estable.
- Crear documento y actualizar condiciones pasan por `ProjectStructureCommand`, Command Bus, IndexedDB y undo/redo; no se crea un árbol paralelo.
- La pestaña Plantillas permite crear los siete tipos y editar condiciones con JSON validado y mensajes de estado honestos.
- `TEMPLATE_SYSTEM.md` documenta contrato, límites y compatibilidad con proyectos existentes.
- Puerta local: lint, typecheck, **60 archivos / 276 pruebas**, build Vite 7.3.6 y `git diff --check` verdes; entry 404.80 kB y catálogo 153.40 kB.
- `M08.4 — Paquetes theme` pasa a `EN_CURSO`.

## Próximo paso exacto

`M08.4 — Paquetes theme`: empaquetado, importación/exportación, versiones y conflictos sin alterar datos no compatibles.

## Bloqueos

- Ninguno para M08.4.
- F19–F31 siguen deliberadamente pendientes de sus dependencias.

## Criterio para cambiar de microfase

No avanzar hasta cerrar la microfase activa con evidencia reproducible. La documentación o prototipos anticipados no cuentan como implementación formal.

## Evidencia técnica histórica resumida

- M04.1: run `31451142252`, 102/102 pruebas.
- M04.2: run `31453249710`, 107/107 pruebas.
- M04.3: run `31454024650`, 112/112 pruebas.
- M04.4: run `31454811218`, 120/120 pruebas.
- M04.5: run `31455514122`, 132/132 pruebas.
- M05.1: run `31456269215`, 150/150 pruebas, lint/typecheck/build verdes.
- M05.2: puerta local, 156/156 pruebas, lint/typecheck/build verdes; publicación/CI aún no ejecutados.
- M05.3: puerta local, 162/162 pruebas, lint/typecheck/build verdes; publicación/CI aún no ejecutados.
- M05.4: puerta local, 169/169 pruebas, lint/typecheck/build y `git diff --check` verdes; publicación/CI aún no ejecutados.
- M05.5: puerta local, 175/175 pruebas, lint/typecheck/build y `git diff --check` verdes; publicación/CI aún no ejecutados.
- M06.1: puerta local, 179/179 pruebas, lint/typecheck/build y `git diff --check` verdes; publicación/CI aún no ejecutados.
- M06.2: puerta local, 188/188 pruebas, lint/typecheck/build y `git diff --check` verdes; publicación/CI aún no ejecutados.
- M06.3: puerta local, 197/197 pruebas, lint/typecheck/build y `git diff --check` verdes; publicación/CI aún no ejecutados.
- M06.4: puerta local, 206/206 pruebas, lint/typecheck/build y `git diff --check` verdes; publicación/CI aún no ejecutados.
- Ajuste de alcance en M06.5: puerta local, 200/200 pruebas, lint/typecheck/build y `git diff --check` verdes; publicación/CI aún no ejecutados.
- M06.5: puerta local, 209/209 pruebas, lint/typecheck/build y `git diff --check` verdes; publicación/CI aún no ejecutados.
- M07.1: puerta local, 213/213 pruebas, lint/typecheck/build y `git diff --check` verdes; publicación/CI aún no ejecutados.
- M07.2: puerta local, 215/215 pruebas, lint/typecheck/build y `git diff --check` verdes; publicación/CI aún no ejecutados.
- M07.3: puerta local, 223/223 pruebas, lint/typecheck/build y `git diff --check` verdes; publicación/CI aún no ejecutados.
- M07.4: puerta local, 229/229 pruebas, lint/typecheck/build y `git diff --check` verdes; publicación/CI aún no ejecutados.
- M07.5: puerta local, 236/236 pruebas, lint/typecheck/build y `git diff --check` verdes; publicación/CI aún no ejecutados.
- M08.1: puerta local, 246/246 pruebas, lint/typecheck/build y `git diff --check` verdes; publicación/CI aún no ejecutados.
- M08.2: puerta local, 271/271 pruebas, lint/typecheck/build y `git diff --check` verdes; publicación/CI aún no ejecutados.
- Historial detallado de commits, runs, bundles y resultados anteriores: `CHANGELOG.md`.

## Documentos de control

- Alcance base: `PROMPT_MAESTRO_ELECTROCMS.md`.
- Alcance ampliado: `FLUTTERFLOW_PARITY_ADDENDUM.md`.
- Trazabilidad: `REQUIREMENTS.md`.
- Reglas: `RULES.md`.
- Plan: `PHASES.md`.
- Microfases: `DETAILED_EXECUTION_PHASES.md`.
- Memoria: `MEMORY.md`.
