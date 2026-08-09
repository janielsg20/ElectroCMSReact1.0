# Contratos de plataforma

Estado: contrato público v1 aceptado en `M01.4`.

## Propósito

El núcleo de ElectroCMS es una PWA web local-first. Las futuras envolturas de escritorio y móvil son adaptadores opcionales: consumen puertos de aplicación, informan capacidades y no introducen APIs nativas en `domain`.

## Contrato base

La fuente tipada es `src/application/ports/platform-adapter.ts`.

- `contractVersion`: versión explícita del contrato; comienza en `1`.
- `id`: identificador estable y específico del adaptador.
- `family`: `web`, `desktop` o `mobile`.
- `capabilities`: negociación explícita; una función no se presupone por plataforma.
- `isAvailable()`: confirma si el adaptador puede utilizarse en el entorno actual.

Las capacidades iniciales son `offline-shell`, `installable`, `native-filesystem`, `native-share` y `native-window`. Declarar una capacidad no autoriza a falsificarla: cada implementación debe respaldarla con integración y pruebas.

## Límites obligatorios

1. `domain` no importa DOM, Service Worker, Capacitor, Electron, Tauri ni APIs del sistema operativo.
2. `application` define puertos neutrales; no conoce SDK concretos.
3. `infrastructure` detecta capacidades e implementa cada puerto.
4. `editor-ui` solicita capacidades mediante aplicación; no importa una envoltura nativa directamente.
5. La ausencia de un adaptador nunca impide arrancar el núcleo web.
6. Archivos, compartir, ventanas y demás funciones nativas obtendrán puertos específicos cuando su microfase defina comportamiento, errores y seguridad. Este contrato no inventa esas operaciones por adelantado.

## Estrategia por familia

| Familia | Estado | Integración permitida |
|---|---|---|
| Web/PWA | Implementada en M01.4 | Manifest, Service Worker y APIs web detectadas progresivamente |
| Desktop | Contrato preparado; no implementada | Envoltura desacoplada para Windows, macOS y Linux |
| Mobile | Contrato preparado; no implementada | Envoltura desacoplada para Android e iOS |

## Versionado

- Los cambios compatibles añaden capacidades opcionales sin cambiar significado.
- Un cambio incompatible incrementa `PLATFORM_ADAPTER_CONTRACT_VERSION` y mantiene una ruta de migración o diagnóstico.
- Un adaptador con versión no soportada se rechaza explícitamente; nunca se degrada perdiendo funciones en silencio.
