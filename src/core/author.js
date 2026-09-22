// ─────────────────────────────────────────────
// Extracción de Autor y Formateo en Comillas Japonesas 「xxxx」
// ─────────────────────────────────────────────

import { CONFIGURACION } from '../config/constants.js';

/**
 * Extrae el nombre del autor o artistas presentes en la página actual de Hitomi.
 * Inspecciona elementos como <h2 id="artists">, listas de comas y fallbacks.
 * @returns {string} El nombre del autor extraído o cadena vacía si no se encuentra.
 */
export function extraerNombreAutor() {
  try {
    for (const selector of CONFIGURACION.selectoresArtista) {
      const elementos = document.querySelectorAll(selector);
      if (elementos && elementos.length > 0) {
        const nombres = [];
        elementos.forEach(el => {
          const texto = (el.textContent || "").trim();
          if (texto && !nombres.includes(texto)) {
            nombres.push(texto);
          }
        });
        if (nombres.length > 0) {
          return nombres.join(", ");
        }
      }
    }

    // Fallback: Buscar en la tabla de información de la galería (ej. td que contenga Artist)
    const celdas = document.querySelectorAll("td, th, .gallery-info tr");
    for (let i = 0; i < celdas.length; i++) {
      const contenido = (celdas[i].textContent || "").toLowerCase();
      if (contenido.includes("artist") || contenido.includes("artista")) {
        const enlace = celdas[i].parentElement ? celdas[i].parentElement.querySelector("a") : null;
        if (enlace && enlace.textContent.trim()) {
          return enlace.textContent.trim();
        }
      }
    }
  } catch (e) {
    console.error("Error al extraer nombre del autor:", e);
  }
  return "";
}

/**
 * Formatea un nombre de autor envolviéndolo en comillas japonesas 「xxxx」.
 * @param {string} autor - Nombre del autor.
 * @returns {string} Nombre formateado como 「xxxx」 o vacio si autor no es válido.
 */
export function formatearNombreAutor(autor) {
  const nombreLimpio = (autor || "").trim();
  if (!nombreLimpio) return "";
  return `「${nombreLimpio}」`;
}

/**
 * Obtiene el título de la página integrado con la etiqueta del autor si se encuentra.
 * @param {string} tituloOriginal - Título original de la página o documento.
 * @returns {string} Título completo incluyendo el distintivo 「autor」.
 */
export function obtenerTituloConAutor(tituloOriginal = "") {
  const tituloBase = (tituloOriginal || document.title || location.href).trim();
  const autor = extraerNombreAutor();
  const etiquetaAutor = formatearNombreAutor(autor);

  if (!etiquetaAutor) return tituloBase;
  if (tituloBase.includes(etiquetaAutor)) return tituloBase;

  return `${tituloBase} ${etiquetaAutor}`;
}
