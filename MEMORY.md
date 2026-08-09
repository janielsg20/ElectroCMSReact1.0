# MEMORY — contexto corto de ElectroCMS

Actualizado: 2026-08-09.

## Objetivo

Construir ElectroCMS como CMS visual local-first en React + TypeScript + Tailwind CSS, con editor no-code, contenido dinámico, backend visual y exportadores Local, React, LAMP y WordPress.

## Estado real

- Existe un scaffold funcional React 19 + TypeScript + Tailwind 4 con pantalla de fundación accesible.
- Prompt Flutter convertido a React sin eliminar ninguna de sus 33 secciones.
- Sistema de diseño base generado con `ui-ux-pro-max`; requiere validación visual posterior.
- `M01.1 — Scaffold y calidad` completada, incluido CI/CD y despliegue verificable.
- Fase retomada: `F00 / M00.2 — Inventario de la referencia`, bloqueada hasta recibir la aplicación React de referencia mencionada por el prompt.

## Decisiones vigentes

- Núcleo web local-first/PWA; envolturas desktop y móvil desacopladas.
- Dominio y modelo canónico independientes de React/Tailwind.
- Layout adaptativo: shell de tres regiones en desktop; paneles contraíbles en tablet; canvas + sheets en móvil.
- WCAG 2.2 AA como objetivo verificable.
- Todo drag-and-drop tendrá alternativa por clic y teclado.

## Próximo paso exacto

Recibir o localizar la aplicación React de referencia y completar `M00.2`. No implementar funciones del editor hasta inventariar sus rutas, pantallas, componentes, estados y flujos.

## Riesgos abiertos

- El prompt menciona una aplicación React adjunta, pero al iniciar solo existía el prompt maestro.
- El scaffold se inicia por autorización explícita del usuario; no se usarán sus componentes mínimos como sustituto de la referencia pendiente.
- La paleta y tipografía sugeridas por la skill son provisionales hasta pruebas de contraste, densidad y legibilidad del editor.
- Debe decidirse la envoltura desktop/móvil después del núcleo PWA, sin acoplarla al dominio.
- Direct Upload de Cloudflare Pages no puede convertirse después a Git Integration; cambiar requeriría otro proyecto Pages.
- El token de CI está restringido a Cloudflare Pages y almacenado solo como secreto cifrado de GitHub; deberá rotarse si cambia el responsable del repositorio.

## Evidencia técnica reciente

- `npm run lint`: correcto.
- `npm run typecheck`: correcto.
- `npm run test`: 2/2 pruebas.
- `npm run build`: correcto; Vite 7.3.6.
- Browser: contenido presente, sin overlay ni errores; 375 px sin overflow.
- GitHub público: `https://github.com/janielsg20/ElectroCMSReact1.0` (`main`).
- GitHub Actions: lint, typecheck, 2/2 pruebas, build y deploy correctos en la ejecución `31332151380`.
- Cloudflare Pages: `https://electrocms-react.pages.dev/`, respuesta HTTPS 200 y título esperado.

## Punteros

- Alcance completo: `PROMPT_MAESTRO_ELECTROCMS.md`.
- Reglas: `RULES.md`.
- Fases: `DETAILED_EXECUTION_PHASES.md`.
- Diseño adaptable: `UI_UX_LAYOUT_SYSTEM.md`.
- Estado: `TRACKING.md`.
- CI/CD: `CI_CD.md`.
