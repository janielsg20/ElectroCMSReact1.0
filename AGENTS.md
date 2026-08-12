# Reglas operativas para agentes de IA

Estas reglas son obligatorias para cualquier IA que trabaje en ElectroCMS.

## Lectura mínima al iniciar

1. Lee `MEMORY.md`.
2. Lee `TRACKING.md`.
3. Lee la fase activa en `DETAILED_EXECUTION_PHASES.md`.
4. Lee solo los documentos de dominio enlazados por esa microfase.
5. Lee `UX_SIMPLICITY_SYSTEM.md` antes de crear o modificar cualquier interfaz, navegación, formulario, inspector o gestor visual.
6. Consulta `PROMPT_MAESTRO_ELECTROCMS.md` únicamente para validar alcance o resolver ambigüedad.
7. Consulta `FLUTTERFLOW_PARITY_ADDENDUM.md` únicamente si la tarea cae en F19–F31 o si necesitas comprobar un `PARITY_GAP`.

## Fuente de verdad

- Alcance base: `PROMPT_MAESTRO_ELECTROCMS.md`.
- Alcance ampliado visual-builder: `FLUTTERFLOW_PARITY_ADDENDUM.md`.
- Trazabilidad: `REQUIREMENTS.md`.
- Reglas de ejecución: `RULES.md`.
- Estado actual: `TRACKING.md`.
- Memoria breve: `MEMORY.md`.
- Plan: `PHASES.md` y `DETAILED_EXECUTION_PHASES.md`.
- Diseño: `design-system/electrocms/MASTER.md`, `UI_UX_LAYOUT_SYSTEM.md` y `UX_SIMPLICITY_SYSTEM.md`.
- Una decisión aceptada en `ARCHITECTURE.md` prevalece sobre una hipótesis antigua de `MEMORY.md`.

## Protocolo de poco contexto

- Trabaja una sola microfase a la vez.
- No cargues todos los documentos si la microfase no los necesita.
- Antes de editar, registra la microfase como `EN_CURSO` en `TRACKING.md`.
- Después de verificar, actualiza `TRACKING.md`, `MEMORY.md` y `CHANGELOG.md` en la misma entrega.
- Si falta información, marca `BLOQUEADA`; no inventes contratos, estados ni funciones terminadas.
- No avances si los criterios de salida de la microfase no se cumplen.
- F19–F31 no se activan solo porque ya estén documentadas; deben respetar dependencias y el orden real del proyecto.

## Integridad

- No elimines requisitos del prompt maestro ni del Addendum.
- No presentes placeholders, mocks permanentes o botones inertes como funciones completas.
- Conserva compatibilidad de esquemas mediante versiones y migraciones.
- Toda función visual debe ser usable con teclado, puntero y touch cuando aplique.
- Todo drag-and-drop debe tener alternativa sin arrastre.
- Nunca guardes secretos o contraseñas en texto plano.
- No dupliques Selection Manager, State Manager, Action Flow, History, DataProvider, Auth o exportadores si ya existe un contrato equivalente.
- Toda mutación AI o Action Flow que afecte el proyecto debe pasar por contratos y Command Bus cuando corresponda.
- Una capacidad tipo FlutterFlow ausente se registra `PARITY_GAP`; no se improvisa fuera de fase.

## Simplicidad obligatoria para el usuario final

- La arquitectura puede ser avanzada; la interfaz pública debe sentirse familiar para usuarios de WordPress, Elementor, ACF y JetEngine.
- Organiza navegación y acciones por intención del usuario, no por nombres de capas, schemas, stores, AST, motores o fases internas.
- Aplica divulgación progresiva: flujo básico primero y `Opciones avanzadas` solo cuando sean necesarias.
- Simplificar nunca autoriza eliminar funcionalidad ni crear un segundo modelo de datos.
- Toda opción no obvia debe incluir ayuda contextual accesible con el componente ElectroCMS de información y explicar qué hace antes de describir su implementación.
- Cuando exista equivalencia funcional clara, la ayuda debe indicar la referencia conocida de WordPress, Elementor, ACF, JetEngine, JetFormBuilder, JetSmartFilters o JetStyleManager definida en `UX_SIMPLICITY_SYSTEM.md`.
- Los términos técnicos quedan reservados a opciones avanzadas, diagnósticos, desarrollo y documentación.
- Ninguna fase se considera visualmente cerrada si obliga a un usuario común a conocer términos internos para completar una tarea habitual.
