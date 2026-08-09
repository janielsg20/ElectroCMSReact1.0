# Arquitectura

Estado: propuesta inicial; se confirma en `M00.4`.

## Capas

- `domain`: entidades, invariantes, comandos, esquemas y contratos puros.
- `application`: casos de uso, transacciones, historial y coordinación.
- `infrastructure`: IndexedDB/OPFS, archivos, workers, PWA y adaptadores.
- `editor-ui`: React, Tailwind, accesibilidad, shell, canvas e inspector.
- `renderers`: preview frontend/backend desde el modelo canónico.
- `exporters`: Local, React, LAMP y WordPress mediante contratos versionados.

## Reglas

- El dominio no importa React, Tailwind ni APIs del navegador.
- Preview y exportadores consumen el mismo modelo canónico.
- Cada plugin/widget declara schema, migraciones, inspector, renderer y compatibilidad por destino.
- Integraciones de red y envolturas son adaptadores opcionales.

## Decisiones pendientes

- Librería de routing, estado de aplicación, drag/drop y validación de schemas.
- Estrategia exacta IndexedDB + OPFS y respaldo portable.
- Envolturas desktop/móvil posteriores a la PWA.

