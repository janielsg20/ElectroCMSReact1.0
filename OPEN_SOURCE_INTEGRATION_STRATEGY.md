# OPEN SOURCE INTEGRATION STRATEGY — ElectroCMS

Actualizado: 2026-08-14.

## Objetivo

Acelerar ElectroCMS reutilizando patrones, contratos e ideas maduras de proyectos open source sin reiniciar el producto, duplicar motores ya completados ni comprometer el modelo canónico, local-first, Command Bus, accesibilidad, responsive o los exportadores.

Esta estrategia es **aditiva y no destructiva**. F00–F12 permanecen cerradas cuando sus puertas estén verdes. F13 continúa desde su microfase activa. Ninguna referencia externa reabre una fase por sí sola.

## Regla principal: adoptar por capas, no sustituir motores

ElectroCMS conserva como fuente de verdad:

- `ProjectStructure` y sus schemas versionados;
- Command Bus e historial reversible;
- persistencia local-first;
- motor de documentos/nodos;
- registro de widgets;
- inspector y responsive engine;
- CMS dinámico, queries, filtros y formularios;
- backend visual y RBAC;
- contratos de preview/exportación.

Un proyecto externo puede aportar patrones o, excepcionalmente, una dependencia aislada. Nunca puede convertirse en una segunda fuente de verdad ni obligar a serializar el proyecto en un formato paralelo.

## Matriz de referencias

| Referencia | Uso en ElectroCMS | Fases propietarias | Política |
|---|---|---|---|
| Puck | Component registry, configuración de campos, permissions, viewports, data migrations y composición React | F19–F20, F26 | Referencia primaria React. Una integración runtime solo se evalúa detrás de adapter si no duplica el motor existente. Núcleo MIT. |
| GrapesJS | Commands, layers, component model, storage/project-data, plugins y operaciones maduras de builder | F19, F20, F28, F29 | Referencia de comportamiento/arquitectura. BSD-3 permite estudiar e integrar piezas compatibles, pero no se introduce su estado como segundo documento. |
| Webstudio | Canvas/Navigator/Style/Settings, CSS explícito, tokens, breakpoints, componentes reales y UX de builder profesional | F19–F20, F26 | Referencia UX/arquitectura. No copiar código AGPL al núcleo de ElectroCMS sin decisión explícita de licencia. |
| Vvveb CMS / VvvebJs | CMS integrado, ecommerce, custom fields/posts, roles, media, revisiones, plugin/theme workflows y administración | F13, F15–F16, F23–F25, F31 | Referencia funcional. Vvveb CMS es AGPL; por defecto no se copia código al núcleo. |
| Silex y otros builders portables | Separación editor → modelo → salida portable, publicación y exportación | F14–F16, F31 | Referencia de exportación y portabilidad; adoptar solo contratos compatibles con ElectroCMS. |

## Clasificación de adopción

Toda propuesta derivada de un proyecto externo debe registrarse en una de estas categorías:

1. `REFERENCE_ONLY`: comportamiento, UX o arquitectura estudiados; cero código externo.
2. `PATTERN_ADOPTED`: patrón reimplementado con contratos y código propios de ElectroCMS.
3. `OPTIONAL_ADAPTER`: integración opcional detrás de un puerto existente; el proyecto funciona completamente sin ella.
4. `DEPENDENCY_APPROVED`: dependencia runtime/dev aprobada tras licencia, tamaño, mantenimiento, seguridad, accesibilidad y pruebas de compatibilidad.
5. `REJECTED`: solapa un motor canónico, rompe local-first, fuerza estado paralelo, introduce copyleft incompatible o aumenta complejidad sin beneficio medido.

## Gate de adopción OSS

Antes de añadir una dependencia o copiar una porción permitida por licencia deben cumplirse todos estos puntos:

- necesidad real no cubierta por el código existente;
- fase propietaria activa;
- licencia y obligaciones documentadas;
- evaluación de mantenimiento y actividad del proyecto;
- impacto de bundle y rendimiento medido;
- sin segundo store/document model;
- sin bypass del Command Bus;
- sin escrituras directas a IndexedDB/OPFS fuera de puertos existentes;
- API envuelta por adapter/registry propio cuando afecte dominio o persistencia;
- tests unitarios/integración y browser audit;
- estrategia de retirada o sustitución documentada;
- exportadores no dependen silenciosamente de la librería del editor.

Si uno falla, la propuesta queda como `REFERENCE_ONLY` o `REJECTED`.

## Qué se conserva de las fases completadas

### F00–F03

No se reemplazan schemas, migraciones, repositorios locales, Command Bus ni historial. Los modelos externos se traducen al modelo canónico, nunca al contrario.

### F04–F08

No se sustituye el shell, canvas, árbol, widgets, inspector, responsive ni themes. Webstudio, Puck y GrapesJS sirven para auditar UX, accesibilidad y capacidades faltantes; cualquier mejora se implementa sobre los contratos existentes.

### F09–F12

No se reemplazan CPT, taxonomías, custom fields, relaciones, bindings, queries, listings, filtros, formularios, backend ni RBAC. Vvveb y otros CMS se usan para descubrir gaps funcionales y criterios de aceptación.

### F13

Media, blueprints, tienda demo y `professionalStudio` siguen siendo implementación propietaria de ElectroCMS. Las referencias externas sirven para completar UX, metadata, seguridad, ecommerce y manifest portability, no para introducir un CMS paralelo.

## Aplicación a las fases restantes

### F14 — Preview y exportación Local/React

- adoptar el principio editor → modelo JSON canónico → renderer/generator;
- compartir fixtures entre preview y exportadores;
- generar React legible sin depender del runtime del editor;
- usar adapters solo para capacidades que no tengan implementación nativa.

### F15–F16 — LAMP y WordPress

- usar Vvveb/WordPress como referencia funcional de instalación, CRUD, media, roles, ecommerce y extensibilidad;
- mantener exportadores propios y deterministas;
- no incrustar el CMS externo como atajo de implementación.

### F17–F18 — calidad y entrega

- añadir auditoría de dependencias/licencias/SBOM;
- verificar que la aplicación sigue operativa sin servicios externos;
- validar accesibilidad, rendimiento y equivalencia de exportación después de cualquier adopción.

### F19–F20 — Visual Builder y Component System

- Puck es referencia primaria para registry/config/fields/permissions/viewports/migrations;
- GrapesJS es referencia para commands/layers/plugins y operaciones de edición;
- Webstudio es referencia para Navigator, Style Panel, Settings, CSS/tokens y componentes reales;
- ampliar el motor actual, nunca montar un editor completo dentro de otro editor.

### F21–F25 — datos, acciones, APIs y auth

- todos los providers externos son opcionales;
- el estado persistente continúa en contratos ElectroCMS;
- variables, actions, API/auth y secretos pasan por puertos tipados y seguridad existente.

### F26–F31 — media avanzada, código, testing, versioning, AI y deployment

- adoptar patrones maduros solo detrás de adapters;
- AI genera comandos reversibles;
- custom code se aísla;
- versioning usa snapshots/checkpoints del modelo canónico;
- Deployment Center consume artefactos de exportadores, no el estado interno de terceros.

## Regla de licencia

- MIT/BSD/Apache y licencias permisivas pueden evaluarse para integración real, siempre con atribución y obligaciones correspondientes.
- AGPL/GPL y licencias copyleft se consideran por defecto `REFERENCE_ONLY` para el núcleo de ElectroCMS, salvo decisión jurídica/arquitectónica explícita que documente la compatibilidad y el alcance de distribución.
- No se copian branding, textos, assets, layouts propietarios ni identidad visual de ningún producto.

## Resultado esperado

ElectroCMS debe terminar como una plataforma propia que combine las fortalezas observadas en builders y CMS maduros, pero con una sola arquitectura coherente:

`UI ElectroCMS → Command Bus → modelo canónico → persistencia local → renderers/exporters`.

Las referencias externas reducen riesgo y tiempo de investigación; no controlan el proyecto ni sustituyen sus contratos.
