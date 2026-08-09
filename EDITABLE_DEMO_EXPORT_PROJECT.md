# Contrato del proyecto demo editable

## Propósito

La tienda demo es la prueba end-to-end de que Editor, Preview, Backend y Publicación comparten un único modelo persistente y que cada exportador recibe exactamente el estado editado.

## Identidad estable

- Un solo `projectId`, un solo `schemaVersion` y un solo historial.
- Cambiar de workspace no clona ni reinicia datos.
- Autosave, reload, cierre/reapertura y exportación conservan la última revisión válida.

## Edición mínima obligatoria

- Nombre, logotipo, claim y datos de contacto.
- Tokens primarios, superficie, tipografía y radios.
- Producto destacado: nombre, precio, media, stock y CTA.
- Dashboard: métricas, orden de widgets y preferencias visibles.

## Superficies

- Editor: modifica el modelo canónico mediante comandos reversibles.
- Preview storefront: lee el modelo actual, no fixtures paralelos.
- Preview backend: CRUD y dashboard sobre los mismos registros.
- Centro de publicación: recibe una revisión identificada y muestra diagnósticos por destino.

## Destinos

- Local: storefront y admin offline enlazados mediante almacenamiento local.
- React: aplicación independiente con ruta administrativa funcional.
- LAMP: instalación, autenticación y CRUD persistente.
- WordPress: theme, plugin companion, contenido inicial y menú administrativo.

## Estados profesionales

Toda capacidad muestra exactamente uno: `Demo interactiva`, `Modelado portable` o `Planificado`. El manifiesto `professionalStudio` viaja con los cuatro destinos.

## Accesibilidad y responsive

- WCAG 2.2 AA, teclado, screen reader, focus visible y reduced motion.
- Storefront/backend operables a 320 px sin overflow de página.
- Controles táctiles de 44 × 44 CSS px como estándar interno.
- No depender de drag; ofrecer botones/menús equivalentes.

## Prueba de aceptación

1. Editar identidad, color, producto y dashboard.
2. Cambiar entre Editor, Preview y Backend y confirmar el mismo estado.
3. Cerrar/reabrir sin pérdida.
4. Generar los cuatro destinos desde la misma revisión.
5. Instalar/abrir cada paquete y comparar datos, rutas, permisos y apariencia.
6. Fallar la publicación si alguna capacidad declarada se pierde silenciosamente.

