# Diario de Desarrollo (Changelog y Arquitectura en Evolución)

Este documento registra los cambios introducidos en el código, documentando la justificación de las decisiones y cómo los módulos interactúan entre sí. Siguiendo las directrices del archivo `AGENTS.md`, cada vez que se modifique o añada un módulo, se debe registrar aquí.

## Versión 2.10.1 (Auditoría de Cierre de Procesadas, Diagnóstico y Protocolo de Auto-Actualización)
- **Protocolo de Versiones y Despliegue en `AGENTS.md`**:
  - Incorporado el punto 3 en los Protocolos Obligatorios: incremento semántico continuo e inteligente (`major`/`minor`/`patch`) en cada ciclo de trabajo para habilitar la auto-actualización automática en Tampermonkey/Violentmonkey.
- **Auditoría y Blindaje en `cerrarPestanasProcesadas()` (`src/core/presence.js`)**:
  - Verificada la compatibilidad con las etiquetas `" ✓ Descargado"` (descarga normal) y `" ✓ Re-descargado"` (descarga forzada) mapeadas bajo la propiedad unificada `yaProcesada`.
  - Añadido registro estructurado en consola para trazabilidad y diagnóstico al ejecutar el cierre masivo de pestañas procesadas mediante IPC.
  - Sincronización estricta de versiones y empaquetado del bundle.

## Versión 2.10.0 (Botón de Cierre Masivo de Pestañas Procesadas cuando Detectadas = 0)
- **Botón Extra de Icono ✕ al lado de 'Limpiar Memoria' (`src/ui/modal.js`)**:
  - Cuando el número de pestañas detectadas es 0 (sin pestañas nuevas pendientes de descargar), se muestra un único botón extra al lado de "🗑️ Limpiar Memoria" que contiene exclusivamente el ícono `✕` sin texto innecesario.
  - Al posar el cursor sobre el botón (hover), muestra el texto explicativo: *"Cerrar todas aquellas pestañas que tengan la etiqueta de descargadas o re-descargadas"*.
  - Al hacer clic sobre el botón, ejecuta la función de cierre masivo, cerrando inmediatamente todas las pestañas que tengan la etiqueta de descargadas o re-descargadas.
- **Comunicación IPC Global para Cierre Masivo (`src/core/presence.js` y `src/index.js`)**:
  - Implementada `cerrarPestanasProcesadas()` que recopila las pestañas con `yaProcesada === true` y emite una orden IPC `CLAVES.ordenCerrarPestanas`.
  - Las pestañas remotas escuchan la orden vía `GM_addValueChangeListener` (y fallback `storage`) y se cierran automáticamente con `window.close()`.
  - La pestaña actual que emite la orden también se cierra si pertenece al grupo de pestañas ya procesadas.

## Versión 2.9.3 (Hardening: Ruta Personalizada Deshabilitada + Candados de Seguridad)
- **Ruta Personalizada Deshabilitada en UI (`src/ui/modal.js`)**:
  - El botón de ruta personalizada ahora muestra "📂 Ruta: **Por defecto** `WIP`" con `opacity: 0.45` y `cursor: not-allowed`.
  - Tooltip al pasar el cursor: "⚙️ Pendiente de implementar — La ruta personalizada estará disponible en una próxima versión cuando esté completamente verificada".
  - El listener de clic bloquea explícitamente la interacción con `preventDefault()` + `stopPropagation()`.
  - La funcionalidad permanece en el código (comentada) lista para re-habilitarse cuando se confirme.
- **GM_download Deshabilitado Permanentemente por Ahora (`src/core/download.js`)**:
  - `tieneRutaPersonalizada = false` de forma constante; el bloque GM_download completo fue movido a un comentario `/* ... */` preservado para futura re-habilitación.
  - Solo se activa el flujo de clic nativo. Esto elimina por completo las interferencias que causaban la ruta como prefijo del nombre y la doble compresión.
  - La variable `rutaLimpia` se lee pero no se usa (silenciado con `void rutaLimpia`).
- **Guardia de Seguridad en `generarNombreFinalConExtension` (`src/core/download.js`)**:
  - Añadida una línea defensiva final: `return resultado.replace(/[/\\]/g, "-")` que convierte cualquier separador de ruta en guión antes de retornar el nombre.
  - Esto garantiza que aunque algún estado interno contenga barras de ruta, el nombre inyectado en `a.download` o `title` NUNCA tendrá prefijo de carpeta.
  - El strip de extensiones previas se mejoró a `/\.(zip|cbz)$/i` (un solo replace en lugar de dos encadenados).
- **Interceptor `.href` Eliminado (`src/core/download.js`)**:
  - El interceptor del setter de `HTMLAnchorElement.prototype.href` fue eliminado. Era el interceptor más agresivo: disparaba en cualquier asignación de `href`, incluyendo navegación normal, y calculaba filenames cuando `ESTADO.ultimoNombreFinal` aún no estaba disponible.
- **Interceptores Fetch y XHR Limpiados (`src/core/download.js`)**:
  - Los interceptores #7 (Fetch) y #8 (XHR) tenían código muerto que llamaba a `generarNombreFinalConExtension` y descartaba el resultado. Ese código fue eliminado; los interceptores ahora son transparentes (solo pasan la llamada al original).
- **Verificación**: `GM_download` no aparece en el bundle (`dist/`) excepto en el encabezado `@grant`.

## Versión 2.9.2 (Soporte Completo de Unicode en Rutas y Preview en Tiempo Real)
- **Soporte Completo de Rutas con Caracteres Unicode (`src/utils/dom.js`)**:
  - Mejorada `sanearRutaSubcarpeta()` para aceptar rutas absolutas de Windows con caracteres Unicode completos (ej. `E:\Vault\Dōjin\「Updates」` → `Vault/Dōjin/「Updates」`).
  - Añadido strip de prefijos de ruta larga de Windows (`\\?\`, `\\.\`) en el paso 2.
  - Corregido strip de rutas UNC (`\\servidor\recurso\carpeta`) eliminando correctamente tanto el nombre del servidor como el nombre del recurso compartido (dos segmentos), dejando solo la subcarpeta real.
  - Corregido el flag `/g` incorrecto en el strip de letra de unidad (el patrón es `^`-anclado, no necesita `g`).
  - Los caracteres Unicode (`ō`, `「」`, `【】`, `ñ`, `テスト`, etc.) se preservan explícitamente: el filtro de caracteres ilegales solo elimina caracteres ASCII de control y metacaracteres de sistemas de archivos.
- **Vista Previa en Tiempo Real de Ruta (`src/ui/modal.js`)**:
  - Añadido cuadro de preview `📋 Vista previa de la ruta efectiva:` en el modal de ruta personalizada (`mostrarModalRutaDescarga`).
  - Se actualiza dinámicamente en tiempo real al escribir o pegar en el campo de entrada, mostrando exactamente cómo quedará la ruta tras el saneamiento.
  - Muy útil cuando el usuario ingresa rutas absolutas de Windows: puede ver en el acto que `E:\Vault\Dōjin` se convierte en `Vault/Dōjin/`.
- **Nota Informativa Actualizada (`src/ui/modal.js`)**:
  - El texto de ayuda del modal de ruta se amplió para documentar: soporte de caracteres Unicode, eliminación automática de letras de unidad, limitación de subcarpeta relativa impuesta por el navegador.

## Versión 2.9.1 (Corrección de Doble Descarga y Condicionalidad de GM_download)
- **Corrección Crítica: GM_download solo activo con ruta personalizada (`src/core/download.js`)**:
  - En v2.9.0, `GM_download` se invocaba **siempre** que la API estaba disponible, incluso cuando no había ruta personalizada configurada. Esto causaba que el clic nativo **también** se ejecutara (doble descarga), y en algunos casos generaba archivos rotos o doble compresión cuando los dos flujos interferían simultáneamente.
  - Corregido: `GM_download` ahora se usa **únicamente** cuando el usuario tiene configurada una ruta de subcarpeta personalizada (`CLAVES.rutaDescarga`). Sin ruta personalizada, el flujo de clic nativo estándar se ejecuta de forma directa y sin interferencias.
- **Corrección de Bug en Interceptor `setAttribute` (`src/core/download.js`)**:
  - El interceptor de `HTMLAnchorElement.prototype.setAttribute` tenía un `return;` (vacío) en el branch de "no es botón de descarga", lo que descartaba silenciosamente cualquier `setAttribute("download", ...)` en elementos que no eran el botón de descarga del script. Corregido para siempre llamar al `originalSetAttribute` incluso en elementos que no son objetivos.
- **Simplificación de `generarNombreFinalConExtension` (`src/core/download.js`)**:
  - Eliminado el parámetro `incluirRutaSubcarpeta` que era código muerto: la función ahora siempre retorna un nombre limpio sin barras de subcarpeta. La composición de la ruta con subcarpeta se realiza en el punto de uso (`confirmarYEjecutarClic`) de forma explícita y controlada.
- **Fallback en GM_download mejorado**:
  - Si `GM_download` falla (error de red, permisos), el fallback al clic nativo ahora levanta correctamente `ESTADO.permitirClicForzado` antes del clic y lo restablece después, evitando que el interceptor global lo bloquee.

## Versión 2.9.0 (Integración de GM_download para Subcarpetas y Saneamiento de a.download)
- **Corrección de Ruta Personalizada con Subcarpetas (`src/core/download.js`)**:
  - Solución al problema en Windows y navegadores nativos donde los separadores `/` en atributos HTML `a.download` causaban que el archivo se guardara en la carpeta predeterminada de descargas usando la ruta como prefijo con guiones bajos (ej. `Hitomi_Comics_「Autor」 Título.cbz`).
  - Implementación de `generarNombreFinalConExtension(referenciaUrl, incluirRutaSubcarpeta)`:
    - Retorna el nombre limpio sin barras (`「Autor」 Título ┃ tags.cbz`) para inyectar en atributos del DOM (`a.download`, `title`, `document.title`).
    - Retorna el nombre formateado con subcarpeta (`Hitomi/Comics/「Autor」 Título ┃ tags.cbz`) exclusivamente para la API de descargas de Userscript (`GM_download`).
  - Ejecución de `GM_download({ url: downloadUrl, name: nombreConRutaSubcarpeta, saveAs: false })` cuando la API de Userscript Manager está disponible, guardando directamente en la subcarpeta real `Descargas/Hitomi/Comics/`.
  - Invocación de fallback a clic nativo únicamente en caso de error o ausencia de `GM_download`, manteniendo `a.download` libre de barras para evitar nombres rotos.

## Versión 2.8.0 (Reubicación de Casilla 'Incluir Serie' dentro del Sub-Modal de Tags)
- **Reubicación de Interfaz (`src/ui/modal.js`)**:
  - Traslado de la casilla de verificación `📺 Incluir Serie 【...】` desde el panel principal de opciones (`mostrarPopupConfirmacion`) hacia el interior del sub-modal de selección de etiquetas (`mostrarModalSeleccionTags`).
  - Mantiene la misma funcionalidad persistente (`CLAVES.incluirSerie` -> `hitomi_incluir_serie_sufijo`) y comportamiento global.
  - No requirió la modificación de estructuras de datos en `ESTADO` ni claves de almacenamiento adicionales, optimizando el rendimiento y reutilizando los listeners existentes.

## Versión 2.7.0 (Sufijo de Personajes 【Personaje1 Personaje2】 en Title Case y Selección Integrada en Sub-Modal)
- **Inclusión y Selección de Personajes (`src/config/constants.js`, `src/core/tags.js`, `src/core/presence.js`, `src/core/download.js` & `src/ui/modal.js`)**:
  - Extracción automática de personajes desde la lista `<ul id="characters" class="tags">` mediante `CONFIGURACION.selectoresPersonajes`.
  - Capitalización estricta Title Case de nombres de personajes (`capitalizarPersonaje()`, ej. `"dermail catalonia"` -> `"Dermail Catalonia"`, `"relena peacecraft"` -> `"Relena Peacecraft"`).
  - Sub-modal `🏷️ Tags` ampliado con la sección `👤 Personajes Detectados` conteniendo pills conmutables interactivas que permiten al usuario elegir individualmente cuántos y cuáles personajes incluir.
  - Mensaje de reemplazo didáctico `No hay personajes por añadir` cuando el cómic no posee la etiqueta de personajes.
  - Anexo del sufijo de personajes entre corchetes japoneses `【Personaje1 Personaje2】` posicionado estrictamente después del sufijo de la serie al final del archivo (`「Autor」 Título ┃ tags 【Serie】 【Personaje1 Personaje2】.cbz`).
  - Almacenamiento y sincronización IPC persistente de la selección por pestaña (`ESTADO.personajesSeleccionadosPorPestana`).

## Versión 2.6.0 (Sufijo Persistente de Serie 【Serie】 en Mayúsculas y Verificación de Tags Custom)
- **Inclusión General y Persistente de Serie (`src/config/constants.js`, `src/core/tags.js`, `src/core/presence.js` & `src/ui/modal.js`)**:
  - Incorporación de la casilla de verificación `📺 Incluir Serie 【...】` en el panel `⚙️ OPCIONES DE DESCARGA` (almacenada persistentemente en `CLAVES.incluirSerie`).
  - Al estar activada, la serie del cómic se anexa como un sufijo formateado entre corchetes japoneses `【...】` al final del nombre de archivo (después de las etiquetas).
- **Capitalización Obligatoria Title Case (`src/core/tags.js`)**:
  - Implementación de `capitalizarSerie()` que transforma cualquier serie del DOM (ej. `"gundam wing"` -> `"Gundam Wing"`) a formato Title Case con mayúscula en cada palabra.
- **Verificación de Descarga de Tags Personalizados (`src/core/tags.js` & `src/core/download.js`)**:
  - Confirmación y validación de que los tags ingresados manualmente por el usuario se integran limpiamente en `formatearCadenaTags()` y se reflejan al 100% en el archivo descargado.

## Versión 2.5.1 (Sincronización en Tiempo Real de Tags Personalizados en Contadores)
- **Reflejo Inmediato de Tags Personalizados en Contadores (`src/ui/modal.js`)**:
  - Implementación de `actualizarContadoresTags()` para actualizar dinámicamente en tiempo real los contadores del sub-modal (`#hitomi-tag-badge-count`, `#hitomi-count-sel` y `#hitomi-count-total`).
  - Al ingresar etiquetas manuales separadas por espacios y pulsar `➕ Añadir Tag` o `Enter`, las nuevas etiquetas personalizadas se añaden a la selección y se reflejan al instante en la cabecera, en el texto descriptivo del sub-modal y en el botón del menú principal `🏷️ Tags (N)`.

## Versión 2.5.0 (Opción de Bloqueo del Botón de Descarga Nativo de la Página)
- **Opción de Bloqueo Anti-Descarga Accidental (`src/config/constants.js`, `src/ui/badge.js`, `src/core/download.js` & `src/ui/modal.js`)**:
  - Incorporación de la constante `CLAVES.bloquearBotonNativo` (`hitomi_bloquear_boton_nativo`) para recordar persistentemente la preferencia del usuario.
  - Adición del checkbox `🛡️ Bloquear botón nativo` en la sección `⚙️ OPCIONES DE DESCARGA` de la ventana flotante.
- **Intercepción y Bloqueo de Clics Directos (`src/ui/badge.js` & `src/core/download.js`)**:
  - Al estar activada esta opción, cualquier clic directo del usuario sobre el botón de descarga nativo de la página (`#dl-button` / `.download-button`) es bloqueado de forma inmediata (`preventDefault()` & `stopImmediatePropagation()`), evitando descargas accidentales mientras se navega por el sitio.
  - Las descargas programáticas iniciadas desde la interfaz flotante o la ventana modal de nuestro script se ejecutan normalmente sin ser afectadas (`ESTADO.permitirClicForzado`).
- **Insignia Visual Dinámica (`src/ui/badge.js`)**:
  - Implementación de `actualizarEstadoVisualBotonNativo()` que añade la insignia `🔒 Bloqueado` y tooltip explicativo al botón nativo en la página cuando el usuario activa la protección.

## Versión 2.4.0 (Sincronización Global IPC de Pestañas, Re-Escaneo Normalizado y Fallback H1)
- **Sincronización Global IPC entre Pestañas (`src/core/presence.js`, `src/config/constants.js` & `src/index.js`)**:
  - Implementación de `solicitarSincronizacionGlobalPestanas()` y la clave IPC `CLAVES.pingPresencia`.
  - Al hacer clic en `🔄 Escanear Pestañas` o al abrir la interfaz flotante desde cualquier pestaña, se transmite una señal IPC broadcast a todas las demás pestañas abiertas en el navegador.
  - Cada pestaña activa re-evalúa de inmediato su DOM, re-extrae su título, autor y etiquetas, y actualiza su estado en almacenamiento con un marcador de tiempo (heartbeat).
- **Normalización de Títulos con Fallback a Elementos H1 (`src/core/tags.js`)**:
  - Actualización de `limpiarTituloBase()`: si `document.title` aún no ha sido renderizado o contiene solo el texto genérico del sitio (`Hitomi.la`), la función consulta proactivamente la etiqueta `h1 a`, `#gallery-brand a` o `.gallery-info h1` para capturar de inmediato el título real del cómic.
- **Purga de Pestañas Inactivas / Caducadas (`src/core/presence.js`)**:
  - Optimización de `limpiarRegistrosPestanasAntiguas()` para eliminar automáticamente registros obsoletos o pestañas cerradas sin latido en los últimos 60 segundos.

## Versión 2.3.0 (Aislamiento Total de Intercepción: Tags, Navegación y Lectura Intactos)
- **Filtro Estricto Anti-Intercepción en Enlaces de Navegación y Tags (`src/core/download.js`)**:
  - Ampliación de `esElementoBotonDescarga()` para bloquear la asignación de atributos `download` a enlaces de etiquetas (`/tag/`), artistas (`/artist/`), grupos (`/group/`), series (`/series/`), personajes (`/character/`), idiomas (`/language/`), lectores (`/reader/`) y contenedores de tags (`.tags`, `#tags`).
  - Cumplimiento estricto del principio de diseño: la interacción con la página principal y su navegación funciona de forma nativa e inalterada, limitando la ejecución del script exclusivamente al botón `#dl-button` y a las herramientas/paneles propios del userscript.
- **Saneamiento Automático de Atributos `download` (`src/core/download.js`)**:
  - Actualización de `limpiarAtributosDescargaInvalidos()` para remover de forma inmediata cualquier atributo `download` erróneo en enlaces de etiquetas, navegación y miniaturas.

## Versión 2.2.2 (Corrección Crítica: Discriminación Estricta de Enlaces de Lectura y Miniaturas)
- **Filtro Estricto de Descargas vs Lectores (`src/core/download.js`)**:
  - Implementación de `esElementoBotonDescarga()` para discriminar estrictamente los botones y enlaces de descarga reales del sitio (`#dl-button`, endpoints `.zip`/`.cbz`/`/download/`, `blob:`, ó clics forzados).
  - Exclusión explícita de enlaces de lectura online (`/reader/`), galerías, artistas, grupos, etiquetas y contenedores de miniaturas (`.thumbnail-container`, `.thumbnail-list`).
  - Solución definitiva al bug que provocaba que al hacer clic en las miniaturas de un cómic para leerlo online, el navegador iniciara una descarga no deseada de la página HTML en lugar de abrir el lector.
- **Limpieza Proactiva de Atributos Inválidos (`src/core/download.js` & `src/index.js`)**:
  - Implementación de `limpiarAtributosDescargaInvalidos()` que remueve automáticamente cualquier atributo `download` asignado por error a enlaces de miniaturas o lectores al interactuar con la página.

## Versión 2.2.1 (Refinamiento de Calidad de Código, Tecla Enter en Sub-Modals y Robusteza de Storage)

- **Refinamiento de Sanitización de Rutas y Fallbacks (`src/utils/dom.js`)**:
  - Reestructuración de `sanearRutaSubcarpeta()` dividiendo por componentes para neutralizar navegaciones relativas aisladas (`.` y `..`).
  - Robustecimiento de `leerValorGM()` para manejar strings no JSON en `localStorage` sin lanzar excepciones innecesarias.
- **Experiencia de Usuario Mejorada (`src/ui/modal.js`)**:
  - Incorporación del escuchador de tecla `Enter` en la caja de entrada de ruta de descargas para guardar y cerrar dinámicamente con mayor comodidad.

## Versión 2.2.0 (Subcarpeta de Descargas Personalizada y Restablecimiento a Predeterminado)

- **Opción de Ruta Personalizada (`src/config/constants.js`, `src/utils/dom.js`, `src/core/download.js` & `src/ui/modal.js`)**:
  - Adición de la constante `CLAVES.rutaDescarga` (`hitomi_ruta_descarga_personalizada`) para almacenar persistentemente la subcarpeta elegida por el usuario.
  - Implementación del botón `📂 Ruta: <Ruta Actual>` en el panel `⚙️ OPCIONES DE DESCARGA` de la pantalla principal.
- **Sub-Modal de Configuración de Ruta (`src/ui/modal.js`)**:
  - Creación de `mostrarModalRutaDescarga()` para visualizar la ruta activa (predeterminada o subcarpeta relativa ej. `Hitomi/Comics`), ingresar una nueva subcarpeta o presionar **`🔄 Resetear a Predeterminado`**.
- **Sanitización y Anti Path-Traversal (`src/utils/dom.js`)**:
  - Implementación de `sanearRutaSubcarpeta()` para formatear la ruta, remover caracteres ilícitos y neutralizar intentos de path traversal (`../`, `./`, `/`).
- **Inyección Automática en Descargas Nativas (`src/core/download.js`)**:
  - En `generarNombreFinalConExtension()`, si existe una ruta personalizada activa, se antepone `${rutaLimpia}/` a las descargas nativas del script (`a.download`), manteniendo `document.title` limpio para evitar alteraciones en los ZIPs del sitio.

## Versión 2.1.0 (Persistencia 100% Permanente de Configuración, Storage Wrappers y Guía Pedagógica)

- **Persistencia Permanente de Opciones (`src/ui/modal.js`, `src/config/constants.js` & `src/utils/dom.js`)**:
  - Implementación de almacenamiento 100% persistente para todas las elecciones y configuraciones del usuario (`usarCbz`, `cerrarPestana`, `modoForzado` y `estiloSeparador`).
  - Incorporación de la constante `CLAVES.modoForzado` (`hitomi_modo_forzado`) para recordar la preferencia de modo normal vs forzado entre sesiones y reinicios.
- **Unificación de Wrappers de Almacenamiento con Fallback Multiplataforma (`src/utils/dom.js`, `src/core/memory.js`, `src/core/presence.js`, `src/core/download.js` & `src/core/tags.js`)**:
  - Centralización de `leerValorGM`, `guardarValorGM` y `eliminarValorGM` con fallback transparente a `localStorage` para total compatibilidad en Tampermonkey, Violentmonkey, Greasemonkey, entornos Chromium y navegadores en Linux/Windows.
- **Guía Pedagógica de Persistencia (`docs/guia-persistencia-configuracion.md`)**:
  - Creación del documento didáctico explicativo con la "Analogía de la Pizarra vs el Cuaderno", la API de almacenamiento de Userscripts, cabecera `@grant`, manejo de fallbacks y buenas prácticas de desarrollo.

## Versión 2.0.0 (Rediseño Estructural de Opciones vs Acciones, Cierre Automático de Pestañas y Tooltips Informativos Completo)

- **Cierre Automático de Pestañas Descargadas (`src/config/constants.js`, `src/ui/modal.js` & `src/core/download.js`)**:
  - Incorporación de la casilla `🚪 Cerrar pestañas al descargar` en el panel de opciones de la interfaz.
  - Al estar activa, cada pestaña abierta que completa el disparo de descarga ejecuta de forma segura `window.close()` tras un intervalo prudencial de 1.8 segundos, reduciendo la carga del navegador.
- **Desacoplamiento Estructural: Panel de OPCIONES (Checkboxes) vs ACCIONES (Botones) (`src/ui/modal.js`)**:
  - Separación visual y semántica completa de la interfaz en tres bloques claros:
    1. **⚙️ OPCIONES DE DESCARGA**: Tarjeta dedicada a casillas de verificación (Selección máster, Formato `.cbz`, Cierre automático de pestañas y Conmutador de Modo Forzado).
    2. **📚 CÓMICS DETECTADOS**: Cuadrícula limpia de elementos interactivos con checkboxes rosados (`#ec4899`).
    3. **🚀 ACCIONES Y HERRAMIENTAS**: Pie de ventana con mantenimiento a la izquierda (`Escanear Pestañas`, `Limpiar Memoria`) y botones principales a la derecha (`Cancelar`, `Iniciar Descarga`).
- **Auditoría Exhaustiva de Tooltips Informativos Hover (`src/ui/modal.js` & `src/ui/pill.js`)**:
  - Incorporación y afinamiento del atributo `title="..."` en el 100% de los botones, etiquetas, entradas de texto, switches y casillas de verificación para ofrecer explicaciones concisas y fáciles de entender al pasar el cursor.

## Versión 1.9.2 (Checkboxes Rosados, Corrección de Selección Persistente y Agrupación Intuitiva de UX)
- **Ajuste de Color de Checkboxes Rosados (`src/ui/modal.js`)**:
  - Cambio de `accent-color` en casillas de verificación máster, individuales e ítem `.cbz` a tono rosa brillante (`#ec4899`), aportando mayor contraste y coherencia estética con los tonos violeta y rosa de la paleta.
- **Corrección del Bug de Selección Persistente (`src/ui/modal.js`)**:
  - Implementación de `pestanasMarcadasSet` en el modal popup para registrar de forma persistente qué casillas desmarcó o marcó el usuario.
  - Al abrir el sub-modal de `🏷️ Tags` o re-escuchar el DOM, el menú respeta 100% el estado exacto de selección definido previamente por el usuario, impidiendo que las casillas desmarcadas vuelvan a marcarse automáticamente.
- **Agrupación Intuitiva de Secciones UX (`src/ui/modal.js`)**:
  - Reorganización estructural: la barra superior (toolbar) agrupa el control maestro `Deseleccionar/Seleccionar Todo` a la izquierda, y las configuraciones de formato (`📦 Formato .cbz`) y modo (`⚡ Modo Forzado`) a la derecha.
  - El pie del modal queda reservado limpiamente a botones de acción: utilidades a la izquierda (`🔄 Escanear Pestañas`, `🗑️ Limpiar Memoria`) y botones de ejecución a la derecha (`Cancelar`, `▶ Iniciar Descarga`).

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

