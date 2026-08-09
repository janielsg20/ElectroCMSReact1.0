# Reglas operativas para agentes de IA

Estas reglas son obligatorias para cualquier IA que trabaje en ElectroCMS.

## Lectura mínima al iniciar

1. Lee `MEMORY.md`.
2. Lee `TRACKING.md`.
3. Lee la fase activa en `DETAILED_EXECUTION_PHASES.md`.
4. Lee solo los documentos de dominio enlazados por esa microfase.
5. Consulta `PROMPT_MAESTRO_ELECTROCMS.md` únicamente para validar alcance o resolver ambigüedad.

## Fuente de verdad

- Alcance: `PROMPT_MAESTRO_ELECTROCMS.md`.
- Reglas de ejecución: `RULES.md`.
- Estado actual: `TRACKING.md`.
- Memoria breve: `MEMORY.md`.
- Plan: `PHASES.md` y `DETAILED_EXECUTION_PHASES.md`.
- Diseño: `design-system/electrocms/MASTER.md` y `UI_UX_LAYOUT_SYSTEM.md`.
- Una decisión aceptada en `ARCHITECTURE.md` prevalece sobre una hipótesis antigua de `MEMORY.md`.

## Protocolo de poco contexto

- Trabaja una sola microfase a la vez.
- No cargues todos los documentos si la microfase no los necesita.
- Antes de editar, registra la microfase como `EN_CURSO` en `TRACKING.md`.
- Después de verificar, actualiza `TRACKING.md`, `MEMORY.md` y `CHANGELOG.md` en la misma entrega.
- Si falta información, marca `BLOQUEADA`; no inventes contratos, estados ni funciones terminadas.
- No avances si los criterios de salida de la microfase no se cumplen.

## Integridad

- No elimines requisitos del prompt maestro.
- No presentes placeholders, mocks permanentes o botones inertes como funciones completas.
- Conserva compatibilidad de esquemas mediante versiones y migraciones.
- Toda función visual debe ser usable con teclado, puntero y touch cuando aplique.
- Todo drag-and-drop debe tener alternativa sin arrastre.
- Nunca guardes secretos o contraseñas en texto plano.

