import { ESTADO, CLAVES } from '../config/constants.js';
import { obtenerEstadoPaginaProcesada, guardarPaginaProcesada, paginaYaProcesada } from '../core/memory.js';
import { obtenerElementoBotonDescarga } from '../core/download.js';
import { publicarEstadoPestana } from '../core/presence.js';
import { obtenerHora, leerValorGM } from '../utils/dom.js';

export function marcarBotonComoProcesado(boton, esForzado = false) {
  if (!boton) return;
  try {
    const estadoMemoria = obtenerEstadoPaginaProcesada(location.href);
    const debeSerForzado = esForzado || estadoMemoria.esForzada;

    boton.setAttribute("data-hitomi-procesado", "true");
    boton.style.opacity = "0.75";
    boton.style.cursor = "not-allowed";

    const badgeBloqueado = boton.querySelector(".hitomi-badge-bloqueado");
    if (badgeBloqueado) badgeBloqueado.remove();

    let badge = boton.querySelector(".hitomi-badge-procesado");
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "hitomi-badge-procesado";
      badge.style.cssText = "font-weight: bold; margin-left: 6px; font-size: 0.88em;";
      boton.appendChild(badge);
    }

    if (debeSerForzado) {
      badge.textContent = " ✓ Re-descargado";
      badge.style.color = "#f59e0b";
    } else {
      badge.textContent = " ✓ Descargado";
      badge.style.color = "#12b886";
    }
  } catch (e) {
    console.error("Error al aplicar estado procesado al botón:", e);
  }
}

export function resetearEstadoBotonDescarga() {
  try {
    const boton = obtenerElementoBotonDescarga();
    if (boton) {
      boton.removeAttribute("data-hitomi-procesado");
      boton.style.opacity = "";
      boton.style.cursor = "";
      const badge = boton.querySelector(".hitomi-badge-procesado");
      if (badge) badge.remove();
      actualizarEstadoVisualBotonNativo(boton);
    }
  } catch (e) {
    console.error("Error al resetear estado del botón:", e);
  }
}

export function actualizarEstadoVisualBotonNativo(boton = null) {
  try {
    const target = boton || obtenerElementoBotonDescarga();
    if (!target) return;

    const estaBloqueadoNativo = leerValorGM(CLAVES.bloquearBotonNativo, false);
    const estaProcesado = target.getAttribute("data-hitomi-procesado") === "true";

    let badgeBloqueado = target.querySelector(".hitomi-badge-bloqueado");

    if (estaBloqueadoNativo && !estaProcesado) {
      target.setAttribute("title", "🔒 Botón nativo bloqueado por Hitomi Clicker (descargas gestionadas desde el panel)");
      if (!badgeBloqueado) {
        badgeBloqueado = document.createElement("span");
        badgeBloqueado.className = "hitomi-badge-bloqueado";
        badgeBloqueado.style.cssText = "font-weight: bold; margin-left: 6px; font-size: 0.88em; color: #f87171;";
        badgeBloqueado.textContent = " 🔒 Bloqueado";
        target.appendChild(badgeBloqueado);
      }
    } else {
      if (badgeBloqueado) badgeBloqueado.remove();
      if (!estaProcesado) {
        target.removeAttribute("title");
      }
    }
  } catch (e) {
    console.error("Error al actualizar estado visual del botón nativo:", e);
  }
}

export function vincularEventosBotonDescarga(boton) {
  if (!boton) return;

  actualizarEstadoVisualBotonNativo(boton);

  if (boton.dataset.hitomiListenerAttached) return;
  boton.dataset.hitomiListenerAttached = "true";

  boton.addEventListener("click", evento => {
    if (ESTADO.permitirClicForzado) {
      return;
    }

    const estaBloqueadoNativo = leerValorGM(CLAVES.bloquearBotonNativo, false);
    if (estaBloqueadoNativo) {
      console.warn(obtenerHora(), "Clic en botón nativo evitado: El botón de descarga nativo está bloqueado por configuración.");
      evento.preventDefault();
      evento.stopImmediatePropagation();
      actualizarEstadoVisualBotonNativo(boton);
      return false;
    }

    if (paginaYaProcesada(location.href) || boton.getAttribute("data-hitomi-procesado") === "true") {
      console.warn(obtenerHora(), "Clic evitado: La página ya ha sido descargada previamente.");
      evento.preventDefault();
      evento.stopImmediatePropagation();
      const estadoLocal = obtenerEstadoPaginaProcesada(location.href);
      marcarBotonComoProcesado(boton, estadoLocal.esForzada);
      return false;
    }

    try {
      guardarPaginaProcesada(location.href, false);
      marcarBotonComoProcesado(boton, false);
      publicarEstadoPestana();
    } catch (e) {
      console.error("Error al registrar clic en botón:", e);
    }
  }, true);
}
