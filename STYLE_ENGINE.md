# Motor de estilos

Estado: `M07.3 — Motor de estilos` completada; `M07.4 — Motor de breakpoints` activa.

## Contrato canónico

- Las declaraciones base continúan en `Node.styles` y en los `styles` de cada override responsive.
- `$classes` acepta una lista única de clases simples; no admite selectores, variantes Tailwind ni markup.
- `$states` acepta exclusivamente `hover`, `focus`, `focusVisible`, `active` y `disabled`, cada uno como mapa de declaraciones.
- Una referencia de token usa `{ "$token": "spacing.sm", "fallback": 8 }`; los tokens pueden heredar de otro token y los ciclos se diagnostican.
- `CORE_STYLE_TOKENS` aporta espaciado, radio y duración neutrales. Los paquetes visuales de F08 ampliarán el mapa sin cambiar el formato del nodo.

## Seguridad y determinismo

- Solo se compilan propiedades incluidas en la allowlist del dominio.
- Se rechazan valores vacíos, excesivos, caracteres de control, `url()`, `expression`, protocolos ejecutables, braces, at-rules y separadores capaces de inyectar declaraciones.
- Clases, propiedades y estados se ordenan antes de serializar; entradas equivalentes producen exactamente el mismo CSS.
- Cada regla de estado queda limitada a `[data-style-scope="<nodeId>"]`; el ID se valida o normaliza antes de interpolarse.
- Valores inválidos históricos se omiten con diagnóstico durante render; nuevas mutaciones no pueden persistirlos.

## Herencia y render

- El compilador puede incorporar de un ancestro únicamente propiedades CSS heredables.
- En el DOM, la herencia nativa cubre la composición habitual de nodos; la opción explícita mantiene la misma salida disponible para exportadores sin DOM.
- `CanonicalProjectRenderer` usa `compileCanonicalStyles` para clases, estilo inline y reglas de estado. No existe un compilador paralelo en React.
- La resolución de breakpoints ocurre antes en `resolveValidatedNodeResponsiveState`; M07.4 administra la cadena y los overrides.

## Mutación e inspector

- `CanonicalStyleControl` edita clases, declaraciones y estados como datos estructurados y muestra errores inline.
- `width`, `height`, margen y padding permanecen protegidos para direct manipulation; aplicar o resetear estilos visuales no los elimina.
- `setNodeStyles` valida el resultado completo. Update/reset pasan por `ProjectStructureCommand`, `ProjectCommandBus`, IndexedDB y render store.
