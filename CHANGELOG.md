# Changelog

## 2026-08-09

- Convertido el prompt maestro de Flutter a React + TypeScript + Tailwind CSS, preservando sus 33 secciones.
- Añadido sistema documental para IA de poco contexto: reglas, memoria, tracking, fases y microfases.
- Añadido layout adaptativo accesible para desktop, tablet y móvil.
- Persistido el sistema de diseño inicial generado por `ui-ux-pro-max`.
- Verificados los 22 documentos mínimos, la secuencia completa 1–33 y 89 microfases distribuidas en 19 fases.
- Creado scaffold React 19 + TypeScript + Tailwind 4 con Vite 7.
- Añadidos ESLint, Vitest, Testing Library y scripts de lint/typecheck/test/build.
- Añadido workflow GitHub Actions con puerta de calidad y despliegue a Cloudflare Pages.
- Añadidos `wrangler.jsonc`, fallback SPA y headers de seguridad.
- Verificada la UI en navegador desktop y 375 px, sin errores ni overflow horizontal.
- Instalado y autenticado GitHub CLI 2.97.0.
- Creado y publicado el repositorio público `janielsg20/ElectroCMSReact1.0` con rama principal `main`.
- Creado el proyecto Direct Upload `electrocms-react` en Cloudflare Pages.
- Configurados los secretos cifrados de GitHub Actions para Cloudflare sin exponer credenciales.
- Verificada la ejecución completa de CI/CD: lint, typecheck, 2 pruebas, build y deploy correctos.
- Verificada `https://electrocms-react.pages.dev/` con respuesta HTTPS 200 y contenido esperado.
- Cerrada `M00.2`: se documentó la ausencia de una referencia React autorizada y la decisión expresa de construir desde cero sin usar otras aplicaciones.
- Cerrada `M00.3`: añadidas equivalencias de arquitectura objetivo y regla verificable contra requisitos huérfanos para las 33 secciones.
- Cerrada `M00.4` y puerta G0: aceptadas capas, ADR, dependencias y reglas de dirección arquitectónica.
- Cerrada `M01.2`: añadidas capas de dominio, aplicación, infraestructura, UI, renderers y exportadores con contratos y pruebas contra dependencias inválidas o circulares.
- Cerrada `M01.3`: implementados tokens semánticos light/dark, reset global, tipografía sin dependencia de red, escala de z-index, foco visible y reducción de movimiento.
- Añadidos primitives accesibles `Button`, `Icon` y `TextField`, con estados de carga/error y targets táctiles mínimos de 44 px.
- Añadidas pruebas de contraste WCAG AA, semántica y comportamiento; la suite alcanza 12/12 pruebas.
- Validada la pantalla de fundación de este repositorio en desktop y 375 × 812 sin desbordamiento horizontal.
- Publicado `6705eca`; GitHub Actions `31333777914` y el despliegue de M01.3 en Cloudflare Pages finalizaron correctamente.
- Cerrada `M01.4` y puerta G1: añadidos manifest instalable, iconos PNG/SVG y Service Worker versionado desde los assets reales del build.
- Implementado precache del shell, navegación network-first, assets cache-first, limpieza de cachés antiguas y registro exclusivo de producción.
- Corregida la recuperación offline de módulos ES servidos con `Vary: Origin` mediante coincidencia same-origin que ignora esa variación.
- Añadidos contrato público v1 de adaptadores de plataforma, adaptador web y documentación para futuras envolturas desktop y móvil.
- Validado el núcleo React sin red desde un origen limpio después de detener totalmente el servidor; 17/17 pruebas verdes.
- Publicado `16d76f3`; GitHub Actions `31334792028` y el despliegue PWA en Cloudflare Pages finalizaron correctamente.
- Cerrada `M02.1`: añadido envelope `electrocms.project` v1 con UUID, revisión, nombre, timestamps UTC, metadatos JSON y payload validado por schema.
- Incorporado Zod 4.4.3 como dependencia exacta y fuente común para tipos, validación y JSON Schema estricto.
- Añadida serialización JSON determinista con claves ordenadas, deserialización segura y errores tipados sin excepciones para entradas no confiables.
- Añadidas pruebas de identidad, cronología, versiones incompatibles, propiedades desconocidas, determinismo, round-trip y JSON Schema.
- Publicado `ea034f2`; GitHub Actions `31336177234` y el despliegue posterior a M02.1 finalizaron correctamente.
