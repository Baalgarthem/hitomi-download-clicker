// ─────────────────────────────────────────────
// Extracción de Tags y Formateo ┃ + tags
// ─────────────────────────────────────────────

import { CONFIGURACION } from '../config/constants.js';

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
  // Remover símbolos de género
  tag = tag.replace(/[♀♂]/g, "").trim();
  // Remover prefijos comunes de categoría (ej. female: o male:)
  tag = tag.replace(/^(?:female|male|group|parody|character|language):/i, "").trim();
  // Normalizar espacios múltiples
  return tag.replace(/\s+/g, " ");
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
 * Formatea un arreglo de tags seleccionados con el símbolo delimitador ' ┃ + tags'.
 * Ejemplo: ["glasses", "squirt", "sea", "dog"] -> " ┃ glasses squirt sea dog"
 * @param {Array<string>} tagsSeleccionados - Arreglo con los nombres limpios de los tags elegidos.
 * @returns {string} Cadena formateada como " ┃ tag1 tag2 ..." o vacía si no hay tags.
 */
export function formatearCadenaTags(tagsSeleccionados = []) {
  if (!Array.isArray(tagsSeleccionados) || tagsSeleccionados.length === 0) {
    return "";
  }

  const tagsValidos = tagsSeleccionados
    .map(t => (typeof t === "string" ? limpiarNombreTag(t) : ""))
    .filter(Boolean);

  if (tagsValidos.length === 0) return "";

  return ` ┃ ${tagsValidos.join(" ")}`;
}

/**
 * Genera el título/nombre final completo combinando autor, título base y la sección de tags.
 * Ejemplo: 「Artista」 nombre del comic ┃ viajes chicas rubia
 * @param {Object} opciones - Parámetros de formateo.
 * @param {string} opciones.tituloOriginal - Título base del comic.
 * @param {string} opciones.autorFormateado - Nombre del autor ya formateado como 「Artista」.
 * @param {Array<string>} opciones.tagsSeleccionados - Lista de tags seleccionados.
 * @returns {string} Nombre final estructurado.
 */
export function obtenerNombreFinalCompleto(opciones = {}) {
  const { tituloOriginal = "", autorFormateado = "", tagsSeleccionados = [] } = opciones;

  let resultado = (tituloOriginal || document.title || "").trim();

  // Integrar autor si no está ya incluido
  if (autorFormateado && !resultado.includes(autorFormateado)) {
    resultado = `${autorFormateado} ${resultado}`.trim();
  }

  // Concatenar tags elegidos
  const seccionTags = formatearCadenaTags(tagsSeleccionados);
  if (seccionTags && !resultado.includes("┃")) {
    resultado = `${resultado}${seccionTags}`;
  }

  return resultado;
}
