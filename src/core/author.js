// ─────────────────────────────────────────────
// Extracción de Autor y Formateo en Comillas Japonesas 「xxxx」
// ─────────────────────────────────────────────

import { CONFIGURACION } from '../config/constants.js';

/**
 * Capitaliza adecuadamente la primera letra de cada palabra de un texto.
 * Ejemplo: "nodo" -> "Nodo", "john doe" -> "John Doe"
 * @param {string} texto - Texto a capitalizar.
 * @returns {string} Texto capitalizado.
 */
export function capitalizarNombre(texto = "") {
  if (!texto || typeof texto !== "string") return "";
  return texto
    .trim()
    .split(/\s+/)
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(" ");
}

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

    // Fallback: Buscar en la tabla de información de la galería
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
 * Formatea un nombre de autor capitalizándolo y envolviéndolo en comillas japonesas 「xxxx」.
 * Ejemplo: "nodo" -> "「Nodo」"
 * @param {string} autor - Nombre del autor.
 * @returns {string} Nombre formateado como 「Nodo」 o vacío si autor no es válido.
 */
export function formatearNombreAutor(autor) {
  const nombreLimpio = capitalizarNombre(autor || "");
  if (!nombreLimpio) return "";
  return `「${nombreLimpio}」`;
}
