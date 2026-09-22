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
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase())
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
 * Extrae el nombre del grupo/círculo publicador presente en la página actual de Hitomi.
 * Inspecciona elementos como <td id="groups">, listas de comas y enlaces /group/.
 * @returns {string} El nombre del grupo extraído o cadena vacía si no se encuentra.
 */
export function extraerNombreGrupo() {
  try {
    for (const selector of CONFIGURACION.selectoresGrupo) {
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

    // Fallback: Buscar en la tabla de información de la galería por 'group' o 'grupo'
    const celdas = document.querySelectorAll("td, th, .gallery-info tr");
    for (let i = 0; i < celdas.length; i++) {
      const contenido = (celdas[i].textContent || "").toLowerCase();
      if (contenido.includes("group") || contenido.includes("grupo")) {
        const enlace = celdas[i].parentElement ? celdas[i].parentElement.querySelector("a") : null;
        if (enlace && enlace.textContent.trim()) {
          return enlace.textContent.trim();
        }
      }
    }
  } catch (e) {
    console.error("Error al extraer nombre del grupo:", e);
  }
  return "";
}

/**
 * Obtiene el autor primario o aplica fallback automático al grupo publicador si el autor es N/A.
 * Si tanto el autor como el grupo son N/A o no existen, retorna "N/A".
 * @returns {string} Nombre del autor, del grupo o "N/A".
 */
export function obtenerAutorOEstadoInicial() {
  const autor = extraerNombreAutor();
  const esAutorInvalido =
    !autor ||
    /^n\/?a$/i.test(autor.trim()) ||
    /^none$/i.test(autor.trim()) ||
    /^unknown$/i.test(autor.trim());

  if (!esAutorInvalido) {
    return autor;
  }

  const grupo = extraerNombreGrupo();
  const esGrupoInvalido =
    !grupo ||
    /^n\/?a$/i.test(grupo.trim()) ||
    /^none$/i.test(grupo.trim()) ||
    /^unknown$/i.test(grupo.trim());

  if (!esGrupoInvalido) {
    return grupo;
  }

  return "N/A";
}

/**
 * Formatea un nombre de autor capitalizándolo y envolviéndolo en comillas japonesas 「xxxx」.
 * Si el autor es "N/A", "n/a", "none" o está vacío, se sobreescribe como 「Unknown」
 * para prevenir errores de nombrado en el sistema de archivos de Windows.
 * Ejemplo: "nodo" -> "「Nodo」"
 * Ejemplo: "N/A"  -> "「Unknown」"
 * @param {string} autor - Nombre del autor.
 * @returns {string} Nombre formateado en comillas japonesas 「xxxx」.
 */
export function formatearNombreAutor(autor) {
  let autorLimpio = (autor || "").trim();
  // Eliminar comillas japonesas preexistentes si el usuario las introdujo manualmente
  autorLimpio = autorLimpio.replace(/^「\s*/, "").replace(/\s*」$/, "").trim();

  const esInvalidoOSinAutor =
    !autorLimpio ||
    /^n\/?a$/i.test(autorLimpio) ||
    /^none$/i.test(autorLimpio) ||
    /^unknown$/i.test(autorLimpio);

  if (esInvalidoOSinAutor) {
    return "「Unknown」";
  }

  const nombreCapitalizado = capitalizarNombre(autorLimpio);
  return `「${nombreCapitalizado}」`;
}
