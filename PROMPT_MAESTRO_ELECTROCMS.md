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

Debe generar:

- Paquete portable del proyecto.
- Recursos multimedia.
- Configuración.
- Base de datos local.
- Plantillas.
- Contenido.
- Themes.
- Componentes.
- Archivo de manifiesto.
- Información de versión.
- Copia de recuperación.

También debe permitir generar una versión local ejecutable o previsualizable sin conexión.

Cuando el proyecto sea completamente estático, debe poder generar HTML, CSS y JavaScript optimizados.

Cuando requiera contenido dinámico local, debe utilizar el motor local de datos de ElectroCMS.

## 22.2 Exportación a React

Debe generar un proyecto React completo, editable y listo para instalar, ejecutar, compilar y desplegar.

El paquete React debe incluir como mínimo:

- Código fuente organizado por módulos y componentes.
- `package.json` con versiones de dependencias compatibles y scripts documentados.
- Configuración de build reproducible.
- Punto de entrada de la aplicación.
- Router y rutas correspondientes a páginas, templates y contenido generado.
- Componentes React derivados del modelo canónico y del árbol de nodos.
- Estilos, tokens, themes y breakpoints equivalentes al preview.
- Assets locales y referencias portables, sin depender de URLs temporales.
- Formularios, filtros, consultas y contenido dinámico compatibles con el destino.
- Configuración de variables de entorno mediante archivos de ejemplo, sin incluir secretos.
- Manejo de estados normal, vacío, carga, error, disabled y permisos cuando aplique.
- Instrucciones para instalación, desarrollo, build, preview y despliegue.

La exportación React debe permitir:

- Ejecutar el proyecto localmente mediante un servidor de desarrollo.
- Generar una build optimizada para producción.
- Servir la build en hosting estático, CDN o servidores web como Apache y Nginx.
- Configurar correctamente rutas directas y fallback de una SPA cuando corresponda.
- Elegir salida estática, SPA o aplicación con adaptadores de datos según las capacidades utilizadas.
- Volver a generar el proyecto de forma determinista sin modificar el proyecto fuente de ElectroCMS.

El código generado debe ser legible, mantenible y ampliable. No debe depender de servicios externos obligatorios ni incluir datos falsos permanentes, claves, tokens o secretos. Cuando una capacidad no pueda representarse con fidelidad en React, ElectroCMS debe diagnosticarla antes de exportar y bloquear cualquier pérdida silenciosa.

## 22.3 Exportación para servidor LAMP

Debe generar un archivo ZIP completamente funcional para:

- Linux.
- Apache.
- MySQL o MariaDB.
- PHP.

El paquete debe incluir:

- Frontend.
- Backend administrativo.
- Sistema de autenticación.
- Base de datos.
- Migraciones.
- Archivo de configuración.
- Instalador.
- Router.
- CRUD.
- Gestión de contenido.
- Custom Fields.
- Formularios.
- Filtros.
- Consultas.
- Roles.
- Assets.
- CSS.
- JavaScript necesario.
- Instrucciones de instalación.

La exportación debe utilizar:

- Consultas preparadas.
- PDO.
- Validación de datos.
- Escape de salida.
- Protección CSRF.
- Hash seguro de contraseñas.
- Validación de archivos.
- Control de sesiones.
- Control de permisos.

No debe generar únicamente una demostración visual. El backend exportado debe ser funcional.

## 22.4 Exportación para WordPress

La exportación para WordPress no debe depender de:

- Elementor.
- ACF.
- JetEngine.
- JetElements.
- JetFormBuilder.
- JetSmartFilters.
- Plugins externos obligatorios.

Debe generar dos archivos separados:

### A. Theme de WordPress

Debe incluir:

- style.css.
- functions.php.
- index.php.
- header.php.
- footer.php.
- page.php.
- single.php.
- archive.php.
- 404.php.
- Plantillas personalizadas.
- Assets.
- Estilos responsive.
- Componentes del frontend.
- Configuración visual.
- Templates creados en ElectroCMS.

### B. Plugin companion de ElectroCMS

Debe registrar y administrar mediante APIs nativas de WordPress:

- Custom Post Types.
- Taxonomías.
- Campos personalizados.
- Metadata.
- Roles.
- Capacidades.
- Formularios.
- Consultas.
- Filtros.
- Relaciones.
- Opciones.
- Datos de demostración.
- Funciones requeridas por el backend.
- Endpoints necesarios.
- Pantallas administrativas.

El plugin generado debe incluir:

- Prefijos únicos.
- Sanitización.
- Escape.
- Nonces.
- Comprobación de capacidades.
- Activación.
- Desactivación.
- Migraciones.
- Desinstalación segura.
- Compatibilidad con la base de datos nativa de WordPress.

El theme y el plugin deben poder instalarse directamente desde el panel de WordPress.

---

# 23. Correspondencia entre editor y exportación

Cada widget soportado por el editor debe tener implementaciones equivalentes para:

- Preview React.
- Exportación estática.
- Exportación React.
- Exportación LAMP.
- Exportación WordPress.

No se considera terminado un widget si solo funciona dentro del editor.

Cuando una función no sea compatible con un destino específico, el sistema debe:

- Informarlo claramente.
- Explicar la limitación.
- Ofrecer una alternativa.
- Impedir exportaciones silenciosamente incompletas.

---

# 24. Accesibilidad

Cumple buenas prácticas de accesibilidad:

- Navegación por teclado.
- Focus visible.
- Contraste suficiente.
- Lectores de pantalla.
- Semántica.
- Etiquetas descriptivas.
- Texto alternativo.
- Escalado de texto.
- Controles táctiles adecuados.
- Estados hover y focus equivalentes.
- Reducción de movimiento.
- Mensajes de error comprensibles.

La accesibilidad debe aplicarse tanto al editor como a los proyectos generados.

---

# 25. Rendimiento

La aplicación debe poder manejar proyectos grandes sin bloquear la interfaz.

Implementa:

- Renderizado eficiente.
- Carga diferida.
- Virtualización de listas extensas.
- Caché.
- Operaciones asíncronas controladas.
- Guardado incremental.
- Debounce en propiedades.
- Optimización de imágenes.
- Gestión correcta de memoria.
- Historial con límites configurables.
- Separación entre estado transitorio y persistente.

No reconstruyas todo el canvas por cada modificación pequeña.

---

# 26. Seguridad e integridad

Implementa:

- Validación de proyectos importados.
- Control de versiones del esquema.
- Migraciones.
- Copias de seguridad.
- Recuperación automática.
- Sanitización de código personalizado.
- Advertencias para HTML o scripts peligrosos.
- Validación de rutas.
- Protección contra archivos maliciosos.
- Prevención de path traversal.
- Nombres seguros para archivos exportados.
- Comprobación de integridad de paquetes.

Nunca almacenes contraseñas en texto plano.

---

# 27. Pruebas obligatorias

Crea pruebas para:

- Modelos de datos.
- Persistencia.
- Migraciones.
- Undo y redo.
- Árbol de nodos.
- Drag and drop.
- Inspector.
- Breakpoints.
- Themes.
- Custom Post Types.
- Custom Fields.
- Formularios.
- Filtros.
- Consultas.
- Roles.
- Importación.
- Exportación local.
- Exportación React.
- Exportación LAMP.
- Exportación WordPress.
- Responsive.
- Accesibilidad.
- Integridad de archivos generados.

Ejecuta obligatoriamente:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

Corrige todos los errores antes de considerar completada una fase.

No ignores warnings importantes.

---

# 28. Criterios de aceptación

ElectroCMS solo puede considerarse funcional cuando:

1. Trabaja sin conexión.
2. Los proyectos persisten después de cerrar la aplicación.
3. El editor es responsive.
4. El canvas permite crear y editar estructuras anidadas.
5. Todos los widgets poseen inspector.
6. El undo y redo funciona correctamente.
7. Los breakpoints guardan propiedades independientes.
8. Los themes del editor están separados de los themes generados.
9. Los Custom Post Types y campos personalizados funcionan.
10. Los backends predeterminados pueden editarse.
11. Los formularios guardan o procesan datos.
12. Los filtros se conectan a consultas.
13. Los roles limitan correctamente el acceso.
14. Los themes guardan diseño y contenido de demostración.
15. La exportación local puede reimportarse.
16. El proyecto React exportado puede instalarse, ejecutarse localmente, compilarse y desplegarse en un servidor web.
17. El paquete LAMP puede instalarse y utilizarse.
18. El theme de WordPress puede instalarse.
19. El plugin de WordPress puede instalarse sin plugins externos.
20. El resultado exportado coincide visualmente con el preview.
21. No existen funciones simuladas presentadas como terminadas.
22. No existen botones sin implementación.
23. No existen pantallas principales con datos falsos permanentes.
24. Todas las pruebas pasan.
25. El lint, el typecheck y la compilación de producción no presentan errores.

---

# 29. Protocolo de desarrollo

Antes de escribir código:

1. Lee completamente la aplicación React adjunta.
2. Crea un inventario de sus funciones.
3. Identifica limitaciones y funcionalidades incompletas.
4. Crea una tabla de correspondencia React de referencia → arquitectura React objetivo.
5. Define la arquitectura.
6. Define los modelos de datos.
7. Define el sistema de persistencia.
8. Define el motor de nodos.
9. Define el registro de widgets.
10. Define los contratos de los exportadores.
11. Divide el desarrollo en fases y microfases.
12. Establece criterios de validación para cada fase.

Durante el desarrollo:

- Implementa código real.
- No sustituyas funciones complejas por simples placeholders.
- No avances a una fase posterior con errores pendientes.
- Mantén compatibilidad con proyectos guardados.
- Documenta decisiones arquitectónicas.
- Añade pruebas junto con cada módulo.
- Actualiza la documentación después de cada fase.
- Conserva una memoria técnica del proyecto.
- Registra progreso, decisiones, errores conocidos y tareas pendientes.

---

# 30. Documentación requerida

Crea y mantén como mínimo:

- `README.md`
- `PROMPT_MAESTRO_ELECTROCMS.md`
- `REQUIREMENTS.md`
- `ARCHITECTURE.md`
- `DATA_MODELS.md`
- `EDITOR_ENGINE.md`
- `WIDGET_SYSTEM.md`
- `THEME_SYSTEM.md`
- `CONTENT_ENGINE.md`
- `BACKEND_BUILDER.md`
- `EXPORT_LOCAL.md`
- `EXPORT_REACT.md`
- `EXPORT_LAMP.md`
- `EXPORT_WORDPRESS.md`
- `SECURITY.md`
- `ACCESSIBILITY.md`
- `TESTING.md`
- `PHASES.md`
- `DETAILED_EXECUTION_PHASES.md`
- `MEMORY.md`
- `TRACKING.md`
- `CHANGELOG.md`

---

# 31. Entregables finales

Entrega:

- Código fuente completo en React, TypeScript y Tailwind CSS.
- Aplicación funcional.
- Arquitectura modular.
- Persistencia local.
- Editor visual.
- Inspector.
- Biblioteca de widgets.
- Gestor de themes.
- Motor de contenido.
- Constructor de formularios.
- Constructor de filtros.
- Constructor de consultas.
- Constructor de backend.
- Roles y permisos.
- Presets de proyecto.
- Exportador local.
- Exportador React.
- Exportador LAMP.
- Exportador WordPress.
- Proyectos de demostración.
- Pruebas.
- Documentación.
- Instrucciones de instalación.
- Instrucciones de compilación.
- Instrucciones de exportación.

El resultado debe ser una base profesional y extensible, no una demostración superficial.

La prioridad debe ser:

1. Arquitectura correcta.
2. Persistencia confiable.
3. Editor funcional.
4. Correspondencia entre preview y exportación.
5. Exportaciones realmente utilizables.
6. Responsive y accesibilidad.
7. Escalabilidad.
8. Experiencia de usuario.
9. Rendimiento.
10. Calidad del código.

---

## 32. Catálogo profesional de equivalencias originales

ElectroCMS debe conservar un catálogo canónico, buscable, filtrable y portable de capacidades profesionales inspirado en patrones documentados de WordPress, Elementor, ACF, JetEngine, JetElements, JetFormBuilder, JetSmartFilters, JetStyleManager, constructores visuales de backend, CMS dinámicos, sistemas de plantillas y generadores de sitios.

El producto debe cubrir como mínimo:

- núcleo CMS con tipos, taxonomías, workflow, revisiones, media, roles, API e importación/exportación;
- editor Flex/Grid, responsive, capas, historial, componentes reutilizables, movimiento y accesibilidad;
- widgets de contenido, media, negocio, datos, navegación, social, comercio y salida dinámica;
- campos avanzados, repetidores, contenido flexible, reglas de ubicación, condiciones y opciones globales;
- tablas propias, relaciones 1:1/1:N/N:N, listings, etiquetas dinámicas, perfiles, data stores, mapas y calendarios;
- consultas multifuente, relaciones, merge, preview, diagnóstico, caché y bindings;
- formularios multipaso, condiciones, cálculo, repetidores, acciones, registros y edición frontend;
- filtros facetados, búsqueda, orden, AJAX/mixto/recarga, indexador, chips, URL y jerarquía;
- theme builder, condiciones de visualización, estilos globales y responsive, variaciones, kits y bloqueo;
- backend con CRUD, tablas, quick edit, bulk actions, saved views, kanban, calendario, dashboards, automatización y auditoría;
- generador de sitios basado en blueprint con datos demo, kit visual y adaptación por destino.

Regla no negociable: las referencias de terceros describen capacidades, nunca autorizan copiar código, identidad, textos, activos ni composición propietaria. Cada equivalente debe usar lenguaje, arquitectura, diseño e interacción originales de ElectroCMS.

La demo debe distinguir `Demo interactiva`, `Modelado portable` y `Planificado`. El manifiesto `professionalStudio` debe acompañar Local, React, LAMP y WordPress para preservar modelos, relaciones, operaciones, plantillas y pantallas administrativas. La matriz detallada y sus fuentes oficiales están en `PROFESSIONAL_CAPABILITY_GAP_MATRIX.md`.

## 33. Proyecto tienda demo editable como prueba de exportación

La Preview, el Backend y el Centro de publicación deben operar sobre un único
proyecto demo de tienda. La edición básica debe permitir cambiar identidad,
claim, colores, producto destacado y configuración principal del dashboard.
Cambiar de workspace no puede restaurar valores por defecto ni crear una copia
independiente.

Cada exportación debe recibir el estado editado y producir storefront y backend:

- Local: tienda y administrador offline enlazados mediante almacenamiento local;
- React: aplicación y ruta administrativa funcional;
- LAMP: frontend, instalación, autenticación y CRUD persistente;
- WordPress: tema, plugin companion, contenido inicial y menú administrativo.

El proyecto se diseña con las reglas de `ui-ux-pro-max`, accesibilidad AA,
responsive y reducción de movimiento. Su contrato completo está documentado en
`EDITABLE_DEMO_EXPORT_PROJECT.md`.

---

# 34. Ampliación funcional tipo FlutterFlow — alcance normativo aditivo

ElectroCMS debe evolucionar además hasta cubrir las categorías funcionales, flujos y capacidades de un visual application builder profesional comparable a FlutterFlow, implementados mediante arquitectura, código, identidad visual y UX propias de ElectroCMS.

Esta ampliación es no destructiva:

- no reemplaza ni reduce las secciones 1–33;
- no renumera ni reabre F00–F18;
- no cambia la microfase activa por su sola incorporación documental;
- no elimina local-first ni convierte servicios externos en obligatorios;
- no autoriza copiar código, branding, textos, activos o composición propietaria;
- toda integración externa debe ser un adapter/provider opcional;
- una capacidad existente se amplía y consolida; no se crea una implementación paralela.

El documento `FLUTTERFLOW_PARITY_ADDENDUM.md` forma parte integral de este Prompt Maestro y contiene el detalle normativo completo de esta sección.

La ampliación debe cubrir como mínimo:

1. Builder estructurado en Navigation System, Toolbar, Canvas y Properties Panel, manteniendo ventanas docked/floating/minimized/pinned, snap y resize.
2. Page Manager, Page Selector, Widget Palette y Widget Tree.
3. Selection Manager central sincronizado Canvas ↔ Tree ↔ Inspector ↔ Breadcrumbs.
4. Canvas avanzado con zoom, pan, fit, center, grids, rulers, guides, snapping, safe areas, viewports y direct manipulation.
5. Responsive Builder con inherit/override/reset por breakpoint.
6. Component System con parameters, callbacks, slots, variants, state, lifecycle y Component Studio.
7. Design System Manager con tokens globales y variantes de componentes.
8. Custom Data Types, Enums y Constants.
9. Widget State, Component State, Page State, App State, Session State y Persistent State.
10. Set From Variable universal y Conditional Value Builder.
11. Action Flow Editor con triggers, acciones, conditions, loops, outputs, errores y Action Graph.
12. App Events/Event Bus visual.
13. DataProvider desacoplado, Database Builder, relaciones y Backend Queries.
14. API Manager, API Groups, API Tester y Response Mapping.
15. AuthProvider, sessions, protected routes, RBAC, permissions/capabilities y secrets.
16. Media Manager ampliado.
17. Route Manager, deep links y Storyboard.
18. Animation Inspector, Localization Manager, Accessibility Audit y SEO.
19. Test Mode, Debug Console, State Inspector, Action/API tracing y Automated Tests.
20. Custom Functions, Custom Actions, Custom Components React y Code Files con editor, diagnostics, typecheck y sandboxing.
21. Dependency Manager, Environments, backend functions e Integration Manager.
22. AI Builder y Agents cuyos cambios se expresan como comandos validados/reversibles, nunca como escrituras directas a persistencia.
23. Command Palette/búsqueda universal.
24. Named Versions, checkpoints, restore, branching lógico, comments y colaboración opcional.
25. Project Settings, export ampliado, Deployment Center y pre-deploy validation.
26. Mobile Builder específico: Topbar compacta + Canvas dominante + `Widgets / Pages / Canvas / Properties / More` + tool sheets.
27. Tablet Builder con rail compacto, canvas central, panel contextual y overlays/sheets secundarios.
28. High Density + Minimal Clean + Enterprise/IDE-like como gramática visual profesional.

Toda capacidad relevante de este alcance que todavía no exista se registra como `PARITY_GAP` con capacidad, estado, módulo, prioridad, dependencias, fase propietaria, arquitectura propuesta, criterios de aceptación y pruebas. La existencia de un `PARITY_GAP` no autoriza a implementarlo fuera de fase.

Las fases propietarias de la ampliación son F19–F31 en `PHASES.md`; sus microfases M19.1–M31.8 viven en `DETAILED_EXECUTION_PHASES.md`. La única fase/microfase activa seguirá siendo la indicada en `TRACKING.md`.

El criterio final ampliado exige que un usuario pueda crear visualmente proyecto, design system, páginas/rutas, widgets, componentes, estados, modelos/relaciones, queries, APIs, autenticación/RBAC, Action Flow, responsive, backend, tests/debug, extensiones de código opcionales, asistencia AI opcional, exportación y despliegue, manteniendo local-first, accesibilidad, seguridad, responsive, High Density y Minimal Clean.
