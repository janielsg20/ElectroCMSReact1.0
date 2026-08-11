# Sistema de widgets

Estado: `M06.1–M06.4` completadas; `M06.5 — UX de biblioteca` activa.

Cada widget debe declarar ID/version, categoría, schema, defaults, renderer, inspector, icono SVG, migraciones, accesibilidad, serialización y soporte por exportador. El catálogo mínimo es el de la sección 9 del prompt maestro.

Un widget no está terminado si solo funciona en preview o si su botón/acción es inerte.

## Contrato implementado

- `WidgetDefinition` declara ID namespaced, versión semántica, schemaVersion, categoría, schema Zod, defaults, rendererId, inspector declarativo, icono SVG, accesibilidad, migraciones y soporte Local/React/LAMP/WordPress.
- `WidgetRegistry` rechaza duplicados y definiciones incompletas antes de registrarlas.
- Defaults deben validar contra el mismo property schema del widget.
- Migraciones forman una cadena consecutiva desde schema 1 hasta la versión actual.
- Soporte `diagnostic-only` produce warning y `unsupported` produce error; una incompatibilidad nunca se omite silenciosamente.
- El dominio no importa React, DOM, Tailwind ni exportadores concretos; los adapters resuelven `rendererId` en capas exteriores.

## Catálogo implementado

- M06.2 registra 15 widgets estructurales y 20 básicos, exactamente 35 definiciones.
- Preview y árbol consumen el mismo `widgetType`; `rendererId` solo se resuelve en la capa React.
- Cada definición valida defaults y overrides antes de renderizar, y declara compatibilidad Local/React/LAMP/WordPress.
- Embeds inseguros se aíslan; el HTML de usuario no se interpreta dentro del DOM del editor.
- M06.3 añade 20 widgets de contenido y 14 dinámicos; el catálogo acumulado contiene 69 definiciones.
- Los adapters dinámicos exponen bindings, fallbacks y estados vacíos sin ejecutar DataProvider, queries, relaciones ni expresiones.
- M06.4 añade 15 widgets de comercio, 20 de formularios y 11 filtros; el catálogo acumulado contiene 115 definiciones.
- Checkout, carrito, CAPTCHA, submit y filtros remotos se mantienen como contratos declarativos, sin efectos ficticios en preview.
