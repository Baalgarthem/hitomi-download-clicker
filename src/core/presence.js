// ─────────────────────────────────────────────
// Presencia e Intercomunicación IPC entre Pestañas
// ─────────────────────────────────────────────

import { CONFIGURACION, CLAVES, ID_PESTANA, ESTADO } from '../config/constants.js';
import { esPaginaHitomi, elementoVisible, esperar, obtenerHora, leerValorGM, guardarValorGM, eliminarValorGM } from '../utils/dom.js';
import { obtenerMemoriaPaginasProcesadas, obtenerEstadoPaginaProcesada, guardarPaginaProcesada } from './memory.js';
import { buscarBotonDescarga, ejecutarOrdenDescarga } from './download.js';
import { marcarBotonComoProcesado } from '../ui/badge.js';
import { mostrarEstado } from '../ui/pill.js';
import { extraerNombreAutor, obtenerAutorOEstadoInicial } from './author.js';
import { extraerTagsPagina, limpiarTituloBase, extraerSeriePagina } from './tags.js';


let publicandoEstado = false;

export async function publicarEstadoPestana(forzar = false) {
  if (!esPaginaHitomi() || publicandoEstado) return;
  publicandoEstado = true;

  try {
    const boton = await buscarBotonDescarga({ intentos: 3, pausa: 80 });
    const memoria = obtenerMemoriaPaginasProcesadas();
    const estadoActual = obtenerEstadoPaginaProcesada(location.href, memoria);

    if (boton && estadoActual.procesada) {
      marcarBotonComoProcesado(boton, estadoActual.esForzada);
    }

    const tieneBoton = (boton && elementoVisible(boton)) ? 1 : 0;
    const autorDetectado = obtenerAutorOEstadoInicial();
    const tituloLimpio = limpiarTituloBase(document.title || location.href, autorDetectado);
    const tagsDisponibles = extraerTagsPagina();
    const serieDetectada = extraerSeriePagina();
    const ahora = Date.now();

    guardarValorGM(CLAVES.presencia(ID_PESTANA), tieneBoton);
    guardarValorGM(CLAVES.urlPestana(ID_PESTANA), location.href);
    guardarValorGM(CLAVES.tituloPestana(ID_PESTANA), tituloLimpio);
    guardarValorGM(CLAVES.autorPestana(ID_PESTANA), autorDetectado);
    guardarValorGM(CLAVES.tagsPestana(ID_PESTANA), tagsDisponibles);
    guardarValorGM(CLAVES.seriePestana(ID_PESTANA), serieDetectada);
    guardarValorGM(CLAVES.timestampPestana(ID_PESTANA), ahora);

    ESTADO.ultimoEstadoPublicado = tieneBoton;
  } catch (e) {
    console.error("Error al publicar estado de pestaña:", e);
  } finally {
    publicandoEstado = false;
  }
}

export function eliminarPresenciaPestana() {
  try {
    eliminarValorGM(CLAVES.presencia(ID_PESTANA));
    eliminarValorGM(CLAVES.urlPestana(ID_PESTANA));
    eliminarValorGM(CLAVES.tituloPestana(ID_PESTANA));
    eliminarValorGM(CLAVES.autorPestana(ID_PESTANA));
    eliminarValorGM(CLAVES.tagsPestana(ID_PESTANA));
    eliminarValorGM(CLAVES.seriePestana(ID_PESTANA));
    eliminarValorGM(CLAVES.timestampPestana(ID_PESTANA));
  } catch { }
}

export function obtenerInformacionPestanas(incluirProcesadas = false) {
  try {
    const prefijo = "hitomi_presencia_";
    const memoria = obtenerMemoriaPaginasProcesadas();
    const todasLasClaves = (typeof GM_listValues !== "undefined") ? GM_listValues() : Object.keys(localStorage);
    const resultado = [];

    for (let i = 0; i < todasLasClaves.length; i++) {
      const clave = todasLasClaves[i];
      if (!clave.startsWith(prefijo)) continue;

      const id = clave.slice(prefijo.length);
      const tieneBoton = Number(leerValorGM(clave, 0)) > 0;
      if (!tieneBoton) continue;

      const url = leerValorGM(CLAVES.urlPestana(id), "");
      if (!url) continue;

      const estado = obtenerEstadoPaginaProcesada(url, memoria);
      const titulo = leerValorGM(CLAVES.tituloPestana(id), url);
      const autor = leerValorGM(CLAVES.autorPestana(id), "");
      const tagsDisponibles = leerValorGM(CLAVES.tagsPestana(id), []);
      const serie = leerValorGM(CLAVES.seriePestana(id), "");

      if (!estado.procesada || incluirProcesadas) {
        resultado.push({
          id,
          url,
          titulo,
          autor,
          tagsDisponibles,
          serie,
          yaProcesada: estado.procesada,
          esForzada: estado.esForzada
        });
      }
    }

    return resultado.sort((a, b) => a.id.localeCompare(b.id));
  } catch (e) {
    console.error("Error al consultar información de pestañas:", e);
    return [];
  }
}

export async function recorrerPestanasDescarga(pastilla, listaIds = null, opciones = {}) {
  const { forzar = false } = opciones;

  if (ESTADO.bloqueado) return;
  ESTADO.bloqueado = true;

  mostrarEstado(pastilla, forzar ? "Forzando..." : "Procesando...", "correcto");

  try {
    const pestañasInfo = obtenerInformacionPestanas(forzar);
    let pestañas = listaIds || pestañasInfo.map(p => p.id);

    if (!pestañas.length) {
      mostrarEstado(pastilla, "Sin pestañas", "error");
      return;
    }

    let procesadas = 0;
    const estiloSeparador = leerValorGM(CLAVES.estiloSeparador, "pipe");

    for (const idPestana of pestañas) {
      const nonce = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const tagsSeleccionados = ESTADO.tagsSeleccionadosPorPestana.get(idPestana) || [];
      const tituloPersonalizado = ESTADO.titulosEditadosPorPestana.get(idPestana) || null;
      const autorPersonalizado = ESTADO.autoresEditadosPorPestana.get(idPestana) || null;
      let respuesta = null;

      if (idPestana === ID_PESTANA) {
        respuesta = await ejecutarOrdenDescarga(nonce, { forzar, tagsSeleccionados, estiloSeparador, tituloPersonalizado, autorPersonalizado });
      } else {
        const claveRespuesta = CLAVES.respuesta(nonce, idPestana);
        eliminarValorGM(claveRespuesta);

        guardarValorGM(CLAVES.orden, {
          pestañaDestino: idPestana,
          nonce,
          forzar,
          tagsSeleccionados,
          estiloSeparador,
          tituloPersonalizado,
          autorPersonalizado
        });

        const inicio = Date.now();
        while (Date.now() - inicio < CONFIGURACION.tiempoRespuestaPestana) {
          await esperar(100);
          respuesta = leerValorGM(claveRespuesta, null);
          if (respuesta) break;
        }

        eliminarValorGM(claveRespuesta);
      }

      console.info(obtenerHora(), `Pestaña ${idPestana} (forzar=${forzar}, local=${idPestana === ID_PESTANA}):`, respuesta);

      if (respuesta === "correcto") {
        const url = leerValorGM(CLAVES.urlPestana(idPestana), location.href);
        if (url) {
          guardarPaginaProcesada(url, forzar);
        }
        procesadas++;
      }

      await esperar(CONFIGURACION.tiempoEntreOrdenes);
    }

    if (procesadas > 0) {
      mostrarEstado(pastilla, `${procesadas} completadas`, "correcto");
    } else {
      mostrarEstado(pastilla, forzar ? "Sin acciones" : "Sin pendientes", "error");
    }
  } finally {
    ESTADO.bloqueado = false;
    publicarEstadoPestana();
  }
}

export function limpiarRegistrosPestanasAntiguas() {
  try {
    const prefijoUrl = "hitomi_url_";
    const todasLasClaves = (typeof GM_listValues !== "undefined") ? GM_listValues() : Object.keys(localStorage);
    const clavesUrl = todasLasClaves.filter(clave => clave.startsWith(prefijoUrl));
    const ahora = Date.now();
    const UMBRAL_EXPIRACION_MS = 60000; // 60 segundos de inactividad máxima

    for (const clave of clavesUrl) {
      const id = clave.replace(prefijoUrl, "");
      const presencia = leerValorGM(CLAVES.presencia(id), null);
      const timestamp = Number(leerValorGM(CLAVES.timestampPestana(id), 0));
      const caducado = (id !== ID_PESTANA) && (timestamp > 0) && (ahora - timestamp > UMBRAL_EXPIRACION_MS);

      if (presencia === null || presencia === 0 || caducado) {
        eliminarValorGM(clave);
        eliminarValorGM(CLAVES.presencia(id));
        eliminarValorGM(CLAVES.tituloPestana(id));
        eliminarValorGM(CLAVES.autorPestana(id));
        eliminarValorGM(CLAVES.tagsPestana(id));
        eliminarValorGM(CLAVES.seriePestana(id));
        eliminarValorGM(CLAVES.timestampPestana(id));
      }
    }
  } catch (e) {
    console.error("Error al limpiar registros de pestañas antiguas:", e);
  }
}

/**
 * Emite un mensaje IPC de sincronización a todas las pestañas de Hitomi abiertas en el navegador.
 * Cada pestaña activa responderá actualizando su título, autor, tags y presencia.
 * @param {boolean} modoForzado - Si es true, incluye pestañas ya procesadas en la lista devuelta.
 * @returns {Promise<Array>} Lista normalizada y actualizada de pestañas detectadas.
 */
export async function solicitarSincronizacionGlobalPestanas(modoForzado = false) {
  try {
    const noncePing = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    guardarValorGM(CLAVES.pingPresencia, {
      solicitante: ID_PESTANA,
      nonce: noncePing,
      timestamp: Date.now()
    });
  } catch (e) {
    console.error("Error al emitir ping de presencia IPC:", e);
  }

  // Publicar inmediatamente el estado de la pestaña actual
  await publicarEstadoPestana(true);

  // Pausa corta para permitir que las otras pestañas procesen el evento IPC y publiquen sus estados
  await esperar(180);

  // Limpiar pestañas caducadas o cerradas
  limpiarRegistrosPestanasAntiguas();

  // Devolver el arreglo consolidado de pestañas
  return obtenerInformacionPestanas(modoForzado);
}
