# RULES — ElectroCMS

## R0. Jerarquía

1. Seguridad e integridad de datos.
2. `PROMPT_MAESTRO_ELECTROCMS.md`.
3. Estas reglas.
4. Decisiones aceptadas en documentos de arquitectura.
5. Fase y microfase activas.

## R1. Alcance y verdad

- Las 33 secciones del prompt maestro son no negociables.
- Los estados válidos son `NO_INICIADA`, `EN_CURSO`, `BLOQUEADA`, `EN_REVISION` y `COMPLETADA`.
- Solo se usa `COMPLETADA` con evidencia reproducible.
- Demo interactiva, modelado portable y planificado deben distinguirse en UI y documentación.

## R2. Flujo de cada microfase

1. Confirmar entrada, salida y archivos permitidos.
2. Implementar el cambio mínimo completo.
3. Añadir o actualizar pruebas.
4. Ejecutar lint, typecheck, pruebas y build que correspondan.
5. Revisar accesibilidad y responsive si existe impacto visual.
6. Actualizar memoria, tracking y changelog.

## R3. Código

- React + TypeScript estricto; prohibido introducir `any` sin justificación documentada.
- Dominio independiente de React, Tailwind, almacenamiento y exportadores.
- Componentes pequeños; no crear archivos monolíticos ni dependencias circulares.
- El modelo canónico es la fuente de preview y exportación.
- Una capacidad no representable debe diagnosticarse antes de exportar; nunca se pierde silenciosamente.
- No ejecutar efectos de red o almacenamiento durante render.

## R4. Tailwind y diseño

- Mobile-first y container queries para componentes portables.
- Usar tokens semánticos; evitar hexadecimales y valores arbitrarios dispersos.
- No eliminar el focus visible.
- No usar emojis como iconos de interfaz; usar SVG de una familia coherente.
- Texto base mínimo de 16 px en móvil; zoom del navegador siempre habilitado.
- Áreas táctiles objetivo de 44 × 44 CSS px como estándar del producto.
- Animaciones de interacción de 150–300 ms y soporte de `prefers-reduced-motion`.
- Ninguna función importante desaparece por breakpoint: cambia de presentación.

## R5. Accesibilidad

- Objetivo WCAG 2.2 AA para editor y proyectos generados.
- Navegación completa por teclado, orden de foco lógico y semántica HTML primero.
- Alternativas por botones/menús a drag, resize y reordenamiento.
- Reflow sin pérdida a 320 CSS px, salvo regiones bidimensionales justificadas como el canvas; esas regiones deben quedar contenidas.
- Errores junto al campo, resumen cuando haya varios y anuncio con región viva.
- Color nunca es el único indicador.

## R6. Local-first

- Abrir, editar, guardar, previsualizar y exportar no dependen de Internet.
- Escrituras incrementales, atómicas cuando sea posible, con recuperación y migraciones.
- Integraciones externas son adaptadores opcionales.

## R7. Cambios destructivos

- Confirmar borrados permanentes.
- Ofrecer deshacer o recuperación cuando sea viable.
- Validar rutas, nombres, MIME, tamaño y contenido de importaciones.

## R8. Cierre de sesión de trabajo

- `MEMORY.md` debe quedar por debajo de 200 líneas.
- `TRACKING.md` debe señalar una sola microfase activa.
- Decisiones extensas se mueven al documento de dominio y se enlazan desde memoria.
- Registrar comandos de verificación y su resultado, sin afirmar pruebas no ejecutadas.

