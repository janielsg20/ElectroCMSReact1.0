# UX SIMPLICITY SYSTEM — ElectroCMS

## Propósito

ElectroCMS puede tener una arquitectura interna avanzada, pero la interfaz pública debe sentirse familiar para una persona que ya ha usado WordPress, Elementor, ACF o la suite JetEngine. La complejidad técnica nunca debe ser un requisito para completar una tarea habitual.

Este documento es normativo para toda UI/UX nueva o existente.

## Modelo mental principal

La experiencia se organiza por tareas del usuario, no por módulos internos:

- **Crear**: Editor visual, páginas y plantillas.
- **Administrar**: contenido dinámico, campos, clasificaciones, entradas, relaciones, consultas, formularios, usuarios y backend.
- **Apariencia**: diseño global, temas y estilos.
- Las capacidades de exportación, seguridad, desarrollo e integración se presentan como herramientas avanzadas cuando corresponda.

Los motores internos, schemas, AST, IDs, stores, command buses, adapters, migrations y nombres de implementación no forman parte del vocabulario principal de la UI.

## Regla de divulgación progresiva

1. Mostrar primero lo mínimo necesario para completar la tarea común.
2. Aplicar valores predeterminados seguros y útiles.
3. Agrupar parámetros poco frecuentes bajo **Opciones avanzadas**.
4. No eliminar funcionalidad por simplificar la interfaz.
5. No duplicar motores ni estados para crear un “modo fácil”; la vista simple y la avanzada editan el mismo modelo canónico.
6. Una configuración avanzada solo debe aparecer en el flujo principal si es indispensable para terminar la acción.

## Ayuda contextual obligatoria

Toda opción cuyo propósito no sea obvio debe tener un control de información ElectroCMS junto a su etiqueta.

El control debe:

- funcionar por teclado, puntero y touch;
- explicar **qué hace** la opción antes de explicar cómo funciona internamente;
- incluir un ejemplo concreto cuando ayude;
- indicar la referencia funcional conocida cuando proceda;
- conservar targets táctiles de al menos 44×44 px y foco visible;
- evitar depender únicamente de `title` o de tooltips nativos del navegador.

Formato recomendado:

**Nombre de la opción** → explicación en lenguaje común → **Equivalente conocido:** plataforma / función → ejemplo opcional.

## Mapa de referencias funcionales

| ElectroCMS | Referencia familiar |
|---|---|
| Editor visual, widgets, capas, propiedades | Elementor — Editor / Navigator / Panel de propiedades |
| Páginas | WordPress — Pages |
| Plantillas Single / Archive / Header / Footer | Elementor — Theme Builder; JetThemeCore cuando aplique |
| Tipos de contenido | WordPress — Custom Post Types; JetEngine — Post Types |
| Clasificaciones | WordPress — Taxonomies; JetEngine — Taxonomies |
| Campos personalizados | ACF — Fields / Field Groups; JetEngine — Meta Fields |
| Datos dinámicos | Elementor — Dynamic Tags; JetEngine — Dynamic Field / Dynamic Data |
| Relaciones | JetEngine — Relations |
| Consultas | JetEngine — Query Builder |
| Listados | JetEngine — Listing Grid |
| Filtros | JetSmartFilters |
| Formularios | JetFormBuilder; Elementor Forms cuando haya equivalencia funcional |
| Estilos globales | Elementor — Site Settings; JetStyleManager |
| Roles y capacidades | WordPress — Roles & Capabilities |
| Backend visual | WordPress Admin + JetEngine Profile/Custom Content tooling, según función concreta |

La referencia describe el modelo mental y la función equivalente; no implica copiar código, marca visual ni comportamiento propietario de forma literal.

## Vocabulario público

Preferir:

- **Páginas** sobre “documentos” cuando se habla de contenido web visible.
- **Entradas** o **datos** sobre “records” o “registros canónicos”.
- **Qué contenido mostrar** como explicación de una consulta.
- **Dato dinámico** sobre “binding”.
- **Clasificaciones** con “Taxonomías” como término secundario cuando haga falta precisión.
- **URL amigable** sobre “slug” en el flujo básico.
- **Personalizado / Global** sobre “node / default” en propiedades.
- **Guardar / Restablecer** sobre “Apply / Reset”.

Los nombres técnicos pueden mostrarse dentro de Opciones avanzadas, diagnósticos, herramientas de desarrollo o documentación.

## Patrón para gestores complejos

Los gestores de contenido, formularios, consultas, temas y backend deben usar este orden:

1. título de tarea + frase de resultado esperado;
2. icono de información con referencia funcional;
3. lista de elementos existentes;
4. formulario o acción principal con los campos esenciales;
5. opciones avanzadas colapsadas;
6. mensajes de éxito/error en lenguaje accionable;
7. siguiente paso sugerido cuando sea útil.

## Criterios de aceptación

Una pantalla no se considera terminada si:

- obliga al usuario a conocer términos internos para completar la tarea normal;
- muestra parámetros avanzados sin necesidad en el primer nivel;
- una opción compleja carece de explicación contextual;
- la navegación se organiza según arquitectura interna en vez de intención del usuario;
- se pierde una función al simplificar la interfaz;
- el modo fácil y el avanzado escriben a modelos diferentes;
- la ayuda solo funciona con mouse;
- los textos usan nombres de fases, microfases o implementación como explicación de producto.

## Aplicación al roadmap

Esta regla es transversal y no crea una fase paralela. Cada microfase debe revisar la UX de las capacidades que toca antes de cerrar su gate. Las capacidades F00–F10 se refactorizan de forma incremental cuando se encuentren en el recorrido de una fase activa, sin romper contratos ni retroceder funcionalidad.
