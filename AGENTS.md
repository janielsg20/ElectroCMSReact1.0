# Reglas operativas para agentes de IA

Estas reglas son obligatorias para cualquier IA que trabaje en ElectroCMS.

## Lectura mínima al iniciar

1. Lee `MEMORY.md`.
2. Lee `TRACKING.md`.
3. Lee la fase activa en `DETAILED_EXECUTION_PHASES.md`.
4. Si la tarea modifica UI/interacción, lee también `UI_INTERNAL_COMPONENT_POLICY.md` y la entrada correspondiente de `DETAILED_EXECUTION_PHASES_UI_INTERNAL_COMPONENTS.md`.
5. Lee solo los documentos de dominio enlazados por esa microfase.
6. Consulta `PROMPT_MAESTRO_ELECTROCMS.md` únicamente para validar alcance o resolver ambigüedad.
7. Consulta `FLUTTERFLOW_PARITY_ADDENDUM.md` únicamente si la tarea cae en F19–F31 o si necesitas comprobar un `PARITY_GAP`.

## Fuente de verdad

- Alcance base: `PROMPT_MAESTRO_ELECTROCMS.md`.
- Sección 35 del Prompt Maestro / UI interna cross-platform: `UI_INTERNAL_COMPONENT_POLICY.md`.
- Alcance ampliado visual-builder: `FLUTTERFLOW_PARITY_ADDENDUM.md`.
- Trazabilidad: `REQUIREMENTS.md`.
- Reglas de ejecución: `RULES.md`.
- Estado actual: `TRACKING.md`.
- Memoria breve: `MEMORY.md`.
- Plan: `PHASES.md`, `DETAILED_EXECUTION_PHASES.md` y `DETAILED_EXECUTION_PHASES_UI_INTERNAL_COMPONENTS.md`.
- Diseño: `design-system/electrocms/MASTER.md` y `UI_UX_LAYOUT_SYSTEM.md`.
- Una decisión aceptada en `ARCHITECTURE.md` prevalece sobre una hipótesis antigua de `MEMORY.md`.

## Protocolo de poco contexto

- Trabaja una sola microfase a la vez.
- No cargues todos los documentos si la microfase no los necesita.
- Antes de editar, registra la microfase como `EN_CURSO` en `TRACKING.md`.
- Después de verificar, actualiza `TRACKING.md`, `MEMORY.md` y `CHANGELOG.md` en la misma entrega.
- Si falta información, marca `BLOQUEADA`; no inventes contratos, estados ni funciones terminadas.
- No avances si los criterios de salida de la microfase no se cumplen.
- F19–F31 no se activan solo porque ya estén documentadas; deben respetar dependencias y el orden real del proyecto.
- Incorporar la Sección 35 no cambia la microfase activa, pero sí cambia los criterios de aceptación de toda UI nueva o modificada.

## Integridad

- No elimines requisitos del prompt maestro, sus secciones normativas externas ni del Addendum.
- No presentes placeholders, mocks permanentes o botones inertes como funciones completas.
- Conserva compatibilidad de esquemas mediante versiones y migraciones.
- Toda función visual debe ser usable con teclado, puntero y touch cuando aplique.
- Todo drag-and-drop debe tener alternativa sin arrastre.
- Nunca guardes secretos o contraseñas en texto plano.
- No dupliques Selection Manager, State Manager, Action Flow, History, DataProvider, Auth o exportadores si ya existe un contrato equivalente.
- Toda mutación AI o Action Flow que afecte el proyecto debe pasar por contratos y Command Bus cuando corresponda.
- Una capacidad tipo FlutterFlow ausente se registra `PARITY_GAP`; no se improvisa fuera de fase.
- No uses `<select>`, `<datalist>`, color/date/time pickers nativos, `alert/confirm/prompt`, context menus nativos ni `title` como UI final de producto cuando exista primitive interno equivalente.
- Si un control estilizado abre al activarse un picker/menú propio de Android, Windows, macOS, iOS o navegador, trátalo como `NATIVE_UI_VIOLATION` salvo excepción explícita de `UI_INTERNAL_COMPONENT_POLICY.md`.
- Reutiliza primitives internos antes de crear variantes ad hoc; deben heredar theme/preset, responsive, keyboard, focus, touch y ARIA.
- Solo se aceptan superficies nativas en fronteras reales de plataforma/seguridad documentadas, como archivos/carpetas, permisos, biometría, share sheet, impresión o instalación PWA.
