// ==UserScript==
// @name         Hitomi Clicker
// @namespace    https://github.com/Baalgarthem/
// @version      1.0.0
// @description  Recorre pestañas abiertas de Hitomi y pulsa automáticamente el botón de descarga evitando repetir páginas ya procesadas.
// @author       Baalgarthem
// @icon         https://raw.githubusercontent.com/Baalgarthem/hitomi-download-clicker/principal/media/hitomi-logo.ico
// @downloadURL  https://raw.githubusercontent.com/Baalgarthem/hitomi-download-clicker/principal/hitomi-clicker.user.js
// @updateURL    https://raw.githubusercontent.com/Baalgarthem/hitomi-download-clicker/principal/hitomi-clicker.user.js
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
3. Envía una orden individual a cada pestaña preparada.
4. Ejecuta el click únicamente sobre páginas pendientes.
5. Guarda memoria permanente de las páginas donde ya realizó la acción.

FILOSOFÍA DE FUNCIONAMIENTO
───────────────────────────
El programa separa tres conceptos:
- Página disponible: Una pestaña donde existe un botón de descarga válido.
- Página procesada: Una página donde el usuario ya permitió ejecutar el click.
  Estas páginas quedan almacenadas y son ignoradas en futuras ejecuciones.
- Página pendiente: Una página nueva que todavía necesita ser procesada.

MEMORIA
───────
La memoria utiliza el almacenamiento proporcionado por Tampermonkey / Violentmonkey mediante GM_setValue.
Esto permite que:
- La información sobreviva al cierre del navegador.
- Varias pestañas compartan el mismo historial.
- El usuario pueda continuar trabajando sin repetir acciones.

SEGURIDAD
─────────
El script nunca navega automáticamente. Nunca abre enlaces externos. Nunca ejecuta acciones fuera de Hitomi.
Solo pulsa el elemento #dl-button detectado dentro de una pestaña del propio dominio.

ARQUITECTURA GENERAL
────────────────────
Cada pestaña funciona como un agente independiente:
Pestaña A ──► Detecta botón ──► Publica presencia
Pestaña principal ──► Consulta pestañas disponibles ──► Envía orden ──► Recibe resultado
Después de éxito: URL ──► Memoria permanente ──► Ignorada en futuras ejecuciones.
*/

(() => {
  "use strict";

  // ─────────────────────────────────────────────
  // Configuración general del sistema
  // ─────────────────────────────────────────────
  const CONFIGURACION = {
    dominio: "hitomi.la",
    selectorBotonDescarga: "#dl-button",
    intervaloBusquedaBoton: 150,
    intentosBusquedaBoton: 40,
    tiempoEntreOrdenes: 120,
    tiempoRespuestaPestana: 4000,
    ids: {
      pastilla: "hitomi-clicker-pastilla",
      anfitrion: "hitomi-clicker-interfaz"
    }
  };

  // ─────────────────────────────────────────────
  // Identidad única de cada pestaña
  // ─────────────────────────────────────────────
  function obtenerIdPestana() {
    const CLAVE = "hitomi_clicker_identidad_pestana";
    let id = sessionStorage.getItem(CLAVE);
    if (!id) {
      id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem(CLAVE, id);
    }
    return id;
  }

  const ID_PESTANA = obtenerIdPestana();

  // ─────────────────────────────────────────────
  // Claves compartidas entre pestañas
  // ─────────────────────────────────────────────
  const CLAVES = {
    presencia: id => `hitomi_presencia_${id}`,
    orden: "hitomi_orden_global",
    respuesta: (nonce, id) => `hitomi_respuesta_${nonce}_${id}`,
    memoriaPaginas: "hitomi_paginas_procesadas",
    urlPestana: id => `hitomi_url_${id}`
  };

  // ─────────────────────────────────────────────
  // Estado interno del script
  // ─────────────────────────────────────────────
  const ESTADO = {
    bloqueado: false,
    ordenesEjecutadas: new Set(),
    botonPastilla: null,
    ultimoEstadoPublicado: null
  };

  // ─────────────────────────────────────────────
  // Herramientas generales
  // ─────────────────────────────────────────────
  const esperar = milisegundos => new Promise(resolver => setTimeout(resolver, milisegundos));

  const obtenerHora = () => `[${new Date().toTimeString().slice(0, 8)}]`;

  const esPaginaHitomi = () => /^https?:\/\/(?:www\.)?hitomi\.la\//i.test(location.href);

  function elementoVisible(elemento) {
    if (!elemento) return false;
    const estilo = getComputedStyle(elemento);
    const rectangulo = elemento.getBoundingClientRect();
    return (
      estilo.display !== "none" &&
      estilo.visibility !== "hidden" &&
      rectangulo.width > 0 &&
      rectangulo.height > 0
    );
  }

  function ejecutarClick(elemento) {
    if (elemento && typeof elemento.click === "function") {
      elemento.click();
      return true;
    }
    if (elemento) {
      return elemento.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window
        })
      );
    }
    return false;
  }

  // ─────────────────────────────────────────────
  // Memoria persistente
  // ─────────────────────────────────────────────
  function obtenerPaginasProcesadas() {
    try {
      const paginas = GM_getValue(CLAVES.memoriaPaginas, []);
      return new Set(Array.isArray(paginas) ? paginas : []);
    } catch {
      return new Set();
    }
  }

  function guardarPaginaProcesada(url) {
    if (!url) return;
    try {
      const memoria = obtenerPaginasProcesadas();
      memoria.add(url);
      GM_setValue(CLAVES.memoriaPaginas, Array.from(memoria));
    } catch (e) {
      console.error("Error al guardar página procesada:", e);
    }
  }

  function paginaYaProcesada(url, memoriaSet = null) {
    const memoria = memoriaSet || obtenerPaginasProcesadas();
    return memoria.has(url);
  }

  function limpiarMemoriaProcesadas() {
    try {
      GM_deleteValue(CLAVES.memoriaPaginas);
    } catch (e) {
      console.error("Error al limpiar memoria:", e);
    }
  }

  // ─────────────────────────────────────────────
  // Detección del botón de descarga
  // ─────────────────────────────────────────────
  async function buscarBotonDescarga(opciones = {}) {
    const intentos = opciones.intentos ?? CONFIGURACION.intentosBusquedaBoton;
    const pausa = opciones.pausa ?? CONFIGURACION.intervaloBusquedaBoton;

    for (let intento = 0; intento < intentos; intento++) {
      const boton = document.querySelector(CONFIGURACION.selectorBotonDescarga);
      if (boton && elementoVisible(boton)) {
        return boton;
      }
      await esperar(pausa);
    }
    return null;
  }

  // ─────────────────────────────────────────────
  // Publicación del estado de la pestaña
  // ─────────────────────────────────────────────
  let publicandoEstado = false;

  async function publicarEstadoPestana() {
    if (!esPaginaHitomi() || publicandoEstado) return;
    publicandoEstado = true;

    try {
      const boton = await buscarBotonDescarga({ intentos: 5, pausa: 100 });
      const paginasProcesadas = obtenerPaginasProcesadas();
      const paginaPendiente = !paginaYaProcesada(location.href, paginasProcesadas);
      const nuevoEstado = (boton && paginaPendiente) ? 1 : 0;

      if (ESTADO.ultimoEstadoPublicado !== nuevoEstado) {
        GM_setValue(CLAVES.presencia(ID_PESTANA), nuevoEstado);
        GM_setValue(CLAVES.urlPestana(ID_PESTANA), location.href);
        ESTADO.ultimoEstadoPublicado = nuevoEstado;
      }
    } catch (e) {
      console.error("Error al publicar estado:", e);
    } finally {
      publicandoEstado = false;
    }
  }

  // ─────────────────────────────────────────────
  // Limpieza de presencia
  // ─────────────────────────────────────────────
  function eliminarPresenciaPestana() {
    try {
      GM_deleteValue(CLAVES.presencia(ID_PESTANA));
      GM_deleteValue(CLAVES.urlPestana(ID_PESTANA));
    } catch { }
  }

  // ─────────────────────────────────────────────
  // Observación de cambios dinámicos (Debounced)
  // ─────────────────────────────────────────────
  let timerObservador = null;

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

  // ─────────────────────────────────────────────
  // Ejecución de órdenes recibidas
  // ─────────────────────────────────────────────
  async function ejecutarOrdenDescarga(identificadorOrden) {
    if (ESTADO.ordenesEjecutadas.has(identificadorOrden)) {
      return "orden_repetida";
    }

    const boton = await buscarBotonDescarga();
    if (!boton) {
      return "sin_boton";
    }

    try {
      ESTADO.ordenesEjecutadas.add(identificadorOrden);
      ejecutarClick(boton);
      await esperar(400);
      return "correcto";
    } catch {
      return "error";
    }
  }

  // ─────────────────────────────────────────────
  // Escucha de órdenes entre pestañas
  // ─────────────────────────────────────────────
  try {
    GM_addValueChangeListener(
      CLAVES.orden,
      async (_clave, _valorAnterior, valorNuevo, cambioRemoto) => {
        if (!cambioRemoto || !valorNuevo || typeof valorNuevo !== "object") {
          return;
        }

        const { pestañaDestino, nonce } = valorNuevo;
        if (pestañaDestino !== ID_PESTANA) {
          return;
        }

        const resultado = await ejecutarOrdenDescarga(nonce);

        try {
          GM_setValue(CLAVES.respuesta(nonce, ID_PESTANA), resultado);
        } catch { }
      }
    );
  } catch (e) {
    console.error("Error en escuchador de órdenes:", e);
  }

  // ─────────────────────────────────────────────
  // Consulta de pestañas disponibles
  // ─────────────────────────────────────────────
  function obtenerPestanasPendientes() {
    try {
      const prefijo = "hitomi_presencia_";
      const paginasProcesadas = obtenerPaginasProcesadas();
      const todasLasClaves = GM_listValues();
      const pendientes = [];

      for (let i = 0; i < todasLasClaves.length; i++) {
        const clave = todasLasClaves[i];
        if (!clave.startsWith(prefijo)) continue;

        const id = clave.slice(prefijo.length);
        const disponible = Number(GM_getValue(clave, 0)) > 0;
        if (!disponible) continue;

        const url = GM_getValue(CLAVES.urlPestana(id), "");
        if (url && !paginasProcesadas.has(url)) {
          pendientes.push(id);
        }
      }

      return pendientes.sort();
    } catch (e) {
      console.error("Error al consultar pestañas pendientes:", e);
      return [];
    }
  }

  // ─────────────────────────────────────────────
  // Interfaz visual del usuario
  // ─────────────────────────────────────────────
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

  // ─────────────────────────────────────────────
  // Estilos de la interfaz
  // ─────────────────────────────────────────────
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

  // ─────────────────────────────────────────────
  // Crear pastilla principal
  // ─────────────────────────────────────────────
  function montarPastilla() {
    if (ESTADO.botonPastilla || !esPaginaHitomi()) return;

    const interfaz = crearInterfaz();
    const pastilla = document.createElement("div");

    pastilla.id = CONFIGURACION.ids.pastilla;
    pastilla.innerHTML = `
      <span class="hitomi-punto"></span>
      <strong>Hitomi DL</strong>
    `;
    pastilla.title = "Click para procesar páginas pendientes.\nShift + Click limpia memoria.";

    pastilla.addEventListener("click", evento => {
      if (evento.shiftKey) {
        limpiarMemoriaProcesadas();
        mostrarEstado(pastilla, "Memoria limpiada", "correcto");
        return;
      }

      recorrerPestanasDescarga(pastilla);
    });

    interfaz.appendChild(pastilla);
    ESTADO.botonPastilla = pastilla;
  }

  // ─────────────────────────────────────────────
  // Feedback visual
  // ─────────────────────────────────────────────
  let timerMostrarEstado = null;

  function mostrarEstado(elemento, mensaje, tipo) {
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

  // ─────────────────────────────────────────────
  // Ejecución del recorrido completo
  // ─────────────────────────────────────────────
  async function recorrerPestanasDescarga(pastilla) {
    if (ESTADO.bloqueado) return;
    ESTADO.bloqueado = true;

    mostrarEstado(pastilla, "Buscando...", "correcto");

    try {
      const pestañas = obtenerPestanasPendientes();

      if (!pestañas.length) {
        mostrarEstado(pastilla, "Sin pendientes", "error");
        return;
      }

      let procesadas = 0;

      for (const idPestana of pestañas) {
        const nonce = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const claveRespuesta = CLAVES.respuesta(nonce, idPestana);

        GM_deleteValue(claveRespuesta);
        GM_setValue(CLAVES.orden, {
          pestañaDestino: idPestana,
          nonce
        });

        const inicio = Date.now();
        let respuesta = null;

        while (Date.now() - inicio < CONFIGURACION.tiempoRespuestaPestana) {
          await esperar(100);
          respuesta = GM_getValue(claveRespuesta, null);
          if (respuesta) break;
        }

        // Eliminar clave temporal de respuesta para liberar almacenamiento GM
        GM_deleteValue(claveRespuesta);

        console.info(obtenerHora(), `Pestaña ${idPestana}:`, respuesta);

        if (respuesta === "correcto") {
          const url = GM_getValue(CLAVES.urlPestana(idPestana), "");
          if (url) {
            guardarPaginaProcesada(url);
          }
          procesadas++;
        }

        await esperar(CONFIGURACION.tiempoEntreOrdenes);
      }

      if (procesadas > 0) {
        mostrarEstado(pastilla, `${procesadas} completadas`, "correcto");
      } else {
        mostrarEstado(pastilla, "Sin cambios", "error");
      }
    } finally {
      ESTADO.bloqueado = false;
      publicarEstadoPestana();
    }
  }

  // ─────────────────────────────────────────────
  // Limpieza de recursos temporales
  // ─────────────────────────────────────────────
  function limpiarRegistrosPestanasAntiguas() {
    try {
      const prefijo = "hitomi_url_";
      const claves = GM_listValues().filter(clave => clave.startsWith(prefijo));

      for (const clave of claves) {
        const id = clave.replace(prefijo, "");
        const presencia = GM_getValue(CLAVES.presencia(id), null);
        if (presencia === null) {
          GM_deleteValue(clave);
        }
      }
    } catch { }
  }

  // ─────────────────────────────────────────────
  // Inicialización principal
  // ─────────────────────────────────────────────
  function iniciarScript() {
    if (!esPaginaHitomi()) return;

    limpiarRegistrosPestanasAntiguas();
    montarPastilla();
    publicarEstadoPestana();

    console.info(obtenerHora(), "Hitomi Clicker iniciado", {
      pestaña: ID_PESTANA,
      pagina: location.href
    });
  }

  // ─────────────────────────────────────────────
  // Control de carga del documento
  // ─────────────────────────────────────────────
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarScript, { once: true });
  } else {
    iniciarScript();
  }
})();
