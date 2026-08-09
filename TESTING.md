# Estrategia de pruebas

Estado: baseline; se concreta con el scaffold.

- Unitarias: dominio, schemas, migraciones, commands, queries y seguridad.
- Integración: persistencia, historial, bindings, formularios y exportadores.
- Componentes: semántica, teclado, foco, estados y responsive.
- Browser E2E: flujos editor/backend/preview, offline y recuperación.
- Contrato: widgets y exportadores contra fixtures canónicos.
- Instalación: Local/React/LAMP/WordPress desde paquete limpio.
- Visual: preview frente a cada destino con tolerancias documentadas.
- Performance y accesibilidad automatizadas más revisión manual.

Comandos obligatorios previstos: `npm run lint`, `npm run typecheck`, `npm run test` y `npm run build`.

