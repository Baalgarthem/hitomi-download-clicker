// ─────────────────────────────────────────────
// Interfaz Visual: Pastilla Flotante Principal
// ─────────────────────────────────────────────

import { CONFIGURACION, ESTADO } from '../config/constants.js';
import { esPaginaHitomi } from '../utils/dom.js';
import { limpiarMemoriaProcesadas } from '../core/memory.js';
import { resetearEstadoBotonDescarga } from './badge.js';
import { publicarEstadoPestana } from '../core/presence.js';
import { mostrarPopupConfirmacion } from './modal.js';

function crearInterfaz() {
  let anfitrion = document.getElementById(CONFIGURACION.ids.anfitrion);

  if (!anfitrion) {
    anfitrion = document.createElement("div");
    anfitrion.id = CONFIGURACION.ids.anfitrion;

    Object.assign(anfitrion.style, {
      all: "initial",
      position: "fixed",
      inset: "0",
      zIndex: "2147483647",
      pointerEvents: "none"
    });

    document.documentElement.appendChild(anfitrion);
  }

  return anfitrion;
}

export function aplicarEstilosPastilla() {
  GM_addStyle(`
    #${CONFIGURACION.ids.pastilla} {
      position: fixed;
      right: 15px;
      bottom: 15px;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 999px;
      background: #0d1117;
      color: #ffffff;
      border: 1px solid #30363d;
      box-shadow: 0 8px 24px rgba(0,0,0,.35);
      font: 700 13px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      cursor: pointer;
      user-select: none;
      pointer-events: auto;
      transition: transform .2s ease, background .2s ease, color .2s ease;
    }

    #${CONFIGURACION.ids.pastilla}:hover {
      transform: translateY(-2px);
    }

    .hitomi-punto {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #238636;
    }

    .hitomi-ok {
      animation: animacion_exito .5s ease;
    }

    .hitomi-error {
      animation: animacion_error .8s ease;
    }

    @keyframes animacion_exito {
      0% { background: #0d1117; }
      50% { background: #12b886; color: #06140f; }
      100% { background: #0d1117; }
    }

    @keyframes animacion_error {
      0%, 100% { background: #0d1117; }
      50% { background: #b00020; }
    }
  `);
}

let timerMostrarEstado = null;

export function mostrarEstado(elemento, mensaje, tipo) {
  if (!elemento) return;

  if (timerMostrarEstado) {
    clearTimeout(timerMostrarEstado);
    timerMostrarEstado = null;
  }

  const textoBase = `<span class="hitomi-punto"></span><strong>Hitomi DL</strong>`;

  elemento.innerHTML = `
    <span class="hitomi-punto"></span>
    <strong>${mensaje}</strong>
  `;

  elemento.classList.remove("hitomi-ok", "hitomi-error");
  elemento.classList.add(tipo === "correcto" ? "hitomi-ok" : "hitomi-error");

  timerMostrarEstado = setTimeout(() => {
    elemento.innerHTML = textoBase;
    elemento.classList.remove("hitomi-ok", "hitomi-error");
    timerMostrarEstado = null;
  }, 1500);
}

export function montarPastilla() {
  if (ESTADO.botonPastilla || !esPaginaHitomi()) return;

  const interfaz = crearInterfaz();
  const pastilla = document.createElement("div");

  pastilla.id = CONFIGURACION.ids.pastilla;
  pastilla.innerHTML = `
    <span class="hitomi-punto"></span>
    <strong>Hitomi DL</strong>
  `;
  pastilla.title = "Click para procesar pestañas.\nShift + Click limpia memoria.";

  pastilla.addEventListener("click", evento => {
    if (evento.shiftKey) {
      limpiarMemoriaProcesadas();
      resetearEstadoBotonDescarga();
      publicarEstadoPestana();
      mostrarEstado(pastilla, "Memoria limpiada", "correcto");
      return;
    }

    mostrarPopupConfirmacion(pastilla, false);
  });

  interfaz.appendChild(pastilla);
  ESTADO.botonPastilla = pastilla;
}
