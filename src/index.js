// ==UserScript==
// @name         Hitomi Clicker
// @namespace    https://github.com/Baalgarthem/
// @version      1.3.2
// @description  Recorre pestañas abiertas de Hitomi y pulsa automáticamente el botón de descarga evitando repetir páginas ya procesadas, con modal de confirmación, modo forzado, selección múltiple (Shift/Ctrl), extracción de autor 「xxxx」 y opción para limpiar memoria.
// @author       Baalgarthem
// @icon         https://raw.githubusercontent.com/Baalgarthem/hitomi-download-clicker/principal/media/hitomi-logo.ico
// @downloadURL  https://raw.githubusercontent.com/Baalgarthem/hitomi-download-clicker/principal/hitomi-download-clicker.user.js
// @updateURL    https://raw.githubusercontent.com/Baalgarthem/hitomi-download-clicker/principal/hitomi-download-clicker.user.js
// @match        https://hitomi.la/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @grant        GM_listValues
// @grant        GM_deleteValue
// @run-at       document-idle
// @noframes
// @license      MIT
// ==/UserScript==

/*
╔══════════════════════════════════════════════════════════════════════╗
║                         HITOMI CLICKER                              ║
╚══════════════════════════════════════════════════════════════════════╝

PROPÓSITO DEL SCRIPT
────────────────────
Este script automatiza una tarea repetitiva dentro de Hitomi.la:
1. Detecta todas las pestañas abiertas pertenecientes al dominio Hitomi.
2. Comprueba si cada página contiene el botón real de descarga.
3. Extrae el autor/artista de la página y lo formatea entre comillas japonesas 「xxxx」.
4. Muestra un popup/modal de confirmación con las pestañas detectadas y selección múltiple por rango.
5. Almacena memoria estructurada de URLs descargadas y re-descargadas.
6. Permite re-escanear pestañas, activar descarga forzada o limpiar la memoria.
*/

import { ID_PESTANA, CLAVES, ESTADO } from './config/constants.js';
import { esPaginaHitomi, obtenerHora } from './utils/dom.js';
import { publicarEstadoPestana, eliminarPresenciaPestana, limpiarRegistrosPestanasAntiguas } from './core/presence.js';
import { ejecutarOrdenDescarga } from './core/download.js';
import { aplicarEstilosModal } from './ui/modal.js';
import { aplicarEstilosPastilla, montarPastilla } from './ui/pill.js';

let timerObservador = null;

function registrarObservadorDOM() {
  const OBSERVADOR_DOM = new MutationObserver(() => {
    if (timerObservador) clearTimeout(timerObservador);
    timerObservador = setTimeout(() => {
      publicarEstadoPestana();
    }, 300);
  });

  if (document.documentElement) {
    OBSERVADOR_DOM.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  window.addEventListener("beforeunload", eliminarPresenciaPestana);
}

function registrarEscuchadorOrdenesIPC() {
  try {
    GM_addValueChangeListener(
      CLAVES.orden,
      async (_clave, _valorAnterior, valorNuevo, cambioRemoto) => {
        if (!cambioRemoto || !valorNuevo || typeof valorNuevo !== "object") {
          return;
        }

        const { pestañaDestino, nonce, forzar } = valorNuevo;
        if (pestañaDestino !== ID_PESTANA) {
          return;
        }

        const resultado = await ejecutarOrdenDescarga(nonce, { forzar: !!forzar });

        try {
          GM_setValue(CLAVES.respuesta(nonce, ID_PESTANA), resultado);
        } catch (e) {
          console.error("Error al devolver respuesta de orden:", e);
        }
      }
    );
  } catch (e) {
    console.error("Error en escuchador de órdenes:", e);
  }
}

function iniciarScript() {
  if (!esPaginaHitomi()) return;

  aplicarEstilosPastilla();
  aplicarEstilosModal();

  limpiarRegistrosPestanasAntiguas();
  montarPastilla();
  publicarEstadoPestana();
  registrarObservadorDOM();
  registrarEscuchadorOrdenesIPC();

  console.info(obtenerHora(), "Hitomi Clicker modular iniciado", {
    pestaña: ID_PESTANA,
    pagina: location.href
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciarScript, { once: true });
} else {
  iniciarScript();
}
