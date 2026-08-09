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

## Puerta offline PWA

Procedimiento reproducible usado en M01.4:

1. Ejecutar `npm run build`.
2. Servir `dist/` en un origen local limpio mediante `npm run preview -- --host 127.0.0.1 --port <puerto> --strictPort`.
3. Abrir la aplicación y esperar `html[data-offline-shell="ready"]`; esta señal solo aparece cuando el Service Worker activo controla la página.
4. Detener por completo el servidor del origen.
5. Navegar de nuevo a la misma URL.
6. Confirmar que React vuelve a renderizar el encabezado principal, no aparece overlay y no existe overflow horizontal.

El uso de un origen limpio evita confundir el worker del bundle actual con registros anteriores. La prueba debe fallar si solo reaparece el HTML pero no se ejecuta React.
