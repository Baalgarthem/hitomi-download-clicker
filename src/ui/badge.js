// ─────────────────────────────────────────────
// Estado Visual del Botón de Descarga e Insignias
// ─────────────────────────────────────────────

import { ESTADO } from '../config/constants.js';
import { obtenerEstadoPaginaProcesada, guardarPaginaProcesada, paginaYaProcesada } from '../core/memory.js';
import { obtenerElementoBotonDescarga } from '../core/download.js';
import { publicarEstadoPestana } from '../core/presence.js';
import { obtenerHora } from '../utils/dom.js';

export function marcarBotonComoProcesado(boton, esForzado = false) {
  if (!boton) return;
  try {
    const estadoMemoria = obtenerEstadoPaginaProcesada(location.href);
    const debeSerForzado = esForzado || estadoMemoria.esForzada;

    boton.setAttribute("data-hitomi-procesado", "true");
    boton.style.opacity = "0.75";
    boton.style.cursor = "not-allowed";

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
    }
  } catch (e) {
    console.error("Error al resetear estado del botón:", e);
  }
}

export function vincularEventosBotonDescarga(boton) {
  if (!boton || boton.dataset.hitomiListenerAttached) return;
  boton.dataset.hitomiListenerAttached = "true";

  boton.addEventListener("click", evento => {
    if (ESTADO.permitirClicForzado) {
      return;
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
