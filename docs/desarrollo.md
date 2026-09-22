# Diario de Desarrollo (Changelog y Arquitectura en Evolución)

Este documento registra los cambios introducidos en el código, documentando la justificación de las decisiones y cómo los módulos interactúan entre sí. Siguiendo las directrices del archivo `AGENTS.md`, cada vez que se modifique o añada un módulo, se debe registrar aquí.

## Versión 1.9.1 (Validación Estricta de Tags Personalizados por Espacios y Bloqueador de Caracteres)
- **Separación Obligatoria por Espacios (`src/ui/modal.js`)**:
  - Actualización del parsing de tags manuales para separar los términos utilizando espacios (`\s+`) en lugar de comas.
  - Corrección de la indicación en la interfaz y el texto de ayuda hover (`title="⚠️ Importante: Separa cada etiqueta ÚNICAMENTE con ESPACIOS..."`).
- **Bloqueo de Caracteres No Permitidos y Aviso Visual (`src/ui/modal.js`)**:
  - Implementación de `validarYLimpiarEntradaCustomTag()` para filtrar en tiempo real cualquier carácter fuera de `[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_\-\s]`.
  - Muestra interactiva del aviso `#hitomi-custom-tag-warning` y parpadeo de borde en rojo (`#f87171`) ante cualquier intento de ingresar comas, barras o caracteres especiales no permitidos.

## Versión 1.9.0 (Rediseño Estético Paleta Hitomi, Icono Oficial, Botones Compactos y Tooltips Informativos)
- **Rediseño Visual con Paleta Oficial de Hitomi (`src/ui/pill.js` & `src/ui/modal.js`)**:
  - Aplicación del esquema de colores oficial de Hitomi (`#3d4e5e` / `#2d3b47` en degradados de cabecera, acento púrpura suave `#b580b5` en bordes inferiores de títulos, contenedores en gris oscuro slate `#11151c` y tarjetas `#192028`).
- **Integración del Icono Oficial (`src/config/constants.js`, `src/ui/pill.js` & `src/ui/modal.js`)**:
  - Incorporación del logo oficial del proyecto (`hitomi-logo.png`) en la pastilla flotante principal y en las cabeceras del modal principal y del sub-modal de selección de etiquetas.
- **Botones Compactos y Alineación pulida (`src/ui/modal.js`)**:
  - Reducción uniforme de `padding: 6px 12px` y `font-size: 12px` con `border-radius: 6px` en todos los controles para una interfaz más limpia, compacta y profesional.
- **Textos Clarificados para Modo Forzado y Botón Escanear (`src/ui/modal.js`)**:
  - Clarificación de los textos y estados: botón `🔄 Escanear Pestañas` (para refrescar pestañas abiertas) y selector conmutable `⚡ Modo Forzado (Re-descargar)` / `✓ Modo Normal (Pendientes)` (explicando que el Modo Forzado fuerza la re-descarga de cómics que ya han sido procesados anteriormente).
- **Tooltips Explicativos en Todos los Controles Interactivos (`src/ui/pill.js` & `src/ui/modal.js`)**:
  - Adición del atributo `title="..."` en el 100% de los botones, botones de cierre `✕`, casillas de verificación, casillas máster, entradas de texto, etiquetas pill y selectores del sistema para guiar al usuario al pasar el cursor (hover).

## Versión 1.8.1 (Documentación Pedagógica de Interceptación y Diagrama de Flujo)
- **Guía Pedagógica Completa (`docs/guia-intercepcion-descargas.md`)**:
  - Incorporación del documento explicativo con analogías didácticas ("La Fábrica de Donas") para explicar la separación entre `document.title` (identidad interna) y `a.download` (etiqueta de archivo en disco).
  - Explicación paso a paso de por qué ocurría el fallo de compresión anidada en archivos `.cbz` y cómo la arquitectura en 8 capas de intercepción resuelve el problema en Firefox y Chromium.
- **Actualización de Documentación de Módulos (`docs/funciones.md` & `README.md`)**:
  - Actualización exhaustiva de la especificación de funciones por cada módulo en la carpeta `docs/`.

## Versión 1.8.0 (Entrada Manual de Tags Personalizados por Cómic)
- **Ingreso Manual de Etiquetas (`src/ui/modal.js`)**:
  - Incorporación de la caja de texto interactiva `✍️ Ingresar Tags Personalizados Manualmente` y botón `➕ Añadir Tag` dentro del sub-modal de selección de tags.
  - Permite al usuario escribir una o varias etiquetas personalizadas (separadas por comas) y presionar `Enter` o hacer clic en el botón.
  - Inclusión dinámica de los nuevos tags personalizados como pills activas en la cuadrícula y persistencia en `ESTADO.tagsSeleccionadosPorPestana` para concatenarlos al nombre del archivo descargado.

## Versión 1.7.7 (Compatibilidad Multiplataforma Linux y Navegadores Chromium)
- **Saneamiento Universal de Nombres de Archivo (`src/utils/dom.js` & `src/core/tags.js`)**:
  - Implementación de `sanearNombreArchivoFileSystem()` para neutralizar caracteres prohibidos en sistemas de archivos de Linux (ext4/btrfs) y Windows (NTFS/FAT32), así como en gestores de descarga de Chromium (Chrome, Brave, Edge, Opera) y Firefox.
  - Reemplaza barras `/` y `\` por guiones, dos puntos `:` por ` -`, y remueve caracteres nulos y de control, comillas dobles y corchetes angulares ilícitos, limitando nombres a un máximo seguro de 200 caracteres.
- **Inyección de Estilos y Storage Fallbacks Cross-Browser (`src/utils/dom.js`, `src/core/presence.js` & `src/index.js`)**:
  - Implementación de `inyectarEstilos()` con fallback a elementos `<style>` en el DOM cuando `GM_addStyle` no está disponible en ciertos motores de Chromium o scripts aislados.
  - Creación de wrappers seguros `leerValorGM`, `guardarValorGM`, `eliminarValorGM` con fallback a `localStorage` y evento `window.onstorage` cuando `GM_addValueChangeListener` o `GM_listValues` no están presentes en motores reducidos.

## Versión 1.7.6 (Corrección de Compresión .cbz/.zip y Propagación de Tags)
- **Prevención de Doble Compresión y Gestión Limpia de `document.title` (`src/core/download.js`)**:
  - Eliminación de la modificación de `document.title` con extensiones de archivo (`.zip` / `.cbz`) en los interceptores de red y clics.
  - Asegura que `document.title` conserve el nombre sin extensiones para evitar que los generadores de ZIP del sitio empaqueten carpetas o archivos `.cbz` anidados internamente.
  - Garantiza que la descarga resultante sea el archivo comprimido original de imágenes renombrado limpia y únicamente en la extensión (`.cbz` o `.zip`).
- **Garantía de Inclusión de Tags en Pestañas Remotas (`src/core/download.js`)**:
  - Almacenamiento inmediato de `tagsSeleccionados`, `tituloPersonalizado` y `autorPersonalizado` en el estado local de cada pestaña (`ESTADO.tagsSeleccionadosPorPestana`) al recibir la orden IPC.
  - Garantiza que los tags configurados por el usuario aparezcan 100% en el nombre final descargado (`「Autor/Grupo」 Título ┃ tags.cbz`).

## Versión 1.7.5 (Interceptación Dinámica de Red y Objetos Blob URL)
- **Intercepción de Objetos Blob y Atributos Dinámicos (`URL.createObjectURL` & `HTMLAnchorElement.prototype.href`)**:
  - Parcheo de `HTMLAnchorElement.prototype.href` setter para detectar cuando el sitio actualiza dinámicamente el enlace de descarga e inyectar automáticamente el atributo `download` personalizado.
  - Sobrescritura de `URL.createObjectURL` para rastrear URLs de objetos Blob generadas dinámicamente y vincularlas a los elementos `<a>` correspondientes en el DOM.
- **Intercepción de Red Network-Level (`window.fetch` & `XMLHttpRequest.prototype.open`)**:
  - Intercepción de `window.fetch` y `XMLHttpRequest.prototype.open` para solicitudes HTTP orientadas a endpoints de descarga (`download`, `.zip`, `.cbz`, `hitomi.la`).
  - Actualización preventiva del título del documento y estado de nombre final para garantizar que las descargas asíncronas respeten la nomenclatura personalizada.

## Versión 1.7.4 (Interceptación Multinivel de Descargas en Fase de Captura)
- **Escuchador Global en Fase de Captura (`document.addEventListener("click", ..., true)`)**:
  - Intercepción preventiva de clics en fase de captura antes de que los manejadores de eventos propios de Hitomi o Firefox procesen el evento.
  - Inyección reactiva del atributo `download` formateado (`「Autor/Grupo」 Título ┃ tags.zip/.cbz`) directamente sobre el elemento presionado.
- **Intercepción de Prototipo y Propiedades (`HTMLAnchorElement.prototype`)**:
  - Sobrescritura de `HTMLAnchorElement.prototype.click`.
  - Intercepción de la propiedad `download` mediante descriptor setter `Object.defineProperty` para sobrescribir asignaciones dinámicas del sitio web.
  - Intercepción de `HTMLAnchorElement.prototype.setAttribute("download", ...)` para garantizar que el nombre configurado prevalezca 100%.

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

