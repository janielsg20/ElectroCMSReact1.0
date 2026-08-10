# RULES — ElectroCMS

## R0. Jerarquía

1. Seguridad e integridad de datos.
2. `PROMPT_MAESTRO_ELECTROCMS.md` + `FLUTTERFLOW_PARITY_ADDENDUM.md` como alcance normativo conjunto.
3. Estas reglas.
4. Decisiones aceptadas en documentos de arquitectura.
5. Fase y microfase activas.

## R1. Alcance y verdad

- Las 33 secciones del prompt maestro son no negociables.
- El Addendum de paridad funcional amplía el alcance sin reemplazar ni reducir las 33 secciones originales.
- F19–F31 son posteriores al roadmap base y no se ejecutan por su sola incorporación documental.
- Los estados válidos son `NO_INICIADA`, `EN_CURSO`, `BLOQUEADA`, `EN_REVISION` y `COMPLETADA`.
- Solo se usa `COMPLETADA` con evidencia reproducible.
- Demo interactiva, modelado portable y planificado deben distinguirse en UI y documentación.
- Una capacidad de referencia ausente se registra como `PARITY_GAP`; nunca se presenta como implementada.

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
- No crear una segunda implementación de una capacidad que ya exista: localizar → auditar → ampliar → probar → documentar.
- Selection, State, Action Flow, AI y colaboración deben integrarse con contratos existentes y no saltarse Command Bus/persistencia.
- Integraciones externas se implementan como adapters/providers opcionales; nunca se convierten en dependencia obligatoria del núcleo local-first.

## R4. Tailwind y diseño

- Mobile-first y container queries para componentes portables.
- Usar tokens semánticos; evitar hexadecimales y valores arbitrarios dispersos.
- No eliminar el focus visible.
- No usar emojis como iconos de interfaz; usar SVG de una familia coherente.
- Texto base mínimo de 16 px en móvil; zoom del navegador siempre habilitado.
- Áreas táctiles objetivo de 44 × 44 CSS px como estándar del producto.
- Animaciones de interacción de 150–300 ms y soporte de `prefers-reduced-motion`.
- Ninguna función importante desaparece por breakpoint: cambia de presentación.
- El builder mantiene High Density + Minimal Clean: controles compactos en desktop y targets táctiles en touch.
- Azul de acento reservado principalmente para selección, foco, estado activo y acción primaria; no usarlo como decoración permanente.
- No acumular hojas de override indefinidas: cuando una UI anticipada entre en fase formal, consolidar en tokens/primitives/componentes base y retirar CSS redundante.

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
- Collaboration, AI, cloud functions y deployment remotos no pueden degradar el modo offline/local.

## R7. Cambios destructivos

- Confirmar borrados permanentes.
- Ofrecer deshacer o recuperación cuando sea viable.
- Validar rutas, nombres, MIME, tamaño y contenido de importaciones.

## R8. Paridad funcional tipo FlutterFlow

- La paridad se refiere a capacidades, categorías y flujos profesionales; no a copia pixel-perfect de identidad propietaria.
- Cada `PARITY_GAP` debe tener propietario, fase, criterios de aceptación y pruebas.
- Componentes reutilizables deben usar el Component System común; no crear variantes ad hoc fuera del registro.
- Variables y outputs deben ser tipados y resolubles desde `Set From Variable` cuando corresponda.
- Toda mutación visual/lógica relevante debe poder integrarse con History/Undo mediante Command Bus.
- Custom Code no puede saltarse validación, seguridad ni aislamiento.
- AI Agents no modifican persistencia directamente; emiten comandos validados.
- Secrets nunca se exponen en UI, logs, exports ni bundles frontend.

## R9. Cierre de sesión de trabajo

- `MEMORY.md` debe quedar por debajo de 200 líneas.
- `TRACKING.md` debe señalar una sola microfase activa.
- Decisiones extensas se mueven al documento de dominio y se enlazan desde memoria.
- Registrar comandos de verificación y su resultado, sin afirmar pruebas no ejecutadas.
