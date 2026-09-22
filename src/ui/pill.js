// ─────────────────────────────────────────────
// Interfaz Visual: Pastilla Flotante Principal
// ─────────────────────────────────────────────

import { CONFIGURACION, ESTADO } from '../config/constants.js';
import { esPaginaHitomi, obtenerOCrearAnfitrionUI, inyectarEstilos } from '../utils/dom.js';
import { limpiarMemoriaProcesadas } from '../core/memory.js';
import { resetearEstadoBotonDescarga } from './badge.js';
import { publicarEstadoPestana } from '../core/presence.js';
import { mostrarPopupConfirmacion } from './modal.js';

export function aplicarEstilosPastilla() {
  inyectarEstilos(`
    #${CONFIGURACION.ids.pastilla} {
      position: fixed;
      right: 15px;
      bottom: 15px;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      border-radius: 999px;
      background: linear-gradient(135deg, #3d4e5e 0%, #2d3b47 100%);
      color: #ffffff;
      border: 1px solid #4f6275;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
      font: 700 13px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      cursor: pointer;
      user-select: none;
      pointer-events: auto;
      transition: transform .2s ease, background .2s ease, border-color .2s ease, box-shadow .2s ease;
    }

    #${CONFIGURACION.ids.pastilla}:hover {
      transform: translateY(-2px);
      background: linear-gradient(135deg, #4f6275 0%, #3a4b5c 100%);
      border-color: #b580b5;
      box-shadow: 0 8px 24px rgba(181, 128, 181, 0.3);
    }

    .hitomi-logo-img {
      width: 18px;
      height: 18px;
      border-radius: 4px;
      object-fit: contain;
      vertical-align: middle;
    }

    .hitomi-punto {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #238636;
      box-shadow: 0 0 6px rgba(35, 134, 54, 0.6);
    }

    .hitomi-ok {
      animation: animacion_exito .5s ease;
    }

    .hitomi-error {
      animation: animacion_error .8s ease;
    }

    @keyframes animacion_exito {
      0% { background: linear-gradient(135deg, #3d4e5e 0%, #2d3b47 100%); }
      50% { background: #12b886; color: #06140f; }
      100% { background: linear-gradient(135deg, #3d4e5e 0%, #2d3b47 100%); }
    }

    @keyframes animacion_error {
      0%, 100% { background: linear-gradient(135deg, #3d4e5e 0%, #2d3b47 100%); }
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

  const textoBase = `
    <img src="${CONFIGURACION.urlIcono}" class="hitomi-logo-img" alt="Hitomi Logo" />
    <span class="hitomi-punto"></span>
    <strong>Hitomi DL</strong>
  `;

  elemento.innerHTML = `
    <img src="${CONFIGURACION.urlIcono}" class="hitomi-logo-img" alt="Hitomi Logo" />
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

  const interfaz = obtenerOCrearAnfitrionUI(CONFIGURACION.ids.anfitrion);
  const pastilla = document.createElement("div");

  pastilla.id = CONFIGURACION.ids.pastilla;
  pastilla.innerHTML = `
    <img src="${CONFIGURACION.urlIcono}" class="hitomi-logo-img" alt="Hitomi Logo" />
    <span class="hitomi-punto"></span>
    <strong>Hitomi DL</strong>
  `;
  pastilla.title = "⚡ Hitomi Download Manager\n- Clic normal: Abrir panel de descargas de pestañas abiertas\n- Shift + Clic: Limpiar memoria de páginas procesadas";

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
