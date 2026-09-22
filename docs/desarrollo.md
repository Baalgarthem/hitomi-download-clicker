# Diario de Desarrollo (Changelog y Arquitectura en Evolución)

Este documento registra los cambios introducidos en el código, documentando la justificación de las decisiones y cómo los módulos interactúan entre sí. Siguiendo las directrices del archivo `AGENTS.md`, cada vez que se modifique o añada un módulo, se debe registrar aquí.

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

