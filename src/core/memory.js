// ─────────────────────────────────────────────
// Memoria Persistente Estructurada
// ─────────────────────────────────────────────

import { CLAVES } from '../config/constants.js';
import { normalizarUrl, leerValorGM, guardarValorGM, eliminarValorGM } from '../utils/dom.js';

export function obtenerMemoriaPaginasProcesadas() {
  try {
    const datosBrutos = leerValorGM(CLAVES.memoriaPaginas, {});
    const memoria = new Map();

    if (Array.isArray(datosBrutos)) {
      for (const url of datosBrutos) {
        if (typeof url === "string" && url.trim()) {
          const urlLimpia = normalizarUrl(url);
          memoria.set(urlLimpia, { esForzada: false, timestamp: Date.now() });
        }
      }
    } else if (datosBrutos && typeof datosBrutos === "object") {
      for (const [url, info] of Object.entries(datosBrutos)) {
        const urlLimpia = normalizarUrl(url);
        if (typeof info === "object" && info !== null) {
          memoria.set(urlLimpia, {
            esForzada: !!info.esForzada,
            timestamp: info.timestamp || Date.now()
          });
        } else {
          memoria.set(urlLimpia, { esForzada: !!info, timestamp: Date.now() });
        }
      }
    }

    return memoria;
  } catch (e) {
    console.error("Error al leer memoria de páginas procesadas:", e);
    return new Map();
  }
}

export function guardarPaginaProcesada(url, esForzada = false) {
  const urlLimpia = normalizarUrl(url);
  if (!urlLimpia) return;

  try {
    const memoria = obtenerMemoriaPaginasProcesadas();
    const registroExistente = memoria.get(urlLimpia);

    const estaForzada = esForzada || (registroExistente ? registroExistente.esForzada : false);

    memoria.set(urlLimpia, {
      esForzada: estaForzada,
      timestamp: Date.now()
    });

    const objetoSerializable = {};
    for (const [u, info] of memoria.entries()) {
      objetoSerializable[u] = info;
    }

    guardarValorGM(CLAVES.memoriaPaginas, objetoSerializable);
  } catch (e) {
    console.error("Error al guardar página procesada en memoria:", e);
  }
}

export function obtenerEstadoPaginaProcesada(url, memoriaMap = null) {
  const urlLimpia = normalizarUrl(url);
  if (!urlLimpia) return { procesada: false, esForzada: false };

  try {
    const memoria = memoriaMap || obtenerMemoriaPaginasProcesadas();
    const info = memoria.get(urlLimpia);
    if (!info) return { procesada: false, esForzada: false };
    return { procesada: true, esForzada: !!info.esForzada };
  } catch {
    return { procesada: false, esForzada: false };
  }
}

export function paginaYaProcesada(url, memoriaMap = null) {
  return obtenerEstadoPaginaProcesada(url, memoriaMap).procesada;
}

export function limpiarMemoriaProcesadas() {
  try {
    eliminarValorGM(CLAVES.memoriaPaginas);
  } catch (e) {
    console.error("Error al limpiar memoria:", e);
  }
}

