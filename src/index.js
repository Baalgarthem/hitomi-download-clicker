// ==UserScript==
// @name         Hitomi Clicker
// @namespace    https://github.com/Baalgarthem/
// @version      2.9.0
// @description  Recorre pestañas abiertas de Hitomi y ejecuta descargas automáticas organizando archivos en 3 componentes: 「Autor/Grupo」 Título ┃ tags. Incluye edición de autor y título por ítem, fallback automático a grupo o Unknown en N/A, selección de delimitadores, extensión .cbz, sufijo de serie 【Serie】 y personajes 【Personaje1 Personaje2】, y menú modal de confirmación con IPC.
// @author       Baalgarthem
// @icon         https://raw.githubusercontent.com/Baalgarthem/hitomi-download-clicker/principal/media/hitomi-logo.ico
// @downloadURL  https://raw.githubusercontent.com/Baalgarthem/hitomi-download-clicker/principal/dist/hitomi-download-clicker.user.js
// @updateURL    https://raw.githubusercontent.com/Baalgarthem/hitomi-download-clicker/principal/dist/hitomi-download-clicker.user.js
// @match        https://hitomi.la/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @grant        GM_listValues
// @grant        GM_deleteValue
// @grant        GM_download
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
4. Permite al usuario elegir qué etiquetas concatenar al nombre del archivo con el formato ┃ + tags.
5. Muestra un popup/modal de confirmación con las pestañas detectadas, selección múltiple por rango y selector de tags.
6. Almacena memoria estructurada de URLs descargadas y re-descargadas.
7. Permite re-escanear pestañas, activar descarga forzada o limpiar la memoria.
*/

import { ID_PESTANA, CLAVES } from './config/constants.js';
import { esPaginaHitomi, obtenerHora } from './utils/dom.js';
import { publicarEstadoPestana, eliminarPresenciaPestana, limpiarRegistrosPestanasAntiguas } from './core/presence.js';
import { ejecutarOrdenDescarga, interceptarDescargasNativas, limpiarAtributosDescargaInvalidos } from './core/download.js';

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
    if (typeof GM_addValueChangeListener !== "undefined") {
      GM_addValueChangeListener(
        CLAVES.orden,
        async (_clave, _valorAnterior, valorNuevo, cambioRemoto) => {
          if (!cambioRemoto || !valorNuevo || typeof valorNuevo !== "object") {
            return;
          }

          const { pestañaDestino, nonce, forzar, tagsSeleccionados, personajesSeleccionados, estiloSeparador, tituloPersonalizado, autorPersonalizado } = valorNuevo;
          if (pestañaDestino !== ID_PESTANA) {
            return;
          }

          const resultado = await ejecutarOrdenDescarga(nonce, {
            forzar: !!forzar,
            tagsSeleccionados: tagsSeleccionados || [],
            personajesSeleccionados: personajesSeleccionados || [],
            estiloSeparador: estiloSeparador || (typeof GM_getValue !== "undefined" ? GM_getValue(CLAVES.estiloSeparador, "pipe") : "pipe"),
            tituloPersonalizado: tituloPersonalizado || null,
            autorPersonalizado: autorPersonalizado || null
          });

          try {
            if (typeof GM_setValue !== "undefined") {
              GM_setValue(CLAVES.respuesta(nonce, ID_PESTANA), resultado);
            }
          } catch (e) {
            console.error("Error al devolver respuesta de orden:", e);
          }
        }
      );

      // Escuchador de ping de presencia global para normalizar pestañas remotas
      GM_addValueChangeListener(
        CLAVES.pingPresencia,
        async (_clave, _valorAnterior, valorNuevo, cambioRemoto) => {
          if (!cambioRemoto || !valorNuevo || typeof valorNuevo !== "object") {
            return;
          }
          if (valorNuevo.solicitante !== ID_PESTANA) {
            await publicarEstadoPestana(true);
          }
        }
      );
    } else if (typeof window !== "undefined" && window.addEventListener) {
      window.addEventListener("storage", async (e) => {
        if (e.key === CLAVES.orden && e.newValue) {
          try {
            const valorNuevo = JSON.parse(e.newValue);
            if (valorNuevo && typeof valorNuevo === "object" && valorNuevo.pestañaDestino === ID_PESTANA) {
              const { nonce, forzar, tagsSeleccionados, personajesSeleccionados, estiloSeparador, tituloPersonalizado, autorPersonalizado } = valorNuevo;
              const resultado = await ejecutarOrdenDescarga(nonce, {
                forzar: !!forzar,
                tagsSeleccionados: tagsSeleccionados || [],
                personajesSeleccionados: personajesSeleccionados || [],
                estiloSeparador: estiloSeparador || "pipe",
                tituloPersonalizado: tituloPersonalizado || null,
                autorPersonalizado: autorPersonalizado || null
              });
              if (typeof GM_setValue !== "undefined") {
                GM_setValue(CLAVES.respuesta(nonce, ID_PESTANA), resultado);
              } else {
                localStorage.setItem(CLAVES.respuesta(nonce, ID_PESTANA), resultado);
              }
            }
          } catch { }
        } else if (e.key === CLAVES.pingPresencia && e.newValue) {
          try {
            const valorNuevo = JSON.parse(e.newValue);
            if (valorNuevo && typeof valorNuevo === "object" && valorNuevo.solicitante !== ID_PESTANA) {
              await publicarEstadoPestana(true);
            }
          } catch { }
        }
      });
    }
  } catch (e) {
    console.error("Error en escuchador de órdenes:", e);
  }
}

function iniciarScript() {
  if (!esPaginaHitomi()) return;

  aplicarEstilosPastilla();
  aplicarEstilosModal();

  interceptarDescargasNativas();
  limpiarAtributosDescargaInvalidos();
  limpiarRegistrosPestanasAntiguas();

  montarPastilla();
  publicarEstadoPestana();
  registrarObservadorDOM();
  registrarEscuchadorOrdenesIPC();

  console.info(obtenerHora(), "Hitomi Clicker iniciado con soporte para Tags ┃ + tags y descarga nativa de autor", {
    pestaña: ID_PESTANA,
    pagina: location.href
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciarScript, { once: true });
} else {
  iniciarScript();
}
