// ─────────────────────────────────────────────
// Utilidades generales y manipulación DOM
// ─────────────────────────────────────────────

export const esperar = milisegundos => new Promise(resolver => setTimeout(resolver, milisegundos));

export const obtenerHora = () => `[${new Date().toTimeString().slice(0, 8)}]`;

export const esPaginaHitomi = () => /^https?:\/\/(?:www\.)?hitomi\.la\//i.test(location.href);

export function normalizarUrl(url) {
  if (!url || typeof url !== "string") return "";
  try {
    const urlObjeto = new URL(url.trim());
    return `${urlObjeto.protocol}//${urlObjeto.host.toLowerCase()}${urlObjeto.pathname.replace(/\/+$/, "")}`;
  } catch {
    return url.trim().split("#")[0].split("?")[0].replace(/\/+$/, "");
  }
}

export function elementoVisible(elemento) {
  if (!elemento || !document.body || !document.body.contains(elemento)) return false;
  try {
    const estilo = getComputedStyle(elemento);
    const rectangulo = elemento.getBoundingClientRect();
    return (
      estilo.display !== "none" &&
      estilo.visibility !== "hidden" &&
      estilo.opacity !== "0" &&
      (rectangulo.width > 0 || elemento.offsetWidth > 0) &&
      (rectangulo.height > 0 || elemento.offsetHeight > 0)
    );
  } catch {
    return false;
  }
}

/**
 * Escapa caracteres HTML especiales para prevenir vulnerabilidades XSS en plantillas de la UI.
 * @param {string} texto - Texto a escapar.
 * @returns {string} Texto seguro con entidades HTML escapadas.
 */
export function escapeHtml(texto = "") {
  return (texto || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Obtiene el contenedor principal o lo crea aislándolo en la raíz del DOM.
 * @param {string} idAnfitrion - Identificador DOM del contenedor.
 * @returns {HTMLElement} Elemento anfitrión listo.
 */
export function obtenerOCrearAnfitrionUI(idAnfitrion) {
  let anfitrion = document.getElementById(idAnfitrion);

  if (!anfitrion) {
    anfitrion = document.createElement("div");
    anfitrion.id = idAnfitrion;

    Object.assign(anfitrion.style, {
      all: "initial",
      position: "fixed",
      inset: "0",
      zIndex: "2147483647",
      pointerEvents: "none"
    });

    (document.body || document.documentElement).appendChild(anfitrion);
  }

  return anfitrion;
}

/**
 * Inyecta reglas CSS de forma compatible entre Tampermonkey, Violentmonkey y Greasemonkey (Chromium y Firefox).
 * @param {string} css - Estilos CSS a inyectar.
 */
export function inyectarEstilos(css = "") {
  if (!css || typeof css !== "string") return;
  try {
    if (typeof GM_addStyle !== "undefined") {
      GM_addStyle(css);
    } else {
      const estilo = document.createElement("style");
      estilo.textContent = css;
      (document.head || document.documentElement).appendChild(estilo);
    }
  } catch {
    try {
      const estilo = document.createElement("style");
      estilo.textContent = css;
      (document.head || document.documentElement).appendChild(estilo);
    } catch (e) {
      console.error("Error al inyectar estilos CSS:", e);
    }
  }
}

/**
 * Sanea un nombre de archivo para garantizar total compatibilidad con todos los sistemas de archivos
 * (Linux ext4/btrfs, Windows NTFS/FAT32, macOS APFS) y gestores de descargas en Chromium y Firefox.
 * Reemplaza o remueve caracteres prohibidos (\, /, :, *, ?, ", <, >, |) y caracteres de control.
 * @param {string} nombre - Nombre del archivo o título.
 * @returns {string} Nombre saneado y seguro.
 */
export function sanearNombreArchivoFileSystem(nombre = "") {
  if (!nombre || typeof nombre !== "string") return "";

  let saneado = nombre.trim();

  // 1. Reemplazar barras / y \ por guion medio seguro
  saneado = saneado.replace(/[\/\\]/g, "-");

  // 2. Reemplazar dos puntos : por espacio + guion medio
  saneado = saneado.replace(/:/g, " -");

  // 3. Reemplazar caracteres prohibidos en Windows/Linux (\0-\x1F, *, ?, ", <, >, |)
  saneado = saneado.replace(/[\x00-\x1F\*\?"<>\|]/g, "");

  // 4. Normalizar comillas y caracteres problémicos adicionales
  saneado = saneado.replace(/[\u201C\u201D]/g, "'");

  // 5. Reducir múltiples espacios o guiones consecutivos
  saneado = saneado.replace(/\s+/g, " ");
  saneado = saneado.replace(/-{2,}/g, "-");

  // 6. Remover puntos o espacios al final (no permitidos en Windows/Linux)
  saneado = saneado.replace(/[\.\s]+$/, "");

  // 7. Limitar longitud máxima razonable (200 caracteres)
  if (saneado.length > 200) {
    saneado = saneado.slice(0, 200).trim();
  }

  return saneado;
}
