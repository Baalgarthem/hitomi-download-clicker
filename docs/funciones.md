# Documentación de Funciones del Sistema

Este documento describe las funciones clave organizadas por módulos en la arquitectura modular de Hitomi Clicker.

Para comprender en detalle las guías pedagógicas del sistema:
- [Guía Pedagógica de Intercepción de Descargas](guia-intercepcion-descargas.md)
- [Guía Pedagógica de Persistencia de Configuración](guia-persistencia-configuracion.md)

---

## 🛠️ Módulo: `src/core/download.js`
- **`obtenerElementoBotonDescarga()`**: Busca dinámicamente el botón de descarga principal `#dl-button` o botones alternativos por selectores e inspección de texto/atributos.
- **`buscarBotonDescarga(opciones)`**: Ejecuta una búsqueda reintentada con pausa asíncrona hasta encontrar el botón de descarga.
- **`generarNombreFinalConExtension(referenciaUrl)`**: Resuelve el nombre final completo del archivo con la extensión correspondiente (`.cbz` si la casilla está activa o la extensión del enlace/`.zip`).
- **`interceptarDescargasNativas()`**: Registra la estrategia de **interceptación multinivel en 8 capas** (fase de captura de clics, prototype `click`, descriptor `download`, `setAttribute`, descriptor `href`, `URL.createObjectURL`, `fetch` y `XMLHttpRequest.prototype.open`).
- **`confirmarYEjecutarClic(boton, ...)`**: Aplica los 3 componentes del nombre (`「Autor/Grupo」 Título ┃ tags`), ajusta `document.title` sin extensiones para evitar compresión anidada, asigna el atributo `download` y dispara el clic real.
- **`ejecutarOrdenDescarga(identificadorOrden, opciones)`**: Maneja la orden de descarga por pestaña guardando en `ESTADO` los parámetros recibidos por IPC y registrando el resultado en memoria.

---

## 🏷️ Módulo: `src/core/tags.js`
- **`limpiarNombreTag(rawTag)`**: Remueve símbolos de género (`♀`, `♂`) y prefijos de categoría (`female:`, `male:`, `group:`, etc.).
- **`limpiarTituloBase(rawTitle, autorNombre)`**: Limpia el título eliminando sufijos del sitio web (`| Hitomi.la`), comillas japonesas previas y frases `by <autor>`.
- **`extraerTagsPagina()`**: Escanea el DOM y extrae todas las etiquetas presentes en `<ul id="tags">`.
- **`formatearCadenaTags(tagsSeleccionados, estiloId)`**: Aplica el estilo de separador elegido (`pipe` `┃`, `angle` `⟨⟩`, `square` `[]`, `paren` `()`).
- **`obtenerNombreFinalCompleto(opciones)`**: Construye los 3 componentes (`「Autor/Grupo」 Título ┃ tags`) y aplica `sanearNombreArchivoFileSystem()`.

---

## ✍️ Módulo: `src/core/author.js`
- **`capitalizarNombre(texto)`**: Capitaliza adecuadamente la primera letra de cada palabra (`shinama` -> `Shinama`).
- **`extraerNombreAutor()`**: Extrae el nombre del artista/autor desde los selectores del DOM.
- **`extraerNombreGrupo()`**: Extrae el nombre del grupo/círculo publicador desde `<td id="groups">`.
- **`obtenerAutorOEstadoInicial()`**: Obtiene el autor primario o aplica fallback automático al grupo publicador. Si ambos son `N/A`, retorna `"Unknown"`.
- **`formatearNombreAutor(autor)`**: Envuelve el autor entre comillas japonesas `「xxxx」` o `「Unknown」` si es `N/A`.

---

## 🌐 Módulo: `src/utils/dom.js`
- **`sanearNombreArchivoFileSystem(nombre)`**: Sanea nombres de archivo para eliminar caracteres ilícitos en Linux/Windows (`/ \ : * ? " < > |`).
- **`sanearRutaSubcarpeta(ruta)`**: Sanea subcarpetas de descarga relativas limpiando barras invertidas, removiendo path-traversal (`../`) y caracteres prohibidos.
- **`inyectarEstilos(css)`**: Inyecta estilos CSS de forma segura con fallback a `<style>` si `GM_addStyle` no está disponible.
- **`elementoVisible(elemento)`**: Verifica visibilidad real en el viewport (display, visibility, opacity, dimensions).
- **`escapeHtml(texto)`**: Sanitiza entidades HTML para prevenir inyecciones XSS en la UI.
- **`leerValorGM(clave, valorDefecto)`**: Lee valores del almacenamiento de Tampermonkey/Violentmonkey con fallback automático a `localStorage`.
- **`guardarValorGM(clave, valor)`**: Guarda valores en el almacenamiento de Tampermonkey/Violentmonkey con fallback automático a `localStorage`.
- **`eliminarValorGM(clave)`**: Elimina valores del almacenamiento de Tampermonkey/Violentmonkey con fallback automático a `localStorage`.



