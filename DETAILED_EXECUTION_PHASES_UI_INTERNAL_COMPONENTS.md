# DETAILED EXECUTION PHASES — UI interna cross-platform

Este documento es un complemento normativo de `DETAILED_EXECUTION_PHASES.md` y operacionaliza la **Sección 35 del Prompt Maestro**, definida en `UI_INTERNAL_COMPONENT_POLICY.md`.

No crea una segunda secuencia de desarrollo ni cambia la microfase activa. Añade criterios obligatorios a las microfases existentes cuando introduzcan o modifiquen controles interactivos.

Formato: `microfase → obligación → evidencia mínima`.

## Regla transversal inmediata

Desde la incorporación de esta política, toda microfase con impacto UI debe verificar:

1. ¿Existe `<select>`, `<datalist>`, `input[type="color"]`, date/time picker nativo, `alert/confirm/prompt`, context menu nativo o tooltip basado solo en `title`?
2. Si existe, ¿es una excepción real de plataforma/seguridad o debe sustituirse por un primitive interno?
3. ¿El componente interno hereda theme/preset/density y se adapta a desktop/tablet/móvil?
4. ¿Tiene teclado, lector de pantalla, touch, Escape/focus restore y collision handling correctos?
5. ¿Hay test que impida regresión hacia UI nativa?

Una microfase visual no puede considerarse completa si deja UI nativa no autorizada en el flujo principal.

---

## F01 — Plataforma React/Tailwind y primitives

### M01.3 — Tokens y primitives — ampliación obligatoria

Implementar o consolidar primitives internos reutilizables para:

- `Listbox/Select`.
- `Combobox/Autocomplete`.
- `DropdownMenu`.
- `ContextMenu`.
- `Popover`.
- `Tooltip`.
- `Dialog/AlertDialog`.
- `Drawer/BottomSheet`.
- `ColorPicker`.
- `DatePicker/TimePicker/DateTimePicker`.
- `MediaPicker`.
- `IconPicker`.
- `TokenPicker/VariablePicker`.

Criterios:

- tokens semánticos;
- light/dark/system;
- portales y escala z-index;
- collision detection/reposition;
- ARIA APG correcto;
- keyboard y touch;
- focus visible/restore;
- reduced motion;
- tests unitarios y de interacción.

Evidencia: primitives compartidos o `PARITY_GAP`/deuda explícita si la microfase histórica ya estaba cerrada antes de esta regla.

---

## F04 — Shell, navegación y workspace

### M04.2 / M04.3 — Tablet y móvil — criterio añadido

- Los controles temporales deben ser overlays/sheets internos, nunca pickers del sistema.
- En móvil, un selector del editor puede transformarse en bottom sheet/full-screen picker interno.
- Safe areas, scroll interno y focus restore son obligatorios.

### M04.4 — Navegación y shortcuts — criterio añadido

- Command Palette, breadcrumbs y menús de navegación usan primitives internos.
- No depender de context menus nativos ni tooltips `title` para descubrir acciones esenciales.

### M04.5 — Temas — criterio añadido

- Todo menú/picker interno debe reaccionar al preset visual y a Claro/Oscuro/Automático.
- Theme switching no puede dejar portales/popovers con tokens del tema anterior.

---

## F05 — Motor de documentos, nodos y canvas

### M05.3 — Drag/drop y alternativas accesibles — ampliación obligatoria

- Los menús `Mover a / Antes de / Después de` deben ser `Menu/Listbox/Dialog` internos de ElectroCMS.
- Long-press en touch abre un menú/sheet interno, no el menú contextual del navegador/OS.
- Drag no puede ser la única vía; las mismas acciones existen por botón/teclado.
- Cancelación con Escape y restauración de foco.
- Si se intercepta `contextmenu`, hacerlo solo en superficies con equivalente interno completo.

Pruebas: mouse/pointer, touch, keyboard y `contextmenu`.

### M05.4 — Direct manipulation — ampliación obligatoria

- ContextMenu del Canvas es interno y temático.
- Menús de alineación, snapping, guías, distribución y acciones de selección usan primitives internos.
- No bloquear menú nativo fuera de la superficie donde ElectroCMS ofrece equivalente.

---

## F06 — Registro de widgets y biblioteca

### M06.5 — UX de biblioteca — ampliación obligatoria

- Categorías, filtros, favoritos y acciones de widget usan Combobox/Listbox/Dropdown internos.
- Inserción por clic/drag mantiene alternativas accesibles.
- Tooltips y previews usan componentes internos, no `title` como UI final.

---

## F07 — Inspector, estilos y responsive

### M07.1 — Inspector generado por schema — ampliación obligatoria

El schema del Inspector debe mapear tipos de propiedad a primitives internos. Ejemplos:

- enum → Listbox/Select interno;
- búsqueda/relación → Combobox interno;
- boolean → Switch/Checkbox interno;
- color → ColorPicker interno;
- fecha/hora → Date/Time Picker interno;
- asset → MediaPicker interno;
- icono → IconPicker interno;
- token/variable/binding → TokenPicker/VariablePicker interno;
- acciones múltiples → Dropdown/Popover/Dialog interno.

### M07.2 — Controles y validación — ampliación obligatoria

Esta microfase es **propietaria principal de la migración del Inspector**.

- Prohibido dejar `<select>` nativo como control final de propiedades.
- Prohibido `input[type="color"]`, date/time picker nativo y `<datalist>` como experiencia principal.
- Todos los controles deben soportar defaults, reset, error, disabled y history.
- Mobile Inspector usa sheet/picker interno adaptativo.
- Crear test estático/regresión que detecte controles nativos prohibidos dentro de `src/editor-ui/` salvo allowlist documentada.

### M07.4 — Breakpoints — criterio añadido

Selector de breakpoint/orientación interno y consistente con el shell; no picker nativo.

### M07.5 — Datos, condiciones y accesibilidad — criterio añadido

Variable/binding/role/condition pickers son internos, buscables y accesibles.

---

## F08 — Temas y Design System

### M08.1 / M08.2 — criterio añadido

- Menús, listboxes, dialogs, popovers, pickers y sheets forman parte de cada preset visual.
- Tokens de overlay, selected, hover, focus, disabled, danger, backdrop y elevation deben ser semánticos.

---

## F09 — Contenido dinámico y custom fields

### M09.3 — Campos personalizados — criterio añadido

El builder que configura tipos de campo usa primitives internos. Los campos generados por ElectroCMS deben seguir la misma política visual salvo configuración explícita del proyecto.

- Selector/Radio/Checkbox/Switch: componentes del Design System generado.
- Fecha/Hora/Color/Relación/Usuario/Taxonomía: pickers internos.
- Archivo/Imagen: MediaPicker interno + acción explícita `Importar desde dispositivo` como única frontera nativa permitida.

---

## F10 — Consultas, listings y filtros

### M10.2 — Constructor visual — criterio añadido

Field/operator/value/query pickers internos; no selects nativos del OS.

### M10.4 — Filtros inteligentes — criterio añadido

Los filtros visuales generados deben conservar theme y responsive. Select/date/range/autocomplete no pueden depender de un menú nativo si ElectroCMS genera un equivalente interno.

---

## F11 — Formularios

### M11.1 — Builder y campos — criterio añadido

- La biblioteca/inspector del builder usa primitives internos.
- Los formularios generados usan controles ElectroCMS consistentes con el theme del proyecto.
- File input nativo puede existir únicamente detrás de una acción de carga/importación cuando sea necesario por sandbox.

### M11.2 — Validación — criterio añadido

Mensajes, error popovers y confirmaciones usan UI interna; no `alert()`.

---

## F12 — Backend visual

### M12.1 / M12.2 — criterio añadido

- Menús de tablas, bulk actions, saved views, filtros, CRUD y acciones por registro son internos.
- Confirmaciones destructivas usan `AlertDialog` interno.
- Context menus tienen alternativa visible y teclado.

---

## F13 — Media

### M13.1 — Biblioteca multimedia — criterio añadido

- `MediaPicker` interno es la experiencia principal.
- Selector nativo de archivos/carpetas solo desde `Importar desde dispositivo` / `Importar carpeta` cuando lo permita/exija plataforma.
- Una vez importado, buscar, filtrar, seleccionar, reemplazar y reutilizar ocurre dentro de ElectroCMS.

---

## F14–F16 — Preview y exportadores

### Criterio añadido

- Preview y output generado deben conservar el contrato visual de menús/pickers cuando corresponda.
- Diagnosticar si un destino no puede reproducir un componente interno con equivalencia suficiente.
- No reemplazar silenciosamente un componente ElectroCMS por un `<select>`/picker nativo si cambia el UX definido por el proyecto.

---

## F17 — Seguridad, accesibilidad y rendimiento transversal

### M17.2 — Auditoría WCAG 2.2 AA — ampliación obligatoria

Auditar todos los primitives internos que sustituyen controles nativos:

- roles/ARIA;
- keyboard completo;
- typeahead;
- focus trap donde aplique;
- focus restore;
- reflow;
- zoom;
- touch targets;
- contraste;
- reduced motion;
- lector de pantalla.

### M17.5 — Auditoría de UI interna cross-platform — NUEVA MICROFASE

Entrada: aplicación acumulada + `UI_INTERNAL_COMPONENT_POLICY.md`.

Trabajo:

1. Inventariar `<select>`, `<datalist>`, inputs color/date/time/datetime, `alert/confirm/prompt`, listeners/context menus y usos de `title` en UI.
2. Clasificar cada aparición como:
   - `INTERNAL_COMPONENT_OK`;
   - `NATIVE_EXCEPTION_ALLOWED`;
   - `NATIVE_UI_VIOLATION`;
   - `NOT_USER_FACING`.
3. Crear allowlist mínima y documentada para fronteras nativas autorizadas.
4. Sustituir todas las violaciones de fase base por primitives internos.
5. Verificar Windows/web desktop, Android/mobile viewport y al menos una ruta tablet.
6. Añadir test estático que falle ante nuevas apariciones prohibidas fuera de allowlist.
7. Añadir tests browser de Select/Combobox/Dialog/ContextMenu/Color-Date-Media Picker representativos.

Salida:

- cero `NATIVE_UI_VIOLATION` en rutas críticas;
- allowlist revisable de excepciones;
- evidencia de teclado/touch;
- screenshots/interaction tests por breakpoint cuando la infraestructura browser esté disponible.

---

## F18 — Aceptación y entrega base

### M18.1 — Matriz de pruebas — criterio añadido

Añadir categoría `Internal UI / no-native chrome` a la matriz obligatoria.

### M18.2 — Criterios de aceptación — criterio añadido

No aceptar la release base si cambiar propiedades, filtros o acciones críticas invoca un picker visual nativo no autorizado.

### M18.5 — Release candidate — criterio añadido

Gate: cero violaciones de `UI_INTERNAL_COMPONENT_POLICY.md` en el inventario automatizado.

---

# AMPLIACIÓN F19–F31

## F19 — Visual Builder avanzado

### M19.4 — Widget Tree profesional — criterio añadido

- ContextMenu/acciones de nodo internos.
- Rename/visibility/lock/reorder usan controls internos y alternativas de teclado.

### M19.7 — Builder móvil/tablet — ampliación obligatoria

- Todos los pickers de Widgets/Pages/Properties/More usan sheets/pickers internos.
- Ninguna propiedad abre select/date/color picker visual nativo del OS.

### M19.8 — Puerta G6-A — criterio añadido

- Ejecutar auditoría no-native en builder desktop/tablet/mobile.

## F20 — Component System / Design System

### M20.4 — Design System Manager — ampliación obligatoria

El Design System Manager debe registrar estilos/tokens y variantes para:

- listbox/combobox/menu;
- tooltip/popover;
- dialog/sheet/drawer;
- color/date/time/media/icon/token pickers;
- estados selected/focus/disabled/error/loading;
- overlays/backdrops/elevation.

## F21 — Variables y condiciones

### M21.5 / M21.6 — criterio añadido

Set From Variable y Conditional Value Builder usan pickers internos buscables, no selects nativos.

## F22 — Action Flow

### M22.3 / M22.6 — criterio añadido

Action picker, trigger picker, node menus y graph context menu son internos y accesibles.

## F23 — Database Builder

### M23.3 / M23.5 — criterio añadido

Field type, relation, operator, sort y query pickers internos.

## F24 — API Manager

### M24.2 / M24.4 — criterio añadido

Method/auth/type/mapping pickers internos; secretos nunca se exponen en tooltips o OS UI innecesaria.

## F25 — Auth/RBAC

### M25.4 — criterio añadido

Roles/capabilities/permission pickers internos y buscables.

## F26 — Media, routing y localization

### M26.1 — Media Manager ampliado — criterio añadido

MediaPicker interno primero; file/folder dialog nativo solo en frontera de importación.

### Resto de F26

Route/locale/breakpoint/animation/SEO selectors internos.

## F28 — Test Mode/Debug

Añadir detector visible de `NATIVE_UI_VIOLATION` cuando un componente registrado declare una implementación prohibida.

## F30 — AI Builder y Command Palette

Los menús de comandos, acciones propuestas y confirmación de cambios usan Dialog/Listbox/Command internos.

## F31 — Export/Deployment

Pre-deploy validation debe incluir `nativeUiPolicy` por destino cuando el output generado use el Design System de ElectroCMS.

---

# Allowlist inicial de excepciones

Las siguientes categorías pueden invocar UI nativa, únicamente desde un trigger interno y cuando la plataforma lo requiera:

- `file-open` / `folder-open` / `save-as` del sistema;
- permisos de cámara, micrófono, ubicación, notificaciones o almacenamiento;
- biometría/passkeys/secure auth del sistema;
- share sheet;
- print dialog;
- instalación PWA/app;
- superficies protegidas por sandbox que no puedan reproducirse de forma segura.

Toda nueva excepción requiere actualizar `UI_INTERNAL_COMPONENT_POLICY.md`, `RULES.md` y la allowlist de tests.

# Gate de no regresión

A partir de esta política, toda PR con cambios en UI debe responder en revisión:

- ¿Introduce o conserva UI nativa no autorizada?
- ¿Reutiliza un primitive interno existente antes de crear uno nuevo?
- ¿Funciona con teclado/touch/screen reader?
- ¿Se adapta a desktop/tablet/móvil?
- ¿Respeta el preset y color mode activos?
- ¿Tiene test o evidencia proporcional al riesgo?
