# MEMORY — contexto corto de ElectroCMS

Actualizado: 2026-08-09.

## Objetivo

Construir ElectroCMS como CMS visual local-first en React + TypeScript + Tailwind CSS, con editor no-code, contenido dinámico, backend visual y exportadores Local, React, LAMP y WordPress.

## Estado real

- Existe un scaffold funcional React 19 + TypeScript + Tailwind 4 con pantalla de fundación accesible.
- Prompt Flutter convertido a React sin eliminar ninguna de sus 33 secciones.
- Sistema de diseño base generado con `ui-ux-pro-max`; sus tokens semánticos y primitives ya tienen validación técnica inicial.
- `M01.1 — Scaffold y calidad` completada, incluido CI/CD y despliegue verificable.
- `M00.2 — Inventario de la referencia` completada: el usuario ordenó no usar ninguna aplicación externa y construir desde cero.
- Fase `F00` completada y puerta G0 cerrada.
- `M01.2 — Capas y contratos` completada con pruebas de dirección y ciclos.
- `M01.3 — Tokens y primitives` completada con contraste, foco, movimiento reducido y targets táctiles verificados.
- Fase activa: `F01 / M01.4 — PWA y adaptadores de plataforma`.

## Decisiones vigentes

- Núcleo web local-first/PWA; envolturas desktop y móvil desacopladas.
- Dominio y modelo canónico independientes de React/Tailwind.
- Layout adaptativo: shell de tres regiones en desktop; paneles contraíbles en tablet; canvas + sheets en móvil.
- WCAG 2.2 AA como objetivo verificable.
- Todo drag-and-drop tendrá alternativa por clic y teclado.

## Próximo paso exacto

Implementar `M01.4`: soporte PWA instalable/offline y contratos desacoplados para futuros adaptadores desktop y móvil.

## Riesgos abiertos

- El prompt menciona una aplicación React adjunta, pero no se proporcionó un artefacto autorizado; por decisión del usuario, no se sustituirá con otras aplicaciones.
- El scaffold pertenece a la implementación objetivo y no se utilizará como referencia circular.
- La densidad y legibilidad del editor completo todavía requieren pruebas con sus flujos reales; la fundación ya supera contraste automatizado.
- Debe decidirse la envoltura desktop/móvil después del núcleo PWA, sin acoplarla al dominio.
- Direct Upload de Cloudflare Pages no puede convertirse después a Git Integration; cambiar requeriría otro proyecto Pages.
- El token de CI está restringido a Cloudflare Pages y almacenado solo como secreto cifrado de GitHub; deberá rotarse si cambia el responsable del repositorio.

## Evidencia técnica reciente

- `npm run lint`: correcto.
- `npm run typecheck`: correcto.
- `npm run test`: 12/12 pruebas.
- `npm run build`: correcto; Vite 7.3.6.
- Browser aislado: contenido semántico presente en desktop y 375 × 812, tema oscuro del sistema aplicado y sin overflow horizontal.
- GitHub público: `https://github.com/janielsg20/ElectroCMSReact1.0` (`main`).
- GitHub Actions: lint, typecheck, 12/12 pruebas, build y deploy correctos para `6705eca` en la ejecución `31333777914`.
- Cloudflare Pages: `https://electrocms-react.pages.dev/`, respuesta HTTPS 200, título esperado y bundle `index-CPN-M36E.js` de M01.3.
- Arquitectura: seis capas, contrato `Repository`, adaptador en memoria, `Result`, `Renderer` y `Exporter`; 7/7 pruebas.
- UI foundation: tokens light/dark con pares WCAG AA, reset global, movimiento reducido, SVG semánticos, Button y TextField accesibles.

## Punteros

- Alcance completo: `PROMPT_MAESTRO_ELECTROCMS.md`.
- Reglas: `RULES.md`.
- Fases: `DETAILED_EXECUTION_PHASES.md`.
- Diseño adaptable: `UI_UX_LAYOUT_SYSTEM.md`.
- Estado: `TRACKING.md`.
- CI/CD: `CI_CD.md`.
