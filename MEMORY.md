# MEMORY — contexto corto de ElectroCMS

Actualizado: 2026-08-12.

## Objetivo

Construir ElectroCMS como CMS/visual app builder local-first en React + TypeScript + Tailwind CSS, con editor no-code, contenido dinámico, backend visual y exportadores Local, React, LAMP y WordPress. La experiencia final debe resultar familiar y sencilla para usuarios de WordPress, Elementor, ACF y la suite JetEngine, aunque la arquitectura interna sea avanzada.

## Fuentes de verdad

- Alcance: `PROMPT_MAESTRO_ELECTROCMS.md` y `FLUTTERFLOW_PARITY_ADDENDUM.md`.
- Estado: `TRACKING.md`; plan: `PHASES.md` y `DETAILED_EXECUTION_PHASES.md`.
- Reglas: `RULES.md`; arquitectura: `ARCHITECTURE.md`.
- UX: `UX_SIMPLICITY_SYSTEM.md`, `UI_UX_LAYOUT_SYSTEM.md` y `design-system/electrocms/MASTER.md`.
- Backend visual: `BACKEND_BUILDER.md`.
- FlutterFlow es referencia de capacidades, no fuente de código, branding ni activos.

## Estado real

- React 19, TypeScript estricto, Tailwind 4, Vite y PWA local-first.
- F00–F11 completadas.
- Fase activa: `F12 — Backend visual, usuarios y permisos`.
- Microfase activa: `M12.1 — Shell administrativo editable`.
- M12.2–M12.5 y F13–F31 permanecen pendientes salvo contratos anticipados que no cuentan como implementación formal.
- Producción no se despliega desde el PR draft #23.

## Última puerta verde

M11.5/F11 cerró con GitHub Actions run `31666856391` (run #608):

- lint: verde.
- typecheck: verde.
- suite completa: verde.
- build: verde.
- Chromium: verde.
- browser audit artifact y PR preview artifact: verdes.
- Cloudflare PR preview: verde.
- producción: skipped por PR draft.

## F11 consolidada — Formularios y acciones

### Builder y validación

- `FormManager` usa exclusivamente `CmsBackend.forms`; 27 tipos, mapping compatible y orden en `FormStep.controlIds`.
- `form-runtime.ts` valida required/tipo/formato/restricciones heredadas.
- `FieldConditionEditor` visual compartido elimina JSON técnico.
- Errores inline, foco al primer inválido y mensajes canónicos.

### Multipaso y borradores

- `Form.steps` es la única definición persistente de progreso.
- `form-step-runtime.ts` renombra/divide/mueve/fusiona pasos.
- Preview Paso N/M con Atrás/Siguiente y validación por paso.
- Borradores locales versionados `v1`, recuperación y descarte confirmado.

### Acciones

- 12 `FormAction` canónicas; catálogo único.
- Pipeline secuencial: valida/mapea una vez, corta en fallo/adapter ausente.
- Preview seguro para mensaje/local/redirect; redirect no abandona editor.
- Adapter de dominio real para guardar/crear/actualizar contenido y relaciones reutilizando motores M09.
- Integraciones externas sin adapter nunca simulan éxito.

### Seguridad M11.5

- `form-security-contract.ts` normaliza payloads sin HTML-escape irreversible, bloquea controles desconocidos y aplica límites de bytes/strings/items/props/profundidad.
- Política portable de archivo: tamaño, MIME y extensión; el servidor debe revalidar.
- `executeFormActionPipeline` aplica seguridad antes de mapping/adapters y devuelve `security-failed` si corresponde.
- `csrfProtection` es requisito portable, no token falso del editor.
- Rate limit, honeypot, escape de salida, validación/revalidación de servidor y CAPTCHA opcional son requisitos de destino.
- `form-export-compatibility.ts` refleja honestamente Local/React/LAMP/WordPress sin marcar exportadores futuros como terminados.
- `FormSecuritySettings` expone el requisito CSRF y explica seguridad/compatibilidad con lenguaje de usuario.

## F12/M12.1 activa — Shell administrativo editable

Contrato existente:

- `BackendScreen` contiene `id`, `name`, `type`, `documentId`, `contentTypeId`, `formId`, `queryId`, `capabilities`, `menuItemId`.
- `Menu`/`MenuItem` ya modelan navegación, jerarquía, icono, orden, target y capacidades.
- `Document`/nodos/renderer/editor visual ya son canónicos y deben reutilizarse.
- `BACKEND_BUILDER.md` exige un solo editor, un solo árbol, mismo responsive/style compiler para frontend/backend y filtrado RBAC antes de renderizar.

Objetivo inmediato:

1. Crear motor canónico de shell/backend que gestione `BackendScreen` y navegación sin stores paralelos.
2. Reutilizar `Document` normal para dashboard/pantallas administrativas; header/sidebar se resuelven mediante el mismo motor visual/componentes existentes.
3. Crear UI administrativa simple para crear/seleccionar/editar pantalla y menú sin pedir IDs técnicos.
4. Poder abrir el `documentId` de una pantalla administrativa en el editor visual existente.
5. Persistir todo por Command Bus y validar referencias.
6. Pasar lint + typecheck + suite completa + build + Chromium; cerrar M12.1 y saltar a M12.2 sin preguntar.

## Regla de calidad

- Cada microfase pasa lint + typecheck + suite completa + build antes de avanzar.
- En UI/runtime, además auditoría Chromium sobre build de producción.
- Browser audit cubre desktop/tablet/móvil, overflow, touch >=44 px, arquitectura, excepciones y consola.
- No cerrar una fase solo porque compile.

## Decisiones vigentes

- `ProjectStructure` es única fuente de verdad; `ProjectStructure.cms` contiene backend CMS.
- Dominio independiente de React/Tailwind/storage/exportadores.
- Toda mutación persistente usa `ProjectStructureCommand` + `ProjectCommandBus`; no crear otro history global.
- Undo/redo persiste en IndexedDB.
- No duplicar Selection, State, Action Flow, DataProvider, Auth, Components, History, Query, Forms ni Export.
- Backend visual reutiliza el mismo motor de `Document`/Node/rendering; no crear otro canvas.
- Estado local de UI/preferencias no duplica el proyecto.
- Funciones futuras no se muestran como activas.

## UI/UX vigente

- High Density + Minimal Clean, orientado a tareas.
- Targets: ~44 px touch / ~36 px escritorio denso.
- Navegación principal: `Crear | Administrar | Apariencia`; destinos `Editor | Páginas | Contenido | Diseño`.
- Divulgación progresiva obligatoria; parámetros técnicos poco frecuentes van a avanzado.
- No usar nombres de schemas, stores, IDs internos, fases o microfases como lenguaje principal del producto.

## Próximo paso exacto

Implementar M12.1 empezando por el motor canónico de `BackendScreen + Menu + Document`, después UI de shell/dashboard/navegación y apertura en el editor visual; gate completo y salto automático a M12.2.
