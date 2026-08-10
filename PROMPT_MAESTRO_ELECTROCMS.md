# PROMPT MAESTRO — ELECTROCMS REACT

## 1. Rol y objetivo general

Actúa como arquitecto de software sénior, desarrollador experto en React, TypeScript y Tailwind CSS, diseñador de sistemas visuales no-code, especialista en CMS, WordPress, PHP, MySQL, diseño responsive y generación automática de código.

Debes diseñar y desarrollar una aplicación profesional llamada **ElectroCMS**, creada completamente en React, TypeScript y Tailwind CSS.

ElectroCMS será un CMS visual, modular y extensible que combine en una sola plataforma capacidades equivalentes a:

- WordPress.
- Elementor.
- Advanced Custom Fields — ACF.
- JetEngine.
- JetElements.
- JetFormBuilder.
- JetSmartFilters.
- JetStyleManager.
- Constructores visuales de backend.
- Gestores de contenido dinámico.
- Sistemas de plantillas y temas.
- Generadores de sitios y paneles administrativos.

La aplicación debe permitir crear visualmente:

- Sitios web.
- Páginas.
- Plantillas.
- Headers y footers.
- Sistemas de contenido dinámico.
- Custom Post Types.
- Taxonomías.
- Campos personalizados.
- Formularios.
- Filtros.
- Consultas dinámicas.
- Backends administrativos.
- Dashboards.
- Roles de usuarios.
- Sistemas de inventario.
- Directorios.
- Tiendas.
- Aplicaciones web administrables.

El sistema debe ser altamente configurable, modular, responsive, accesible y preparado para crecer sin tener que reconstruir su arquitectura principal.

---

# 2. Proyecto React adjunto como referencia

Analiza completamente todos los archivos de la aplicación React adjunta antes de comenzar el desarrollo.

La aplicación adjunta debe utilizarse como:

- Referencia visual.
- Referencia de distribución de la interfaz.
- Referencia de navegación.
- Referencia funcional.
- Referencia de modelos de datos.
- Referencia de widgets.
- Referencia del inspector.
- Referencia de los sistemas de exportación.
- Referencia del constructor de backend.
- Referencia del gestor de temas.

Debes estudiar especialmente:

- Header principal.
- Navegación lateral.
- Biblioteca de elementos.
- Navegador de capas.
- Canvas visual.
- Renderizador de nodos.
- Inspector de elementos.
- Modelos de contenido.
- Custom Post Types.
- Campos personalizados.
- Formularios.
- Filtros.
- Consultas.
- Constructor de backend.
- Gestor de themes.
- Biblioteca multimedia.
- Vista previa del frontend.
- Vista previa del backend.
- Exportador LAMP.
- Exportador de theme para WordPress.
- Exportador de plugin para WordPress.
- Persistencia local.
- Historial de cambios.
- Sistema de breakpoints.
- Temas visuales incluidos.

No debes copiar literalmente el código React de referencia ni reproducir sus limitaciones técnicas.

Debes reconstruir el sistema utilizando una arquitectura React, TypeScript y Tailwind CSS escalable y mantenible, conservando y mejorando todas las funciones útiles de la aplicación adjunta.

No elimines ninguna función existente sin documentar primero la razón y sustituirla por una solución igual o superior.

---

# 3. Requisitos no negociables

## 3.1 Funcionamiento completamente local

ElectroCMS debe trabajar al **100 % de forma local**.

La aplicación debe poder funcionar sin:

- Servidores externos.
- Servicios en la nube obligatorios.
- API externas obligatorias.
- Claves de Gemini.
- Firebase obligatorio.
- Bases de datos remotas.
- Dependencias SaaS.
- Conexión permanente a Internet.

Todos los proyectos, páginas, plantillas, configuraciones, contenidos, imágenes, temas, componentes y preferencias deben guardarse localmente.

La pérdida de conexión a Internet no debe impedir:

- Abrir proyectos.
- Crear páginas.
- Editar contenido.
- Utilizar el constructor visual.
- Gestionar el backend.
- Crear campos personalizados.
- Guardar temas.
- Previsualizar el proyecto.
- Exportar el proyecto.

Las integraciones externas futuras deben ser opcionales y desacopladas del núcleo local.

---

## 3.2 Plataformas compatibles

La arquitectura debe estar preparada para funcionar correctamente en:

- Windows mediante una envoltura de escritorio desacoplada.
- macOS mediante una envoltura de escritorio desacoplada.
- Linux mediante una envoltura de escritorio desacoplada.
- Aplicación web y PWA React.
- Android mediante una envoltura móvil desacoplada.
- iOS mediante una envoltura móvil desacoplada.
- Tablets.
- Pantallas táctiles.
- Monitores grandes.
- Equipos con resoluciones reducidas.

La experiencia principal debe optimizarse para escritorio, sin dejar de ser completamente usable en tablets y dispositivos móviles.

---

## 3.3 Diseño completamente responsive

Toda la aplicación debe ser responsive.

Esto incluye:

- Editor visual.
- Barras laterales.
- Header.
- Menús.
- Inspector.
- Biblioteca de widgets.
- Navegador de capas.
- Gestor de contenido.
- Constructor de backend.
- Dashboards.
- Modales.
- Tablas.
- Formularios.
- Paneles de configuración.
- Vista previa.
- Interfaces generadas.

La interfaz debe reorganizarse según el espacio disponible:

- En escritorio puede utilizar paneles laterales simultáneos.
- En tablet debe permitir paneles contraíbles, flotantes o mediante drawers.
- En móvil debe utilizar navegación adaptada, paneles modales y controles táctiles.
- Ninguna función importante puede desaparecer en pantallas pequeñas.
- No debe existir overflow accidental.
- Los controles deben mantener tamaños táctiles accesibles.

---

# 4. Arquitectura técnica

Construye ElectroCMS con React, TypeScript, Tailwind CSS y una arquitectura modular separada por responsabilidades.

El núcleo debe ejecutarse primero como aplicación web local-first y PWA. Las envolturas de escritorio y móvil deben permanecer desacopladas del dominio, consumir los mismos contratos y no introducir dependencias obligatorias en el núcleo. Tailwind CSS debe utilizar tokens semánticos, variantes accesibles y responsive mobile-first; no debe dispersar valores arbitrarios ni convertir las clases de utilidad en lógica de dominio.

Como mínimo, debe incluir los siguientes módulos:

1. **Core de la aplicación.**
2. **Gestión de proyectos.**
3. **Motor de documentos y nodos.**
4. **Editor visual.**
5. **Registro de widgets.**
6. **Inspector dinámico.**
7. **Motor responsive.**
8. **Motor de estilos.**
9. **Motor de temas.**
10. **Motor de plantillas.**
11. **Motor de contenido dinámico.**
12. **Custom Post Types y taxonomías.**
13. **Campos personalizados.**
14. **Consultas dinámicas.**
15. **Formularios.**
16. **Filtros inteligentes.**
17. **Constructor de backend.**
18. **Gestor de usuarios y roles.**
19. **Biblioteca multimedia.**
20. **Renderizador de frontend.**
21. **Renderizador de backend.**
22. **Sistema de vista previa.**
23. **Persistencia local.**
24. **Importación y exportación.**
25. **Generador React.**
26. **Generador LAMP.**
27. **Generador WordPress.**
28. **Historial, deshacer y rehacer.**
29. **Sistema de migraciones.**
30. **Sistema de pruebas.**

Usa una arquitectura que permita:

- Añadir widgets sin modificar el núcleo del editor.
- Añadir nuevos tipos de campo mediante registros o adaptadores.
- Crear nuevos exportadores.
- Incorporar nuevos tipos de proyecto.
- Añadir temas.
- Crear extensiones futuras.
- Versionar los modelos de datos.
- Migrar proyectos antiguos.
- Separar la interfaz del editor del código generado.

Evita archivos monolíticos, lógica duplicada y dependencias circulares.

---

# 5. Modelo de proyecto

Cada proyecto de ElectroCMS debe almacenar como mínimo:

- Identificador.
- Nombre.
- Versión.
- Metadatos.
- Configuración general.
- Tema activo.
- tema de la interfaz del editor.
- tema del frontend.
- tema del backend.
- Páginas.
- Plantillas.
- Headers.
- Footers.
- Plantillas single.
- Plantillas archive.
- Plantilla 404.
- Componentes globales.
- Widgets guardados.
- Custom Post Types.
- Taxonomías.
- Campos personalizados.
- Registros de contenido.
- Formularios.
- Acciones de formularios.
- Filtros.
- Consultas.
- Roles.
- Permisos.
- Usuarios locales cuando corresponda.
- Configuración del backend.
- Dashboards.
- Menús.
- Archivos multimedia.
- Tokens visuales.
- Estilos globales.
- Breakpoints.
- Condiciones de visualización.
- Historial.
- Información de exportación.

El formato interno debe estar versionado y soportar migraciones.

Los proyectos deben poder:

- Crearse.
- Duplicarse.
- Renombrarse.
- Archivarse.
- Eliminarse.
- Exportarse.
- Importarse.
- Recuperarse automáticamente.
- Guardarse de forma incremental.
- Reabrirse sin pérdida de información.

---

# 6. Interfaz del editor

La interfaz debe conservar el concepto general de la aplicación React adjunta, pero mejorar su funcionamiento, capacidad responsive y experiencia de usuario.

Debe incluir:

## 6.1 Header superior

- Nombre del proyecto.
- Estado de guardado.
- Navegación entre editor, preview, backend y exportación.
- Selector de página o plantilla.
- Selector de breakpoint.
- Controles de zoom.
- Deshacer.
- Rehacer.
- Tema claro, oscuro o automático.
- Selector de preset visual.
- Vista previa.
- Publicación o generación.
- Exportación.
- Indicador de funcionamiento local.

## 6.2 Navegación principal

Debe ofrecer acceso a:

- Elementos.
- Capas.
- Páginas.
- Plantillas.
- Modelos de contenido.
- Taxonomías.
- Campos personalizados.
- Registros.
- Formularios.
- Filtros.
- Consultas.
- Backend.
- Dashboards.
- Roles.
- Temas.
- Medios.
- Ajustes.
- Importación.
- Exportación.

La posición de los menús y paneles debe poder configurarse.

El usuario debe poder:

- Colocar la navegación a la izquierda o derecha.
- Contraerla.
- Cambiar su anchura.
- Reordenar secciones.
- Mostrar iconos, texto o ambos.
- Guardar espacios de trabajo personalizados.

---

# 7. Constructor visual

Crea un sistema de maquetación visual comparable a Elementor, utilizando prácticas actuales para constructores no-code.

Debe admitir:

- Drag and drop real.
- Inserción mediante clic.
- Contenedores anidados.
- Flexbox.
- CSS Grid.
- Filas.
- Columnas.
- Secciones.
- Posicionamiento relativo y absoluto.
- Reordenamiento.
- Redimensionamiento visual.
- Edición directa sobre el canvas.
- Selección múltiple.
- Copiar.
- Pegar.
- Duplicar.
- Eliminar.
- Bloquear.
- Ocultar.
- Renombrar.
- Agrupar.
- Desagrupar.
- Guardar como componente.
- Guardar como plantilla.
- Componentes globales.
- Menú contextual.
- Atajos de teclado.
- Guías.
- Reglas.
- Ajuste magnético.
- Indicadores de separación.
- Breadcrumbs de elementos anidados.
- Navegador jerárquico de capas.
- Historial de cambios.
- Deshacer y rehacer.
- Autoguardado.
- Recuperación tras cierres inesperados.

El editor debe representar con fidelidad el resultado exportado.

---

# 8. Sistema de breakpoints

Implementa como mínimo:

- Desktop.
- Laptop.
- Tablet horizontal.
- Tablet vertical.
- Móvil grande.
- Móvil pequeño.

El usuario debe poder:

- Editar el ancho de cada breakpoint.
- Crear breakpoints personalizados.
- Aplicar propiedades independientes por breakpoint.
- Heredar valores desde breakpoints superiores.
- Restablecer propiedades heredadas.
- Ocultar elementos por dispositivo.
- Cambiar orden, tamaño, alineación y espaciado por dispositivo.
- Previsualizar orientaciones horizontales y verticales.

---

# 9. Biblioteca de elementos y widgets

Todos los elementos deben ser editables mediante el inspector.

Incluye como mínimo:

## Elementos estructurales

- Sección.
- Contenedor.
- Flex container.
- Grid.
- Columnas.
- Fila.
- Stack.
- Spacer.
- Divider.
- Tabs container.
- Accordion container.
- Modal.
- Drawer.
- Off-canvas.
- Sticky container.

## Elementos básicos

- Texto.
- Título H1-H6.
- Párrafo.
- Rich text.
- Imagen.
- Galería.
- Icono.
- Botón.
- Logotipo.
- Video.
- Audio.
- HTML.
- Iframe.
- Mapa.
- Formas.
- SVG.
- Separador.
- Tabla.
- Lista.
- Código.

## Elementos de contenido

- Tarjeta.
- Artículo.
- Testimonio.
- Miembro de equipo.
- Preguntas frecuentes.
- Tabs.
- Acordeón.
- Timeline.
- Contador.
- Barra de progreso.
- Métricas.
- Tabla de precios.
- Lista de características.
- Breadcrumbs.
- Tabla de contenido.
- Carrusel.
- Slider.
- Call to action.
- Modal.
- Popup.

## Elementos dinámicos

- Campo dinámico.
- Imagen dinámica.
- Enlace dinámico.
- Repeater.
- Listing grid.
- Resultado de consulta.
- Relaciones.
- Contenido relacionado.
- Campo condicional.
- Autor.
- Fecha.
- Taxonomías.
- Metadata.
- Campos calculados.

## Comercio electrónico

- Tarjeta de producto.
- Grid de productos.
- Precio.
- Precio anterior.
- Variaciones.
- Botón de compra.
- Añadir al carrito.
- Contador del carrito.
- Inventario.
- Badge de stock.
- Wishlist.
- Checkout.
- Resumen de pedido.
- Galería de producto.
- Productos relacionados.

## Formularios

- Contenedor de formulario.
- Texto.
- Número.
- Email.
- Teléfono.
- URL.
- Textarea.
- Selector.
- Radio.
- Checkbox.
- Switch.
- Fecha.
- Hora.
- Archivo.
- Imagen.
- Repeater.
- Campos condicionales.
- CAPTCHA opcional.
- Botón de envío.
- Mensajes de estado.

## Filtros

- Búsqueda.
- Selector.
- Rango.
- Checkboxes.
- Radio.
- Fecha.
- Taxonomía.
- Ordenamiento.
- Paginación.
- Carga progresiva.
- Botón de restablecimiento.

La biblioteca debe incluir:

- Búsqueda.
- Categorías.
- Filtros.
- Favoritos.
- Elementos recientes.
- Miniaturas.
- Descripciones.
- Componentes personalizados.
- Widgets guardados.
- Drag and drop.

---

# 10. Inspector dinámico

El inspector debe adaptarse automáticamente al tipo de elemento seleccionado.

Organiza las propiedades en secciones como:

1. Contenido.
2. Estilo.
3. Layout.
4. Responsive.
5. Datos dinámicos.
6. Condiciones.
7. Animaciones.
8. Accesibilidad.
9. Avanzado.

Debe permitir editar, según el elemento:

- Texto.
- Imágenes.
- Enlaces.
- Iconos.
- Campos dinámicos.
- Fuentes de datos.
- Consultas.
- Tipografía.
- Colores.
- Fondos.
- Gradientes.
- Imágenes de fondo.
- Bordes.
- Radios.
- Sombras.
- Opacidad.
- Filtros visuales.
- Espaciado.
- Ancho.
- Altura.
- Tamaños mínimos y máximos.
- Flex.
- Grid.
- Posición.
- Z-index.
- Overflow.
- Estados hover.
- Focus.
- Active.
- Disabled.
- Transiciones.
- Animaciones.
- Visibilidad.
- CSS classes.
- Identificadores.
- Atributos.
- ARIA labels.
- Texto alternativo.
- Tab index.
- Condiciones por usuario, rol, contenido o dispositivo.

Todos los controles deben tener validación y valores predeterminados seguros.

---

# 11. Sistema de temas de la interfaz del CMS

Crea un gestor de apariencia exclusivo para la interfaz de ElectroCMS.

Estos ajustes corresponden al editor y no deben modificar automáticamente las páginas o plantillas generadas.

El usuario debe poder modificar:

- Tema claro.
- Tema oscuro.
- Tema automático.
- Colores.
- Tipografía.
- Iconos.
- Radios.
- Sombras.
- Densidad.
- Tamaño de controles.
- Apariencia de menús.
- Distribución de paneles.
- Posición de barras.
- Forma de botones.
- Forma de campos.
- Espaciado.
- Animaciones.
- Contraste.
- Diseño del workspace.

Incluye como mínimo los estilos de referencia presentes en la aplicación adjunta:

- High Density.
- Google Bento Grid.
- Minimal Clean.
- Elegant Editorial.
- Sophisticated Dark.
- SaaS Glassmorphism.
- Material Neutral.
- Neobrutalist Modern.
- Corporate Pro.

Estos estilos deben implementarse mediante tokens de diseño y no mediante valores dispersos en el código.

---

# 12. Temas para frontend y backend

El sistema debe separar claramente:

1. Tema de la interfaz del editor.
2. Tema del frontend generado.
3. Tema del backend administrativo generado.

Los tres pueden utilizar un catálogo visual similar, pero deben poder configurarse independientemente.

Las plantillas predeterminadas deben seguir sistemas visuales comparables a los estilos utilizados al generar interfaces en Google AI Studio, como:

- Bento Grid.
- Minimal Clean.
- Elegant.
- Sophisticated Dark.
- High Density.
- Material.
- Glassmorphism.
- Neobrutalism.
- Corporate.
- Editorial.
- Dashboard técnico.

Cada preset debe controlar:

- Paleta.
- Tipografía.
- Escala tipográfica.
- Espaciado.
- Radios.
- Sombras.
- Elevaciones.
- Bordes.
- Estados interactivos.
- Layout.
- Densidad.
- Componentes.
- Accesibilidad.
- Breakpoints.

El usuario debe poder modificar cualquier preset y guardarlo como un nuevo tema.

---

# 13. Gestor de themes

El gestor de themes debe guardar paquetes completos reutilizables.

Cada theme debe poder incluir:

- Diseño del frontend.
- Plantillas.
- Páginas.
- Header.
- Footer.
- Single templates.
- Archive templates.
- Plantilla 404.
- Backend.
- Dashboard.
- Custom Post Types.
- Taxonomías.
- Campos personalizados.
- Formularios.
- Filtros.
- Consultas.
- Roles.
- Menús.
- Componentes.
- Tokens.
- Medios.
- Contenido de demostración.

Debe ser posible:

- Crear un theme.
- Editarlo.
- Duplicarlo.
- Exportarlo.
- Importarlo.
- Activarlo.
- Desactivarlo.
- Previsualizarlo.
- Versionarlo.
- Instalarlo en otro proyecto.
- Aplicarlo con o sin contenido de demostración.
- Aplicarlo sin sobrescribir contenido existente.
- Seleccionar qué partes importar.

---

# 14. Motor de contenido dinámico

Implementa un sistema comparable a ACF y JetEngine.

Debe permitir crear:

## Custom Post Types

- Slug.
- Nombre singular.
- Nombre plural.
- Descripción.
- Icono.
- Capacidades.
- Soportes.
- Estado público o privado.
- Visibilidad en menús.
- Orden.
- Plantilla single.
- Plantilla archive.

## Taxonomías

- Jerárquicas.
- No jerárquicas.
- Asociadas a uno o varios tipos de contenido.
- Con campos personalizados.
- Con plantillas de archivo.

## Campos personalizados

Incluye como mínimo:

- Texto.
- Textarea.
- Rich text.
- Número.
- Moneda.
- Email.
- Teléfono.
- URL.
- Fecha.
- Hora.
- Fecha y hora.
- Color.
- Selector.
- Radio.
- Checkbox.
- Switch.
- Imagen.
- Galería.
- Archivo.
- Mapa.
- Relación.
- Usuario.
- Taxonomía.
- Repeater.
- Grupo.
- Campo calculado.
- Campo condicional.

Los campos deben admitir:

- Valor predeterminado.
- Placeholder.
- Descripción.
- Validación.
- Requerido.
- Opciones.
- Condiciones.
- Repetición.
- Relaciones.
- Visibilidad por rol.
- Organización por grupos o pestañas.

---

# 15. Consultas dinámicas

Crea un constructor visual de consultas.

Debe permitir:

- Seleccionar el tipo de contenido.
- Filtrar por estado.
- Filtrar por campo.
- Filtrar por taxonomía.
- Filtrar por autor.
- Filtrar por fecha.
- Crear condiciones AND y OR.
- Ordenar.
- Limitar resultados.
- Paginar.
- Definir offsets.
- Consultar relaciones.
- Consultar campos repetidores.
- Crear consultas guardadas.
- Asociar consultas a listings y filtros.
- Previsualizar resultados.
- Detectar consultas inválidas.

---

# 16. Formularios

Implementa un constructor visual comparable a JetFormBuilder.

Los formularios deben poder ejecutar acciones como:

- Guardar un registro.
- Crear contenido.
- Actualizar contenido.
- Registrar usuarios.
- Iniciar sesión.
- Enviar correo cuando exista configuración disponible.
- Guardar localmente.
- Redirigir.
- Mostrar mensajes.
- Ejecutar webhooks opcionales.
- Actualizar relaciones.
- Subir archivos.
- Procesar pasos múltiples.

Debe incluir:

- Validación.
- Campos condicionales.
- Formularios multipaso.
- Protección CSRF en exportaciones.
- Mensajes de error.
- Mensajes de éxito.
- Guardado de borradores.
- Mapeo visual entre campos y Custom Fields.

---

# 17. Filtros inteligentes

Implementa un sistema comparable a JetSmartFilters.

Debe permitir conectar filtros con:

- Listings.
- Grids.
- Tablas.
- Consultas.
- Productos.
- Artículos.
- Directorios.
- Contenido relacionado.

Los filtros deben poder funcionar:

- Individualmente.
- Combinados.
- En tiempo real.
- Mediante botón de aplicar.
- Mediante URL.
- Conservando su estado.
- Con paginación.
- Con contador de resultados.

---

# 18. Constructor de backend

El backend administrativo debe poder editarse visualmente utilizando el mismo motor de plantillas del frontend.

El usuario debe poder configurar:

- Header.
- Sidebar.
- Navegación.
- Dashboard.
- Tablas.
- Formularios de edición.
- Pantallas de creación.
- Pantallas de detalle.
- Calendarios.
- Kanban.
- Gráficos.
- Métricas.
- Listados.
- Filtros.
- Acciones masivas.
- Menús.
- Iconos.
- Colores.
- Roles.
- Permisos.
- Campos visibles.
- Orden de campos.
- Columnas de tablas.
- Acciones por registro.

El backend debe adaptarse al tipo de proyecto y al rol del usuario.

---

# 19. Proyectos predeterminados

Incluye backends y contenido de demostración para diferentes tipos de proyectos.

Como mínimo:

1. Tienda en línea.
2. Gestor de artículos y blog.
3. Portal inmobiliario.
4. Academia y cursos LMS.
5. Sistema de citas y reservaciones.
6. CRM y pipeline de clientes.
7. Directorio de empresas.
8. Portafolio creativo.
9. Inventario y almacén.
10. Restaurante, menú y pedidos.
11. Eventos y venta de entradas.
12. Membresías y suscripciones.
13. Marketplace.
14. Bolsa de empleo.
15. Clínica o centro de servicios.
16. Gestión de propiedades.
17. Help desk y tickets.
18. ONG y donaciones.
19. Catálogo de vehículos.
20. Estudio de tatuajes y reservas.

Cada proyecto predeterminado debe incluir:

- Custom Post Types.
- Taxonomías.
- Campos personalizados.
- Relaciones.
- Formularios.
- Consultas.
- Filtros.
- Backend.
- Dashboard.
- Roles.
- Plantillas.
- Páginas.
- Contenido de demostración.

Los presets deben poder editarse como cualquier otro proyecto.

---

# 20. Roles y permisos

Implementa un editor de roles y capacidades.

Debe permitir configurar:

- Acceso a ajustes.
- Gestión de temas.
- Gestión de contenido.
- Exportación.
- Acceso a determinados Custom Post Types.
- Creación.
- Lectura.
- Edición.
- Eliminación.
- Publicación.
- Moderación.
- Acceso a dashboards.
- Acceso a rutas personalizadas.
- Campos visibles o editables.

Incluye inicialmente:

- Administrador.
- Diseñador.
- Editor.
- Autor.
- Gestor.
- Colaborador.
- Cliente.
- Usuario registrado.

---

# 21. Biblioteca multimedia

Debe gestionar localmente:

- Imágenes.
- SVG.
- Videos.
- Audio.
- Documentos.
- Fuentes.
- Iconos.

Incluye:

- Carpetas.
- Etiquetas.
- Búsqueda.
- Filtros.
- Favoritos.
- Elementos recientes.
- Reutilización.
- Metadatos.
- Texto alternativo.
- Dimensiones.
- Tamaño.
- Optimización.
- Duplicados.
- Eliminación segura.
- Referencias de uso.

No dupliques innecesariamente archivos utilizados en varias páginas.

---

# 22. Sistemas de exportación

ElectroCMS debe exportar proyectos en cuatro modalidades principales.

## 22.1 Exportación local

Debe generar paquete portable, recursos, configuración, base de datos local, plantillas, contenido, themes, componentes, manifest, versión y recuperación; cuando sea estático podrá generar HTML/CSS/JS optimizados y, si es dinámico local, usará el motor local de datos.

## 22.2 Exportación a React

Debe generar un proyecto React completo, editable, instalable, compilable y desplegable con código modular, package.json, build reproducible, router, componentes derivados del modelo, estilos/tokens/themes/breakpoints, assets portables, formularios/filtros/queries compatibles, `.env.example`, estados y documentación. Debe diagnosticar incompatibilidades y bloquear pérdida silenciosa.

## 22.3 Exportación para servidor LAMP

Debe generar ZIP funcional para Linux/Apache/MySQL o MariaDB/PHP con frontend, backend, auth, DB/migrations, installer, router, CRUD, contenido, custom fields, forms, filters, queries, roles y assets, usando PDO, prepared statements, validación, escaping, CSRF, hashing, uploads seguros, sesiones y permisos.

## 22.4 Exportación para WordPress

No dependerá de Elementor/ACF/Jet* ni plugins externos obligatorios. Generará Theme instalable y Plugin companion para CPT, taxonomías, fields, metadata, roles, forms, queries, filters, relations, options, demo data, endpoints y admin screens con prefijos, sanitización, escaping, nonces, capabilities, migrations y uninstall seguro.

---

# 23. Correspondencia entre editor y exportación

Cada widget soportado por el editor debe tener implementaciones equivalentes para Preview React, estático, React, LAMP y WordPress. Las limitaciones por destino deben diagnosticarse y nunca producir pérdida silenciosa.

---

# 24. Accesibilidad

Cumple navegación por teclado, focus visible, contraste, lectores de pantalla, semántica, etiquetas, alt, text scaling, targets táctiles, estados equivalentes, reduced motion y mensajes comprensibles tanto en editor como en proyectos generados.

---

# 25. Rendimiento

Debe manejar proyectos grandes mediante render eficiente, lazy loading, virtualización, caché, async controlado, autosave incremental, debounce, optimización de imágenes, memoria correcta, historial limitado y separación de estado transitorio/persistente. No rerenderizar todo el canvas por cambios pequeños.

---

# 26. Seguridad e integridad

Validar imports, schema versions, migrations, backups, recovery, custom code, HTML/scripts peligrosos, routes, files, path traversal, nombres exportados e integridad de paquetes. Nunca almacenar contraseñas en texto plano.

---

# 27. Pruebas obligatorias

Probar modelos, persistencia, migraciones, undo/redo, node tree, drag/drop, inspector, breakpoints, themes, CPT, custom fields, forms, filters, queries, roles, imports/exports, responsive, accessibility e integridad de generados. Ejecutar `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` y corregir errores antes de cerrar fase.

---

# 28. Criterios de aceptación

ElectroCMS solo se considera funcional cuando cumple offline, persistencia, responsive, canvas anidado, inspector por widget, undo/redo, breakpoints, separación de themes, CPT/fields, backends, forms, filters/queries, RBAC, theme packages, reimport local, React build/deploy, LAMP instalable, WordPress theme/plugin instalables, equivalencia visual, cero funciones simuladas/botones falsos/datos falsos permanentes y todas las pruebas/lint/typecheck/build verdes.

---

# 29. Protocolo de desarrollo

Antes de código: inventario, gaps, correspondencias, arquitectura, modelos, persistencia, node engine, widget registry, exporter contracts, fases/microfases y criterios. Durante desarrollo: código real, no placeholders permanentes, no avanzar con errores, compatibilidad de proyectos, ADR, pruebas, documentación, memoria y tracking.

---

# 30. Documentación requerida

Mantener como mínimo README, Prompt Maestro, Requirements, Architecture, Data Models, Editor Engine, Widget System, Theme System, Content Engine, Backend Builder, exports, Security, Accessibility, Testing, Phases, Detailed Execution Phases, Memory, Tracking y Changelog.

---

# 31. Entregables finales

Código fuente React/TS/Tailwind, app funcional, arquitectura modular, persistencia local, editor, inspector, widgets, themes, content engine, forms, filters, queries, backend, roles, presets, exports Local/React/LAMP/WordPress, demos, tests y documentación. Prioridad: arquitectura, persistencia, editor, preview/export equivalence, exports útiles, responsive/accessibility, scalability, UX, performance y code quality.

---

## 32. Catálogo profesional de equivalencias originales

ElectroCMS debe conservar un catálogo canónico, buscable, filtrable y portable de capacidades profesionales inspirado en patrones documentados de WordPress, Elementor, ACF, JetEngine, JetElements, JetFormBuilder, JetSmartFilters, JetStyleManager, constructores visuales de backend, CMS dinámicos, sistemas de plantillas y generadores de sitios.

Debe cubrir núcleo CMS, editor Flex/Grid responsive, widgets, campos avanzados, relaciones, listings, queries, forms, filters, theme builder, backend CRUD/views/automation/audit y generador por blueprint. Las referencias describen capacidades y nunca autorizan copiar código, identidad, textos, activos ni composición propietaria. La demo distingue `Demo interactiva`, `Modelado portable` y `Planificado`; `professionalStudio` acompaña Local/React/LAMP/WordPress. Matriz detallada: `PROFESSIONAL_CAPABILITY_GAP_MATRIX.md`.

## 33. Proyecto tienda demo editable como prueba de exportación

Preview, Backend y Centro de publicación operan sobre un único proyecto demo de tienda. Identidad, claim, colores, producto destacado y dashboard comparten estado. Local, React, LAMP y WordPress reciben el mismo estado editado y producen storefront/backend funcional. Contrato: `EDITABLE_DEMO_EXPORT_PROJECT.md`.

---

# 34. Ampliación funcional tipo FlutterFlow — alcance normativo aditivo

ElectroCMS debe incluir progresivamente las categorías funcionales y flujos profesionales de un visual application builder comparable a FlutterFlow, implementados con arquitectura, código, identidad y UX propias de ElectroCMS.

Esta sección es **aditiva y no destructiva**:

- no reemplaza las secciones 1–33;
- no renumera ni reabre F00–F18;
- no cambia la microfase activa por su sola incorporación;
- no obliga a servicios cloud ni rompe local-first;
- no autoriza copiar código, branding, textos, assets o composición propietaria;
- las integraciones externas son adapters/providers opcionales;
- capacidades ya existentes se auditan y amplían en lugar de duplicarse.

El alcance detallado y normativo completo de esta sección vive en `FLUTTERFLOW_PARITY_ADDENDUM.md`, que **forma parte integral de este Prompt Maestro** y debe tratarse con la misma prioridad normativa que las secciones anteriores.

Como mínimo, la ampliación cubre:

1. Builder organizado en Navigation System, Toolbar, Canvas y Properties Panel, conservando ventanas docked/floating/minimized/pinned y resize.
2. Page Manager, Page Selector, Widget Palette y Widget Tree sincronizados.
3. Selection Manager central: Canvas ↔ Tree ↔ Inspector ↔ Breadcrumbs.
4. Canvas avanzado con zoom/pan/fit, rulers, guides, snapping, safe areas, viewports y direct manipulation.
5. Responsive Builder con inherit/override/reset por breakpoint.
6. Component System con parameters, callbacks, slots, variants, state, lifecycle y Component Studio.
7. Design System Manager con tokens globales y component variants.
8. Custom Data Types, Enums y Constants.
9. Widget/Component/Page/App/Session/Persistent State.
10. Set From Variable universal y Conditional Value Builder.
11. Action Flow Editor con triggers, acciones, branches, loops, outputs, errors y Action Graph.
12. App Events/Event Bus visual.
13. DataProvider desacoplado, Database Builder, relaciones y Backend Queries.
14. API Manager, API Groups, API Tester y Response Mapping.
15. AuthProvider, sessions, protected routes, RBAC, permissions/capabilities y secrets.
16. Media Manager ampliado.
17. Route Manager, deep links y Storyboard.
18. Animation Inspector, Localization, Accessibility Audit y SEO.
19. Test Mode, Debug Console, State Inspector, tracing y Automated Tests.
20. Custom Functions, Custom Actions, Custom Components y Code Files con editor/diagnostics/sandbox.
21. Dependency Manager, Environments, backend functions e Integration Manager.
22. AI Builder y Agents cuyos cambios se expresan como comandos validados y reversibles.
23. Command Palette/búsqueda universal.
24. Named Versions, checkpoints, restore, branching lógico, comments y colaboración opcional.
25. Project Settings, export ampliado, Deployment Center y validación pre-deploy.
26. Experiencia móvil específica: Topbar compacta + Canvas dominante + `Widgets / Pages / Canvas / Properties / More` + tool sheets.
27. Tablet con rail compacto, canvas y panel contextual.
28. High Density + Minimal Clean + Enterprise/IDE-like como lenguaje visual del builder.

Toda capacidad ausente se registra como `PARITY_GAP` con estado, módulo, prioridad, dependencia, fase, arquitectura, criterios de aceptación y pruebas. No se implementa improvisadamente fuera de fase.

Las fases propietarias de esta ampliación son F19–F31 en `PHASES.md`, con microfases M19.1–M31.8 en `DETAILED_EXECUTION_PHASES.md`. La fase activa continúa definida exclusivamente por `TRACKING.md`.

Criterio final ampliado: un usuario debe poder crear proyecto, design system, páginas/rutas, widgets, componentes, estados, modelos/relaciones, queries, APIs, auth/RBAC, Action Flow, responsive, backend, tests/debug, custom code opcional, AI opcional, exportar y desplegar, manteniendo local-first, accesibilidad, responsive, seguridad, High Density y Minimal Clean.
