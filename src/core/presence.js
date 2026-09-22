// ─────────────────────────────────────────────
// Presencia e Intercomunicación IPC entre Pestañas
// ─────────────────────────────────────────────

import { CONFIGURACION, CLAVES, ID_PESTANA, ESTADO } from '../config/constants.js';
import { esPaginaHitomi, elementoVisible, esperar, obtenerHora } from '../utils/dom.js';
import { obtenerMemoriaPaginasProcesadas, obtenerEstadoPaginaProcesada, guardarPaginaProcesada } from './memory.js';
import { buscarBotonDescarga, ejecutarOrdenDescarga } from './download.js';
import { marcarBotonComoProcesado } from '../ui/badge.js';
import { mostrarEstado } from '../ui/pill.js';
import { extraerTagsPagina, obtenerTituloConAutor } from './tags.js';

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
      const tituloConAutor = obtenerTituloConAutor(document.title || location.href);
      const tagsDisponibles = extraerTagsPagina();

      GM_setValue(CLAVES.presencia(ID_PESTANA), tieneBoton);
      GM_setValue(CLAVES.urlPestana(ID_PESTANA), location.href);
      GM_setValue(CLAVES.tituloPestana(ID_PESTANA), tituloConAutor);
      GM_setValue(CLAVES.tagsPestana(ID_PESTANA), tagsDisponibles);
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
    GM_deleteValue(CLAVES.presencia(ID_PESTANA));
    GM_deleteValue(CLAVES.urlPestana(ID_PESTANA));
    GM_deleteValue(CLAVES.tituloPestana(ID_PESTANA));
    GM_deleteValue(CLAVES.tagsPestana(ID_PESTANA));
  } catch { }
}

export function obtenerInformacionPestanas(incluirProcesadas = false) {
  try {
    const prefijo = "hitomi_presencia_";
    const memoria = obtenerMemoriaPaginasProcesadas();
    const todasLasClaves = GM_listValues();
    const resultado = [];

    for (let i = 0; i < todasLasClaves.length; i++) {
      const clave = todasLasClaves[i];
      if (!clave.startsWith(prefijo)) continue;

      const id = clave.slice(prefijo.length);
      const tieneBoton = Number(GM_getValue(clave, 0)) > 0;
      if (!tieneBoton) continue;

      const url = GM_getValue(CLAVES.urlPestana(id), "");
      if (!url) continue;

      const estado = obtenerEstadoPaginaProcesada(url, memoria);
      const titulo = GM_getValue(CLAVES.tituloPestana(id), url);
      const tagsDisponibles = GM_getValue(CLAVES.tagsPestana(id), []);

      if (!estado.procesada || incluirProcesadas) {
        resultado.push({
          id,
          url,
          titulo,
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
    const estiloSeparador = GM_getValue(CLAVES.estiloSeparador, "pipe");

    for (const idPestana of pestañas) {
      const nonce = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const tagsSeleccionados = ESTADO.tagsSeleccionadosPorPestana.get(idPestana) || [];
      const tituloPersonalizado = ESTADO.titulosEditadosPorPestana.get(idPestana) || null;
      let respuesta = null;

      if (idPestana === ID_PESTANA) {
        respuesta = await ejecutarOrdenDescarga(nonce, { forzar, tagsSeleccionados, estiloSeparador, tituloPersonalizado });
      } else {
        const claveRespuesta = CLAVES.respuesta(nonce, idPestana);
        GM_deleteValue(claveRespuesta);

        GM_setValue(CLAVES.orden, {
          pestañaDestino: idPestana,
          nonce,
          forzar,
          tagsSeleccionados,
          estiloSeparador,
          tituloPersonalizado
        });

        const inicio = Date.now();
        while (Date.now() - inicio < CONFIGURACION.tiempoRespuestaPestana) {
          await esperar(100);
          respuesta = GM_getValue(claveRespuesta, null);
          if (respuesta) break;
        }

        GM_deleteValue(claveRespuesta);
      }

      console.info(obtenerHora(), `Pestaña ${idPestana} (forzar=${forzar}, local=${idPestana === ID_PESTANA}):`, respuesta);

      if (respuesta === "correcto") {
        const url = GM_getValue(CLAVES.urlPestana(idPestana), location.href);
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
    const claves = GM_listValues().filter(clave => clave.startsWith(prefijo));

    for (const clave of claves) {
      const id = clave.replace(prefijo, "");
      const presencia = GM_getValue(CLAVES.presencia(id), null);
      if (presencia === null) {
        GM_deleteValue(clave);
        GM_deleteValue(CLAVES.tituloPestana(id));
        GM_deleteValue(CLAVES.tagsPestana(id));
      }
    }
  } catch { }
}
