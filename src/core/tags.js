// ─────────────────────────────────────────────
// Extracción de Tags y Formateo Personalizado (┃ / ⟨⟩ / [] / ())
// ─────────────────────────────────────────────

import { CONFIGURACION, ESTILOS_SEPARADOR, CLAVES } from '../config/constants.js';
import { extraerNombreAutor, formatearNombreAutor, obtenerAutorOEstadoInicial } from './author.js';

/**
 * Limpia el texto de un tag removiendo símbolos de género (♀, ♂) y prefijos de categoría.
 * Ejemplo: "female:anal intercourse ♀" -> "anal intercourse"
 * Ejemplo: "glasses ♀" -> "glasses"
 * @param {string} rawTag - Texto bruto del tag.
 * @returns {string} Nombre limpio del tag.
 */
export function limpiarNombreTag(rawTag = "") {
  if (!rawTag || typeof rawTag !== "string") return "";

  let tag = rawTag.trim();
  tag = tag.replace(/[♀♂]/g, "").trim();
  tag = tag.replace(/^(?:female|male|group|parody|character|language):/i, "").trim();
  return tag.replace(/\s+/g, " ");
}

/**
 * Limpia estrictamente el título base del cómic eliminando el nombre del sitio web (Hitomi.la)
 * y reduciendo cualquier 'by <autor>' redundante para evitar duplicaciones.
 * Ejemplo: "Good Teachers 4 by nodo | Hitomi.la" -> "Good Teachers 4"
 * @param {string} rawTitle - Título bruto de la página o documento.
 * @param {string} autorNombre - Nombre del autor detectado.
 * @returns {string} Título base completamente limpio.
 */
export function limpiarTituloBase(rawTitle = "", autorNombre = "") {
  let titulo = (rawTitle || document.title || "").trim();

  // 1. Eliminar sufijos del sitio web (ej. | Hitomi.la, - Hitomi.la, / Hitomi.la, ┃ Hitomi.la)
  titulo = titulo.replace(/\s*[\|║\-\/┃]\s*Hitomi(?:\.la)?.*$/i, "").trim();
  titulo = titulo.replace(/^Read online at Hitomi(?:\.la)?\s*[\|║\-\/┃]\s*/i, "").trim();

  // 2. Eliminar cualquier etiqueta 「...」 preexistente en el cuerpo del título
  titulo = titulo.replace(/「[^」]+」/g, "").trim();

  // 3. Eliminar 'by <autor>' o 'por <autor>' si está presente al final o dentro del título
  const autorLimpio = (autorNombre || "").trim();
  if (autorLimpio) {
    const regexByAutor = new RegExp(`\\s+(?:by|por)\\s+${autorLimpio.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    titulo = titulo.replace(regexByAutor, "").trim();
  }

  // Eliminar cualquier 'by ...' residual al final si fue cortado
  titulo = titulo.replace(/\s+(?:by|por)\s+[\w\s\.\-]+$/i, "").trim();

  // 4. Eliminar delimitadores de tags antiguos que pudieran estar en el título
  titulo = titulo.split("┃")[0].trim();
  titulo = titulo.replace(/\s*[⟨\[\(].*?[⟩\]\)]\s*$/g, "").trim();

  return titulo.replace(/\s+/g, " ");
}

/**
 * Escanea el DOM de la página para extraer todas las etiquetas presentes en <ul id="tags">.
 * @returns {Array<{raw: string, clean: string}>} Lista de objetos de tags extraídos.
 */
export function extraerTagsPagina() {
  const listaTags = [];
  const procesadosSet = new Set();

  try {
    for (const selector of CONFIGURACION.selectoresTags) {
      const elementos = document.querySelectorAll(selector);
      if (elementos && elementos.length > 0) {
        elementos.forEach(el => {
          const textoRaw = (el.textContent || "").trim();
          const textoClean = limpiarNombreTag(textoRaw);

          if (textoClean && !procesadosSet.has(textoClean)) {
            procesadosSet.add(textoClean);
            listaTags.push({
              raw: textoRaw,
              clean: textoClean
            });
          }
        });
        if (listaTags.length > 0) break;
      }
    }
  } catch (e) {
    console.error("Error al extraer tags de la página:", e);
  }

  return listaTags;
}

/**
 * Formatea un arreglo de tags seleccionados aplicando el estilo de separador / envolvente elegido.
 * Estilos:
 *  - 'pipe'   -> " ┃ tag1 tag2"
 *  - 'angle'  -> " ⟨tag1 tag2⟩"
 *  - 'square' -> " [tag1 tag2]"
 *  - 'paren'  -> " (tag1 tag2)"
 * @param {Array<string>} tagsSeleccionados - Arreglo con los nombres limpios de los tags elegidos.
 * @param {string} estiloId - Identificador del estilo ('pipe', 'angle', 'square', 'paren').
 * @returns {string} Cadena formateada según el estilo elegido.
 */
export function formatearCadenaTags(tagsSeleccionados = [], estiloId = null) {
  if (!Array.isArray(tagsSeleccionados) || tagsSeleccionados.length === 0) {
    return "";
  }

  const tagsValidos = tagsSeleccionados
    .map(t => (typeof t === "string" ? limpiarNombreTag(t) : (typeof t === "object" && t ? limpiarNombreTag(t.clean || t.raw) : "")))
    .filter(Boolean);

  if (tagsValidos.length === 0) return "";

  const estiloFinal = estiloId || (typeof GM_getValue !== "undefined" ? GM_getValue(CLAVES.estiloSeparador, "pipe") : "pipe");
  const configEstilo = ESTILOS_SEPARADOR[estiloFinal] || ESTILOS_SEPARADOR.pipe;
  return `${configEstilo.prefijo}${tagsValidos.join(" ")}${configEstilo.sufijo}`;
}

/**
 * Genera el título/nombre final completo combinando autor, título base limpio y la sección de tags.
 * Formatos de salida:
 *  - Sin tags: 「Nodo」 Good Teachers 4
 *  - Con tags (pipe):  「Nodo」 Good Teachers 4 ┃ girls blonde schoolgirl
 *  - Con tags (angle): 「Nodo」 Good Teachers 4 ⟨girls blonde schoolgirl⟩
 * @param {Object} opciones - Parámetros de formateo.
 * @param {string} opciones.tituloOriginal - Título original bruto.
 * @param {string} opciones.autor - Nombre del autor.
 * @param {Array<string>} opciones.tagsSeleccionados - Lista de tags seleccionados.
 * @param {string} opciones.estiloSeparador - Estilo del separador ('pipe', 'angle', etc.).
 * @returns {string} Nombre final estructurado sin repeticiones ni sitio web.
 */
export function obtenerNombreFinalCompleto(opciones = {}) {
  const {
    tituloOriginal = "",
    autor = null,
    tagsSeleccionados = [],
    estiloSeparador = null
  } = opciones;

  // Elemento 1 (Prefijo): Autor o Grupo formateado (ej. 「Nodo」, 「Kemusi」 o 「Unknown」 si es N/A)
  const autorTarget = (autor !== null && autor !== undefined && String(autor).trim() !== "")
    ? String(autor).trim()
    : obtenerAutorOEstadoInicial();
  const autorFormateado = formatearNombreAutor(autorTarget);

  // Elemento 2 (Cuerpo Principal): Título base completamente limpio
  const tituloLimpio = limpiarTituloBase(tituloOriginal, autorTarget);

  // Elemento 3 (Sufijo): Tags con su respectivo separador/envolvente (ej. ┃ tags / ⟨tags⟩)
  const seccionTags = formatearCadenaTags(tagsSeleccionados, estiloSeparador);

  // Construcción desacoplada de los 3 elementos
  let nombreFinal = `${autorFormateado} ${tituloLimpio}`.trim();
  if (seccionTags) {
    nombreFinal = `${nombreFinal}${seccionTags}`;
  }

  return nombreFinal;
}

/**
 * Formatea el título de un cómic con su autor para visualización general.
 * @param {string} tituloBruto - Título original del cómic.
 * @param {string} autorNombre - Nombre del autor del cómic (opcional).
 * @returns {string} Título formateado con autor.
 */
export function obtenerTituloConAutor(tituloBruto = "", autorNombre = "") {
  return obtenerNombreFinalCompleto({ tituloOriginal: tituloBruto, autor: autorNombre });
}
