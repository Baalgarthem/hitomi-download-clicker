// ─────────────────────────────────────────────
// Detección Multinivel y Ejecución del Botón de Descarga
// ─────────────────────────────────────────────

import { CONFIGURACION, ESTADO, CLAVES } from '../config/constants.js';
import { elementoVisible, esperar, obtenerHora } from '../utils/dom.js';
import { obtenerEstadoPaginaProcesada, guardarPaginaProcesada } from './memory.js';
import { vincularEventosBotonDescarga, marcarBotonComoProcesado } from '../ui/badge.js';
import { extraerNombreAutor, obtenerAutorOEstadoInicial } from './author.js';
import { obtenerNombreFinalCompleto, formatearCadenaTags } from './tags.js';

export function obtenerElementoBotonDescarga() {
  try {
    const botonPrincipal = document.querySelector(CONFIGURACION.selectorBotonDescarga);
    if (botonPrincipal && elementoVisible(botonPrincipal)) {
      return botonPrincipal;
    }

    for (const selector of CONFIGURACION.selectoresAlternativosBoton) {
      const candidato = document.querySelector(selector);
      if (candidato && elementoVisible(candidato)) {
        return candidato;
      }
    }

    const elementosInteractivos = document.querySelectorAll("button, a, div[role='button'], span[role='button']");
    for (let i = 0; i < elementosInteractivos.length; i++) {
      const el = elementosInteractivos[i];
      if (!elementoVisible(el)) continue;

      const id = (el.id || "").toLowerCase();
      const clase = (el.className || "").toString().toLowerCase();
      const texto = (el.textContent || "").toLowerCase();
      const title = (el.getAttribute("title") || "").toLowerCase();
      const ariaLabel = (el.getAttribute("aria-label") || "").toLowerCase();

      if (
        id.includes("dl-button") ||
        id.includes("download") ||
        clase.includes("download") ||
        texto.includes("download") ||
        texto.includes("descargar") ||
        title.includes("download") ||
        ariaLabel.includes("download")
      ) {
        return el;
      }
    }
  } catch (e) {
    console.error("Error al buscar elemento de botón de descarga:", e);
  }
  return null;
}

export async function buscarBotonDescarga(opciones = {}) {
  const intentos = opciones.intentos ?? CONFIGURACION.intentosBusquedaBoton;
  const pausa = opciones.pausa ?? CONFIGURACION.intervaloBusquedaBoton;

  for (let intento = 0; intento < intentos; intento++) {
    try {
      const boton = obtenerElementoBotonDescarga();
      if (boton) {
        vincularEventosBotonDescarga(boton);
        return boton;
      }
    } catch (e) {
      console.error("Error en búsqueda de botón:", e);
    }
    await esperar(pausa);
  }
  return null;
}

let interceptorRegistrado = false;

/**
 * Intercepta de forma global los clics en elementos <a> creados dinámicamente o presentes en el DOM,
 * garantizando que el nombre final del archivo (con formato 「Autor」 Nombre ┃ tags) sea inyectado
 * como el atributo 'download' nativo del navegador antes de disparar la descarga.
 */
export function interceptarDescargasNativas() {
  if (interceptorRegistrado || typeof HTMLAnchorElement === "undefined") return;
  interceptorRegistrado = true;

  try {
    const originalClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function (...args) {
      try {
        const nombreCustom = ESTADO.ultimoNombreFinal;
        if (nombreCustom) {
          const usarCbz = typeof GM_getValue !== "undefined" ? GM_getValue(CLAVES.usarCbz, false) : false;
          let nombreConExt = "";

          if (usarCbz) {
            const baseLimpia = nombreCustom.replace(/\.zip$/i, "").replace(/\.cbz$/i, "");
            nombreConExt = `${baseLimpia}.cbz`;
          } else {
            const downloadAttr = this.getAttribute("download") || this.download || "";
            const hrefAttr = this.getAttribute("href") || this.href || "";

            const matchExt = (downloadAttr || hrefAttr).match(/\.([a-z0-9]{2,4})(?:[\?#]|$)/i);
            const extension = matchExt ? `.${matchExt[1]}` : "";

            nombreConExt = `${nombreCustom}${extension}`;
          }

          this.setAttribute("download", nombreConExt);
          this.download = nombreConExt;
        }
      } catch (err) {
        console.error("Error en interceptor de descargas nativas:", err);
      }
      return originalClick.apply(this, args);
    };
  } catch (e) {
    console.error("Error al registrar interceptor de descargas nativas:", e);
  }
}

export function confirmarYEjecutarClic(boton, esForzado = false, tagsSeleccionados = [], estiloSeparador = null, tituloPersonalizado = null, autorPersonalizado = null) {
  if (!boton) return false;

  let fueClickeadoConExito = false;

  try {
    interceptarDescargasNativas();

    const teniaProcesado = boton.getAttribute("data-hitomi-procesado");
    const estiloPointerPrevio = boton.style.pointerEvents;
    const deshabilitadoPrevio = boton.disabled;

    const estiloActivo = estiloSeparador || (typeof GM_getValue !== "undefined" ? GM_getValue(CLAVES.estiloSeparador, "pipe") : "pipe");
    const autorTarget = (autorPersonalizado && typeof autorPersonalizado === "string" && autorPersonalizado.trim())
      ? autorPersonalizado.trim()
      : obtenerAutorOEstadoInicial();
    const tituloBase = (tituloPersonalizado && typeof tituloPersonalizado === "string" && tituloPersonalizado.trim())
      ? tituloPersonalizado.trim()
      : document.title;

    const nombreFinalCompleto = obtenerNombreFinalCompleto({
      tituloOriginal: tituloBase,
      autor: autorTarget,
      tagsSeleccionados,
      estiloSeparador: estiloActivo
    });

    if (nombreFinalCompleto) {
      const usarCbz = typeof GM_getValue !== "undefined" ? GM_getValue(CLAVES.usarCbz, false) : false;
      const nombreFinalConExt = usarCbz
        ? (nombreFinalCompleto.endsWith(".cbz") ? nombreFinalCompleto : `${nombreFinalCompleto}.cbz`)
        : nombreFinalCompleto;

      ESTADO.ultimoNombreFinal = nombreFinalCompleto;
      try {
        document.title = nombreFinalCompleto;
      } catch { }

      boton.setAttribute("data-hitomi-nombre-final", nombreFinalConExt);
      if (tagsSeleccionados.length > 0) {
        boton.setAttribute("data-hitomi-tags", formatearCadenaTags(tagsSeleccionados, estiloActivo));
      }
      boton.setAttribute("title", nombreFinalConExt);
      boton.setAttribute("download", nombreFinalConExt);
      if ("download" in boton) boton.download = nombreFinalConExt;

      const enlacesHijos = boton.querySelectorAll("a");
      enlacesHijos.forEach(a => {
        a.setAttribute("download", nombreFinalConExt);
        a.download = nombreFinalConExt;
      });
    }

    ESTADO.permitirClicForzado = true;
    boton.removeAttribute("data-hitomi-procesado");
    boton.style.pointerEvents = "auto";
    if ("disabled" in boton) boton.disabled = false;

    let eventoCapturado = false;

    const comprobadorClic = () => {
      eventoCapturado = true;
    };

    boton.addEventListener("click", comprobadorClic, { capture: true, once: true });

    if (typeof boton.focus === "function") {
      try { boton.focus(); } catch { }
    }

    if (typeof boton.click === "function") {
      boton.click();
    } else {
      const mouseEvent = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window
      });
      boton.dispatchEvent(mouseEvent);
    }

    fueClickeadoConExito = true;

    if (esForzado) {
      ESTADO.permitirClicForzado = false;
      if (teniaProcesado) boton.setAttribute("data-hitomi-procesado", teniaProcesado);
      boton.style.pointerEvents = estiloPointerPrevio;
      if ("disabled" in boton) boton.disabled = deshabilitadoPrevio;
    } else {
      ESTADO.permitirClicForzado = false;
    }
  } catch (e) {
    ESTADO.permitirClicForzado = false;
    console.error("Error al ejecutar y confirmar clic real:", e);
    fueClickeadoConExito = false;
  }

  return fueClickeadoConExito;
}

export async function ejecutarOrdenDescarga(identificadorOrden, opciones = {}) {
  const { forzar = false, tagsSeleccionados = [], estiloSeparador = null, tituloPersonalizado = null, autorPersonalizado = null } = opciones;

  if (ESTADO.ordenesEjecutadas.has(identificadorOrden)) {
    return "orden_repetida";
  }

  const estadoPagina = obtenerEstadoPaginaProcesada(location.href);

  if (!forzar && estadoPagina.procesada) {
    const botonActual = await buscarBotonDescarga({ intentos: 3, pausa: 100 });
    if (botonActual) marcarBotonComoProcesado(botonActual, estadoPagina.esForzada);
    return "ya_procesada";
  }

  const boton = await buscarBotonDescarga();
  if (!boton) {
    return "sin_boton";
  }

  if (!forzar && boton.getAttribute("data-hitomi-procesado") === "true") {
    return "ya_procesada";
  }

  try {
    ESTADO.ordenesEjecutadas.add(identificadorOrden);

    const clicConfirmado = confirmarYEjecutarClic(boton, forzar, tagsSeleccionados, estiloSeparador, tituloPersonalizado, autorPersonalizado);

    if (!clicConfirmado) {
      console.warn(obtenerHora(), "Clic no confirmado o bloqueado en el elemento objetivo.");
      return "error_click";
    }

    guardarPaginaProcesada(location.href, forzar);
    marcarBotonComoProcesado(boton, forzar);

    await esperar(400);
    return "correcto";
  } catch (error) {
    ESTADO.permitirClicForzado = false;
    console.error("Error al ejecutar orden de descarga en esta pestaña:", error);
    return "error";
  }
}
