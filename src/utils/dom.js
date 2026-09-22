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
