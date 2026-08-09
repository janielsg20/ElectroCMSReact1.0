# MEMORY — contexto corto de ElectroCMS

Actualizado: 2026-08-09.

## Objetivo

Construir ElectroCMS como CMS visual local-first en React + TypeScript + Tailwind CSS, con editor no-code, contenido dinámico, backend visual y exportadores Local, React, LAMP y WordPress.

## Estado real

- Existe un scaffold funcional React 19 + TypeScript + Tailwind 4 con pantalla de fundación accesible.
- Prompt Flutter convertido a React sin eliminar ninguna de sus 33 secciones.
- Sistema de diseño base generado con `ui-ux-pro-max`; requiere validación visual posterior.
- Fase actual: `F01 / M01.1 — Scaffold y calidad`, autorizada fuera de secuencia para habilitar GitHub Actions y Cloudflare Pages.

## Decisiones vigentes

- Núcleo web local-first/PWA; envolturas desktop y móvil desacopladas.
- Dominio y modelo canónico independientes de React/Tailwind.
- Layout adaptativo: shell de tres regiones en desktop; paneles contraíbles en tablet; canvas + sheets en móvil.
- WCAG 2.2 AA como objetivo verificable.
- Todo drag-and-drop tendrá alternativa por clic y teclado.

## Próximo paso exacto

El usuario debe ejecutar `gh auth login` y avisar cuando termine. Después: crear repo público `janielsg20/ElectroCMSReact1.0`, crear Pages `electrocms-react`, configurar secretos, push y verificar Actions/deploy. Volver a `M00.2` antes de implementar funciones del editor.

## Riesgos abiertos

- El prompt menciona una aplicación React adjunta, pero al iniciar solo existía el prompt maestro.
- El scaffold se inicia por autorización explícita del usuario; no se usarán sus componentes mínimos como sustituto de la referencia pendiente.
- La paleta y tipografía sugeridas por la skill son provisionales hasta pruebas de contraste, densidad y legibilidad del editor.
- Debe decidirse la envoltura desktop/móvil después del núcleo PWA, sin acoplarla al dominio.
- Direct Upload de Cloudflare Pages no puede convertirse después a Git Integration; cambiar requeriría otro proyecto Pages.

## Evidencia técnica reciente

- `npm run lint`: correcto.
- `npm run typecheck`: correcto.
- `npm run test`: 2/2 pruebas.
- `npm run build`: correcto; Vite 7.3.6.
- Browser: contenido presente, sin overlay ni errores; 375 px sin overflow.
- GitHub CLI 2.97.0 instalado, sin autenticación.

## Punteros

- Alcance completo: `PROMPT_MAESTRO_ELECTROCMS.md`.
- Reglas: `RULES.md`.
- Fases: `DETAILED_EXECUTION_PHASES.md`.
- Diseño adaptable: `UI_UX_LAYOUT_SYSTEM.md`.
- Estado: `TRACKING.md`.
- CI/CD: `CI_CD.md`.
