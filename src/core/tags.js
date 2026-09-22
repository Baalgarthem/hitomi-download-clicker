// ─────────────────────────────────────────────
// Extracción de Tags y Formateo Personalizado (┃ / ⟨⟩ / [] / ())
// ─────────────────────────────────────────────

import { CONFIGURACION, ESTILOS_SEPARADOR, CLAVES } from '../config/constants.js';
import { sanearNombreArchivoFileSystem, leerValorGM } from '../utils/dom.js';
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
  let titulo = (rawTitle || "").trim();

  // Si el título viene vacío, es genérico del sitio o es una URL, buscar en elementos H1 del DOM
  if (!titulo || /^(?:hitomi(?:\.la)?|read online at hitomi(?:\.la)?)$/i.test(titulo) || titulo.startsWith("http")) {
    const elH1 = typeof document !== "undefined" ? document.querySelector("h1 a, #gallery-brand a, .gallery-info h1, h1") : null;
    if (elH1 && elH1.textContent) {
      titulo = elH1.textContent.trim();
    }
  }

  if (!titulo && typeof document !== "undefined") {
    titulo = document.title || location.href || "";
  }

  // 1. Eliminar sufijos del sitio web (ej. | Hitomi.la, - Hitomi.la, / Hitomi.la, ┃ Hitomi.la)
  titulo = titulo.replace(/\s*[\|║\-\/┃]\s*Hitomi(?:\.la)?.*$/i, "").trim();
  titulo = titulo.replace(/^Read online at Hitomi(?:\.la)?\s*[\|║\-\/┃]\s*/i, "").trim();

  // 2. Eliminar cualquier etiqueta 「...」 o corchete de serie 【...】 preexistente en el cuerpo del título
  titulo = titulo.replace(/「[^」]+」/g, "").replace(/【[^】]+】/g, "").trim();

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
 * Capitaliza cada palabra de una cadena de texto (Title Case).
 * Ejemplo: "gundam wing" -> "Gundam Wing"
 * @param {string} str - Nombre bruto de la serie.
 * @returns {string} Nombre de la serie formateado en Title Case.
 */
export function capitalizarSerie(str = "") {
  if (!str || typeof str !== "string") return "";
  let texto = str.trim();
  texto = texto.replace(/\s*-\s*all$/i, "").trim();

  if (/^(?:n\/?a|none)$/i.test(texto)) return "";

  return texto.replace(/\b[a-zA-ZáéíóúÁÉÍÓÚñÑ]+/g, word => {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}

/**
 * Escanea el DOM de la página para extraer el nombre de la serie (si está presente).
 * @returns {string} Serie limpia y capitalizada.
 */
export function extraerSeriePagina() {
  try {
    if (typeof document === "undefined") return "";
    for (const selector of CONFIGURACION.selectoresSerie) {
      const el = document.querySelector(selector);
      if (el && el.textContent) {
        const limpia = capitalizarSerie(el.textContent);
        if (limpia) return limpia;
      }
    }
  } catch (e) {
    console.error("Error al extraer serie de la página:", e);
  }
  return "";
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

  const estiloFinal = estiloId || leerValorGM(CLAVES.estiloSeparador, "pipe");

  const configEstilo = ESTILOS_SEPARADOR[estiloFinal] || ESTILOS_SEPARADOR.pipe;
  return `${configEstilo.prefijo}${tagsValidos.join(" ")}${configEstilo.sufijo}`;
}

/**
 * Genera el título/nombre final completo combinando autor, título base limpio, tags y sufijo de serie.
 * Formatos de salida:
 *  - Sin tags ni serie: 「Nodo」 Good Teachers 4
 *  - Con tags: 「Nodo」 Good Teachers 4 ┃ girls blonde schoolgirl
 *  - Con tags y serie: 「Nodo」 Good Teachers 4 ┃ girls blonde 【Gundam Wing】
 * @param {Object} opciones - Parámetros de formateo.
 * @param {string} opciones.tituloOriginal - Título original bruto.
 * @param {string} opciones.autor - Nombre del autor.
 * @param {Array<string>} opciones.tagsSeleccionados - Lista de tags seleccionados.
 * @param {string} opciones.estiloSeparador - Estilo del separador ('pipe', 'angle', etc.).
 * @param {string} opciones.serie - Nombre de la serie (opcional).
 * @param {boolean} opciones.incluirSerie - Si debe forzarse la inclusión de la serie.
 * @returns {string} Nombre final estructurado sin repeticiones ni sitio web.
 */
export function obtenerNombreFinalCompleto(opciones = {}) {
  const {
    tituloOriginal = "",
    autor = null,
    tagsSeleccionados = [],
    personajesSeleccionados = [],
    estiloSeparador = null,
    serie = null,
    incluirSerie = null
  } = opciones;

  // Elemento 1 (Prefijo): Autor o Grupo formateado (ej. 「Nodo」, 「Kemusi」 o 「Unknown」 si es N/A)
  const autorTarget = (autor !== null && autor !== undefined && String(autor).trim() !== "")
    ? String(autor).trim()
    : obtenerAutorOEstadoInicial();
  const autorFormateado = formatearNombreAutor(autorTarget);

  // Elemento 2 (Cuerpo Principal): Título base completamente limpio
  const tituloLimpio = limpiarTituloBase(tituloOriginal, autorTarget);

  // Elemento 3: Tags con su respectivo separador/envolvente (ej. ┃ tags / ⟨tags⟩)
  const seccionTags = formatearCadenaTags(tagsSeleccionados, estiloSeparador);

  // Elemento 4 (Sufijo Serie): Serie con corchetes japoneses 【Serie】 al final del nombre si la opción está activa
  const debeIncluirSerie = incluirSerie !== null ? incluirSerie : leerValorGM(CLAVES.incluirSerie, false);
  let seccionSerie = "";

  if (debeIncluirSerie) {
    const serieRaw = (serie !== null && serie !== undefined && String(serie).trim() !== "")
      ? String(serie).trim()
      : extraerSeriePagina();
    const serieLimpia = capitalizarSerie(serieRaw);
    if (serieLimpia) {
      seccionSerie = ` 【${serieLimpia}】`;
    }
  }

  // Elemento 5 (Sufijo Personajes): Personajes seleccionados entre corchetes japoneses 【Personaje1 Personaje2】 siempre después de la serie
  const seccionPersonajes = formatearCadenaPersonajes(personajesSeleccionados);

  // Construcción desacoplada de los elementos y saneamiento estricto para FileSystem
  let nombreFinal = `${autorFormateado} ${tituloLimpio}`.trim();
  if (seccionTags) {
    nombreFinal = `${nombreFinal}${seccionTags}`;
  }
  if (seccionSerie) {
    nombreFinal = `${nombreFinal}${seccionSerie}`;
  }
  if (seccionPersonajes) {
    nombreFinal = `${nombreFinal}${seccionPersonajes}`;
  }

  return sanearNombreArchivoFileSystem(nombreFinal);
}

/**
 * Capitaliza cada palabra de un nombre de personaje (Title Case).
 * Ejemplo: "relena peacecraft" -> "Relena Peacecraft"
 * Ejemplo: "dermail catalonia" -> "Dermail Catalonia"
 * @param {string} str - Nombre bruto del personaje.
 * @returns {string} Nombre del personaje formateado en Title Case.
 */
export function capitalizarPersonaje(str = "") {
  if (!str || typeof str !== "string") return "";
  let texto = str.trim();
  texto = texto.replace(/\s*-\s*all$/i, "").trim();
  texto = texto.replace(/^character:/i, "").trim();
  texto = texto.replace(/[♀♂]/g, "").trim();

  if (/^(?:n\/?a|none)$/i.test(texto)) return "";

  return texto.replace(/\b[a-zA-ZáéíóúÁÉÍÓÚñÑ]+/g, word => {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}

/**
 * Escanea el DOM de la página para extraer los personajes presentes en <ul id="characters">.
 * @returns {Array<string>} Lista de nombres de personajes limpios y capitalizados.
 */
export function extraerPersonajesPagina() {
  const listaPersonajes = [];
  const procesadosSet = new Set();
  try {
    if (typeof document === "undefined") return [];
    for (const selector of CONFIGURACION.selectoresPersonajes) {
      const elementos = document.querySelectorAll(selector);
      if (elementos && elementos.length > 0) {
        elementos.forEach(el => {
          const raw = (el.textContent || "").trim();
          const clean = capitalizarPersonaje(raw);
          if (clean && !procesadosSet.has(clean)) {
            procesadosSet.add(clean);
            listaPersonajes.push(clean);
          }
        });
        if (listaPersonajes.length > 0) break;
      }
    }
  } catch (e) {
    console.error("Error al extraer personajes de la página:", e);
  }
  return listaPersonajes;
}

/**
 * Formatea un arreglo de personajes seleccionados en el sufijo corchete japonés 【Personaje1 Personaje2】.
 * @param {Array<string>} personajesSeleccionados - Arreglo de personajes seleccionados.
 * @returns {string} Cadena formateada ej. " 【Relena Peacecraft Dermail Catalonia】".
 */
export function formatearCadenaPersonajes(personajesSeleccionados = []) {
  if (!Array.isArray(personajesSeleccionados) || personajesSeleccionados.length === 0) {
    return "";
  }
  const limpios = personajesSeleccionados.map(p => capitalizarPersonaje(p)).filter(Boolean);
  if (limpios.length === 0) return "";
  return ` 【${limpios.join(" ")}】`;
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
