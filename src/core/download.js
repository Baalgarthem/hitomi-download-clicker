// ─────────────────────────────────────────────
// Detección Multinivel y Ejecución del Botón de Descarga
// ─────────────────────────────────────────────

import { CONFIGURACION, ESTADO } from '../config/constants.js';
import { elementoVisible, esperar, obtenerHora } from '../utils/dom.js';
import { obtenerEstadoPaginaProcesada, guardarPaginaProcesada } from './memory.js';
import { vincularEventosBotonDescarga, marcarBotonComoProcesado } from '../ui/badge.js';
import { extraerNombreAutor, formatearNombreAutor } from './author.js';
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

export function confirmarYEjecutarClic(boton, esForzado = false, tagsSeleccionados = []) {
  if (!boton) return false;

  let fueClickeadoConExito = false;

  try {
    const teniaProcesado = boton.getAttribute("data-hitomi-procesado");
    const estiloPointerPrevio = boton.style.pointerEvents;
    const deshabilitadoPrevio = boton.disabled;

    // Extraer autor y formatear el nombre final completo: 「Artista」 Nombre ┃ tags
    const autor = extraerNombreAutor();
    const autorFormateado = formatearNombreAutor(autor);
    const nombreFinalCompleto = obtenerNombreFinalCompleto({
      tituloOriginal: document.title,
      autorFormateado,
      tagsSeleccionados
    });

    if (nombreFinalCompleto) {
      boton.setAttribute("data-hitomi-nombre-final", nombreFinalCompleto);
      if (tagsSeleccionados.length > 0) {
        boton.setAttribute("data-hitomi-tags", formatearCadenaTags(tagsSeleccionados));
      }
      boton.setAttribute("title", nombreFinalCompleto);
      if (boton.hasAttribute("download") || boton.tagName.toLowerCase() === "a") {
        boton.setAttribute("download", nombreFinalCompleto);
      }
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

    if (eventoCapturado) {
      fueClickeadoConExito = true;
    } else {
      fueClickeadoConExito = true;
    }

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
  const { forzar = false, tagsSeleccionados = [] } = opciones;

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

    const clicConfirmado = confirmarYEjecutarClic(boton, forzar, tagsSeleccionados);

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
