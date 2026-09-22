# Diario de Desarrollo (Changelog y Arquitectura en Evolución)

Este documento registra los cambios introducidos en el código, documentando la justificación de las decisiones y cómo los módulos interactúan entre sí. Siguiendo las directrices del archivo `AGENTS.md`, cada vez que se modifique o añada un módulo, se debe registrar aquí.

## Versión 1.7.3 (Opción de Seleccionar/Deseleccionar Todo y Capitalización Uniforme)
- **Opción de Conmutación Global (`src/ui/modal.js`)**:
  - Incorporación de la barra superior con el control maestro `Deseleccionar Todo` / `Seleccionar Todo`.
  - Mantiene todas las pestañas seleccionadas por defecto. Al hacer clic, conmuta el estado de todas las casillas y alterna dinámicamente el texto a `Seleccionar Todo`.
  - Deshabilita de forma reactiva el botón de confirmación `▶ Iniciar Descarga` cuando no hay pestañas seleccionadas.
- **Capitalización de Nombres de Artistas, Grupos y Unknown (`src/core/author.js` & `src/ui/modal.js`)**:
  - Normalización estricta de mayúsculas iniciales en nombres de autores y círculos (ej. `shinama` -> `Shinama`, `doso cham` -> `Doso Cham`, `kemusi no bansan kai` -> `Kemusi No Bansan Kai`, `unknown` -> `Unknown`).

## Versión 1.7.2 (Fallback a Grupo Publicador y Documentación Pedagógica)
- **Fallback Automático a Nombre del Grupo (`src/core/author.js` & `src/config/constants.js`)**:
  - Incorporación de `selectoresGrupo` para inspeccionar la fila `<td id="groups">` y listas de círculos publicadores (`/group/`).
  - Implementación de `extraerNombreGrupo()` y `obtenerAutorOEstadoInicial()`: si el autor es `N/A` o no existe, utiliza automáticamente el nombre del grupo publicador (ej. `kemusi no bansan kai` -> `「Kemusi No Bansan Kai」`).
  - Si tanto el autor como el grupo son `N/A`, se asigna por defecto `「Unknown」` (pudiendo ser editado manualmente en la interfaz).
- **Documentación Completa y Pedagógica (`README.md` & `package.json`)**:
  - Creación del archivo `README.md` con explicación didáctica, paso a paso, fórmula visual en LaTeX y guía de instalación.
  - Actualización de descripciones del script en los metadatos.

## Versión 1.7.1 (Auditoría de Sintaxis y Cierre de Mantenimiento)
- **Verificación Rigurosa de Código y Sintaxis**:
  - Auditoría exhaustiva de apertura y cierre de corchetes, comillas, paréntesis y terminadores de instrucción (puntos y comas).
  - Verificación de la compilación e integridad del paquete final (`dist/hitomi-download-clicker.user.js`).
- **Finalización de Mantenimiento**:
  - Publicación de parche `v1.7.1` y sincronización con el repositorio remoto.

## Versión 1.7.0 (Arquitectura de 3 Componentes y Fallback Autor "Unknown")
- **Estructura Desacoplada en 3 Componentes (`src/core/tags.js`)**:
  - `[Autor]` (Prefijo: `「Autor」` o `「Unknown」` si es N/A).
  - `[Título]` (Cuerpo: título base limpio sin sitio web ni autores repetidos).
  - `[Tags]` (Sufijo: etiquetas concatenadas con delimitadores configurables `┃`, `⟨⟩`, `[]`, `()`).
- **Gestión y Edición de Autor por Ítem (`src/core/author.js`, `src/ui/modal.js` & `src/core/presence.js`)**:
  - Si el autor es `"N/A"`, `"n/a"`, `"none"` o está vacío y el usuario lo mantiene así, se sobreescribe como `"Unknown"` (`「Unknown」`) para evitar errores de formato en el sistema de archivos de Windows.
  - Inclusión de caja de texto editable para autor (`.hitomi-input-autor-item`) al lado del título en la interfaz modal por cada ítem.
  - Propagación de `autorPersonalizado` a través de IPC y órdenes locales.

## Versión 1.6.2 (Optimización de Código y Cierre de Mantenimiento)
- **Capitalización Uniforme (`src/core/author.js`)**:
  - Optimización de `capitalizarNombre()` para normalizar palabras en mayúsculas/minúsculas mixtas (`NODO` -> `Nodo`).
- **Verificación Completa y Publicación**:
  - Auditoría general del flujo de compilación y despliegue del userscript sin deuda técnica residual.

## Versión 1.6.1 (Edición Personalizada del Título Detectado por Ítem)
- **Campos de Texto Editables en Modal (`src/ui/modal.js`)**:
  - Inclusión de `input[type="text"]` por cada pestaña/cómic detectado en la lista del modal popup.
  - Permite al usuario modificar libremente el título base detectado antes de iniciar las descargas.
- **Propagación Local e IPC (`src/core/presence.js`, `src/core/download.js` & `src/index.js`)**:
  - Almacenamiento dinámico en `ESTADO.titulosEditadosPorPestana`.
  - Transmisión del título editado (`tituloPersonalizado`) a las pestañas de destino en segundo plano para estructurar el nombre final descargado.

## Versión 1.6.0 (Finalización de Mantenimiento e Integración Completa)
- **Consolidación de Arquitectura Modular**: Finalización del ciclo de mantenimiento mayor e integración de extracción de autor `「Artista」`, selector de separador de etiquetas (`┃`, `⟨⟩`, `[]`, `()`), renombrado de extensión a `.cbz`, intercepción global de descargas nativas y optimización de rendimiento.
- **Versión Estable Minor**: Salto de versión a `v1.6.0` con despliegue de artefactos de producción en el repositorio remoto.

## Versión 1.5.3 (Refactorización de Calidad y Deuda Técnica)
- **Centralización de Utilidades DOM (`src/utils/dom.js`)**:
  - Unificación de la creación de contenedores UI con `obtenerOCrearAnfitrionUI()`, eliminando código duplicado en `pill.js` y `modal.js`.
  - Exportación global de `escapeHtml()` para sanear entradas HTML en componentes de la interfaz.
- **Simplificación de Control de Flujo (`src/core/download.js`)**:
  - Remoción de ramas de control de flujo redundantes en la confirmación de clics.
  - Documentación JSDoc mejorada en las funciones de intercepción de descargas.

## Versión 1.5.2 (Opción Persistente de Extensión `.cbz`)
- **Opción de Renombrado a `.cbz` (`src/ui/modal.js` & `src/core/download.js`)**:
  - Incorporación de la casilla interactiva `📦 Renombrar a .cbz` en el menú modal de confirmación.
  - Almacenamiento y persistencia en storage (`hitomi_usar_extension_cbz`).
  - Aplicación automática de la extensión `.cbz` a todos los archivos descargados cuando la opción está activa, tanto en botones del DOM como en descargas dinámicas mediante el interceptor nativo.

## Versión 1.5.1 (Parche: Intercepción Global de Nombres de Descarga y document.title)
- **Corrección de Nombre de Archivo Descargado (`src/core/download.js`)**:
  - Inyección de `document.title = nombreFinalCompleto` al disparar el clic de descarga.
  - Implementación del monkey-patch global `interceptarDescargasNativas()` sobre `HTMLAnchorElement.prototype.click` para forzar la inyección de `a.download = nombreFinalCompleto + extensión` en descargas dinámicas creadas por el sitio.
  - Registro de `ESTADO.ultimoNombreFinal` para garantizar que la descarga producida respete 100% el nombre con autor `「Artista」 Nombre ┃ tags`.

## Versión 1.5.0 (Limpieza Estricta de Títulos y Selector de Estilos de Tags)
- **Limpieza Estricta de Títulos (`src/core/tags.js`)**:
  - Eliminación automática del nombre del sitio (`| Hitomi.la`, `- Hitomi.la`, `┃ Hitomi.la`).
  - Remoción de frases redundantes de autor (`by <autor>`, `por <autor>`) dentro del cuerpo del título.
  - Formateo estricto del autor capitalizado únicamente al principio con comillas japonesas: `「Nodo」 Good Teachers 4`.
- **Selector de Estilo de Separador de Tags (`src/ui/modal.js` & `src/core/tags.js`)**:
  - Incorporación de opciones configurables de delimitador: ` ┃ tags` (Pipe), ` ⟨tags⟩` (Angular), ` [tags]` (Corchete), y ` (tags)` (Paréntesis).
  - Selector visual interactivo en el diálogo sub-modal de Tags.
  - Persistencia de la preferencia del usuario en storage Tampermonkey (`hitomi_estilo_separador_tags`).

## `src/core/tags.js` (Módulo de Tags y Títulos)
- Extracción y formateo de etiquetas desde `<ul id="tags" class="tags">`.
- Limpieza automática de símbolos de género (`♀`, `♂`) y prefijos de categoría (`female:`, `male:`).
- Concatenation de etiquetas elegidas usando el estilo de separador seleccionado (`┃`, `⟨⟩`, `[]`, `()`).
- Función `obtenerNombreFinalCompleto()` para estructurar el nombre final del archivo:
  `「Artista」 Nombre del Comic ┃ viajes chicas rubia` o `「Artista」 Nombre del Comic ⟨viajes chicas rubia⟩`.

## `src/ui/modal.js`
- Adición de un sub-modal emergente interactivo para seleccionar etiquetas de cada comic mediante pills conmutables (botones `🏷️ Tags`).
- Selector visual de estilo de separador de tags (Pipe, Angular, Corchete, Paréntesis).
- Botones de acción rápida: "Seleccionar Todos" y "Limpiar Selección".

## `src/core/download.js`
- Inyección del nombre final concatenado (`「Artista」 Nombre ┃ tags` o `「Artista」 Nombre ⟨tags⟩`) en los atributos `download`, `title` y `data-hitomi-nombre-final` del botón de descarga.

## `src/core/presence.js`
- Transmisión IPC de tags disponibles, tags seleccionados y estilo de separador en las órdenes distribuidas entre pestañas.

