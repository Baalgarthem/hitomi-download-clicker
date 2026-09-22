// ─────────────────────────────────────────────
// Presencia e Intercomunicación IPC entre Pestañas
// ─────────────────────────────────────────────

import { CONFIGURACION, CLAVES, ID_PESTANA, ESTADO } from '../config/constants.js';
import { esPaginaHitomi, elementoVisible, esperar, obtenerHora } from '../utils/dom.js';
import { obtenerMemoriaPaginasProcesadas, obtenerEstadoPaginaProcesada, guardarPaginaProcesada } from './memory.js';
import { buscarBotonDescarga, ejecutarOrdenDescarga } from './download.js';
import { marcarBotonComoProcesado } from '../ui/badge.js';
import { mostrarEstado } from '../ui/pill.js';
import { extraerNombreAutor, obtenerAutorOEstadoInicial } from './author.js';
import { extraerTagsPagina, limpiarTituloBase } from './tags.js';

function leerValorGM(clave, valorDefecto = null) {
  try {
    if (typeof GM_getValue !== "undefined") {
      return GM_getValue(clave, valorDefecto);
    }
    const val = localStorage.getItem(clave);
    if (val === null) return valorDefecto;
    try { return JSON.parse(val); } catch { return val; }
  } catch {
    return valorDefecto;
  }
}

function guardarValorGM(clave, valor) {
  try {
    if (typeof GM_setValue !== "undefined") {
      GM_setValue(clave, valor);
    } else {
      localStorage.setItem(clave, typeof valor === "string" ? valor : JSON.stringify(valor));
    }
  } catch { }
}

function eliminarValorGM(clave) {
  try {
    if (typeof GM_deleteValue !== "undefined") {
      GM_deleteValue(clave);
    } else {
      localStorage.removeItem(clave);
    }
  } catch { }
}

let publicandoEstado = false;

export async function publicarEstadoPestana() {
  if (!esPaginaHitomi() || publicandoEstado) return;
  publicandoEstado = true;

  try {
    const boton = await buscarBotonDescarga({ intentos: 5, pausa: 100 });
    const memoria = obtenerMemoriaPaginasProcesadas();
    const estadoActual = obtenerEstadoPaginaProcesada(location.href, memoria);

    if (boton && estadoActual.procesada) {
      marcarBotonComoProcesado(boton, estadoActual.esForzada);
    }

    const tieneBoton = (boton && elementoVisible(boton)) ? 1 : 0;

    if (ESTADO.ultimoEstadoPublicado !== tieneBoton) {
      const autorDetectado = obtenerAutorOEstadoInicial();
      const tituloLimpio = limpiarTituloBase(document.title || location.href, autorDetectado);
      const tagsDisponibles = extraerTagsPagina();

      guardarValorGM(CLAVES.presencia(ID_PESTANA), tieneBoton);
      guardarValorGM(CLAVES.urlPestana(ID_PESTANA), location.href);
      guardarValorGM(CLAVES.tituloPestana(ID_PESTANA), tituloLimpio);
      guardarValorGM(CLAVES.autorPestana(ID_PESTANA), autorDetectado);
      guardarValorGM(CLAVES.tagsPestana(ID_PESTANA), tagsDisponibles);
      ESTADO.ultimoEstadoPublicado = tieneBoton;
    }
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

      if (!estado.procesada || incluirProcesadas) {
        resultado.push({
          id,
          url,
          titulo,
          autor,
          tagsDisponibles,
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
    const prefijo = "hitomi_url_";
    const todasLasClaves = (typeof GM_listValues !== "undefined") ? GM_listValues() : Object.keys(localStorage);
    const claves = todasLasClaves.filter(clave => clave.startsWith(prefijo));

    for (const clave of claves) {
      const id = clave.replace(prefijo, "");
      const presencia = leerValorGM(CLAVES.presencia(id), null);
      if (presencia === null) {
        eliminarValorGM(clave);
        eliminarValorGM(CLAVES.tituloPestana(id));
        eliminarValorGM(CLAVES.autorPestana(id));
        eliminarValorGM(CLAVES.tagsPestana(id));
      }
    }
  } catch { }
}
