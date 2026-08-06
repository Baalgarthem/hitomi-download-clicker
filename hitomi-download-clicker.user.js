// ==UserScript==
// @name         Hitomi Clicker
// @namespace    https://github.com/Baalgarthem/
// @version      1.2.1
// @description  Recorre pestañas abiertas de Hitomi y pulsa automáticamente el botón de descarga evitando repetir páginas ya procesadas, con modal de confirmación y modo forzado.
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
3. Muestra un popup/modal de confirmación con las pestañas detectadas.
4. Permite re-escanear pestañas o activar la descarga forzada.
5. Marca visualmente las pestañas que ya fueron procesadas en descargas forzadas.
6. Envía órdenes individuales y almacena memoria permanente de páginas procesadas.

FILOSOFÍA DE FUNCIONAMIENTO
───────────────────────────
- Página disponible: Una pestaña donde existe un botón de descarga válido.
- Página procesada: Una página donde se ejecutó la descarga previamente.
- Página pendiente: Una página nueva que requiere ser procesada.
- Página forzada: Una página previamente procesada que volverá a ser clickeada en Modo Forzado.
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
      anfitrion: "hitomi-clicker-interfaz",
      modalBackdrop: "hitomi-clicker-modal-backdrop"
    }
  };

  // ─────────────────────────────────────────────
  // Identidad única de cada pestaña
  // ─────────────────────────────────────────────
  function obtenerIdPestana() {
    const CLAVE = "hitomi_clicker_identidad_pestana";
    try {
      let id = sessionStorage.getItem(CLAVE);
      if (!id) {
        id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        sessionStorage.setItem(CLAVE, id);
      }
      return id;
    } catch {
      return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }
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
    urlPestana: id => `hitomi_url_${id}`,
    tituloPestana: id => `hitomi_titulo_${id}`
  };

  // ─────────────────────────────────────────────
  // Estado interno del script
  // ─────────────────────────────────────────────
  const ESTADO = {
    bloqueado: false,
    permitirClicForzado: false,
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
    try {
      const estilo = getComputedStyle(elemento);
      const rectangulo = elemento.getBoundingClientRect();
      return (
        estilo.display !== "none" &&
        estilo.visibility !== "hidden" &&
        rectangulo.width > 0 &&
        rectangulo.height > 0
      );
    } catch {
      return false;
    }
  }

  function ejecutarClick(elemento) {
    if (!elemento) return false;
    try {
      if (typeof elemento.click === "function") {
        elemento.click();
        return true;
      }
      return elemento.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window
        })
      );
    } catch (e) {
      console.error("Error al simular clic en el elemento:", e);
      return false;
    }
  }

  // ─────────────────────────────────────────────
  // Memoria persistente y Estado del Botón
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
      console.error("Error al guardar página procesada en memoria:", e);
    }
  }

  function paginaYaProcesada(url, memoriaSet = null) {
    try {
      const memoria = memoriaSet || obtenerPaginasProcesadas();
      return memoria.has(url);
    } catch {
      return false;
    }
  }

  function limpiarMemoriaProcesadas() {
    try {
      GM_deleteValue(CLAVES.memoriaPaginas);
    } catch (e) {
      console.error("Error al limpiar memoria:", e);
    }
  }

  function marcarBotonComoProcesado(boton, esForzado = false) {
    if (!boton) return;
    try {
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

      if (esForzado) {
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

  function resetearEstadoBotonDescarga() {
    try {
      const boton = document.querySelector(CONFIGURACION.selectorBotonDescarga);
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

  function vincularEventosBotonDescarga(boton) {
    if (!boton || boton.dataset.hitomiListenerAttached) return;
    boton.dataset.hitomiListenerAttached = "true";

    boton.addEventListener("click", evento => {
      // Si se está ejecutando una orden forzada explícita, desbloquear temporalmente el clic
      if (ESTADO.permitirClicForzado) {
        return;
      }

      if (paginaYaProcesada(location.href) || boton.getAttribute("data-hitomi-procesado") === "true") {
        console.warn(obtenerHora(), "Clic evitado: La página ya ha sido descargada previamente.");
        evento.preventDefault();
        evento.stopImmediatePropagation();
        marcarBotonComoProcesado(boton);
        return false;
      }

      try {
        guardarPaginaProcesada(location.href);
        marcarBotonComoProcesado(boton);
        publicarEstadoPestana();
      } catch (e) {
        console.error("Error al registrar clic en botón:", e);
      }
    }, true);
  }

  // ─────────────────────────────────────────────
  // Detección del botón de descarga
  // ─────────────────────────────────────────────
  async function buscarBotonDescarga(opciones = {}) {
    const intentos = opciones.intentos ?? CONFIGURACION.intentosBusquedaBoton;
    const pausa = opciones.pausa ?? CONFIGURACION.intervaloBusquedaBoton;

    for (let intento = 0; intento < intentos; intento++) {
      try {
        const boton = document.querySelector(CONFIGURACION.selectorBotonDescarga);
        if (boton && elementoVisible(boton)) {
          vincularEventosBotonDescarga(boton);
          return boton;
        }
      } catch (e) {
        console.error("Error en búsqueda de botón:", e);
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
      const yaProcesada = paginaYaProcesada(location.href, paginasProcesadas);

      if (boton && yaProcesada) {
        marcarBotonComoProcesado(boton);
      }

      const tieneBoton = (boton && elementoVisible(boton)) ? 1 : 0;

      if (ESTADO.ultimoEstadoPublicado !== tieneBoton) {
        GM_setValue(CLAVES.presencia(ID_PESTANA), tieneBoton);
        GM_setValue(CLAVES.urlPestana(ID_PESTANA), location.href);
        GM_setValue(CLAVES.tituloPestana(ID_PESTANA), document.title || location.href);
        ESTADO.ultimoEstadoPublicado = tieneBoton;
      }
    } catch (e) {
      console.error("Error al publicar estado de pestaña:", e);
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
      GM_deleteValue(CLAVES.tituloPestana(ID_PESTANA));
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
  async function ejecutarOrdenDescarga(identificadorOrden, opciones = {}) {
    const { forzar = false } = opciones;

    if (ESTADO.ordenesEjecutadas.has(identificadorOrden)) {
      return "orden_repetida";
    }

    if (!forzar && paginaYaProcesada(location.href)) {
      const botonActual = await buscarBotonDescarga({ intentos: 3, pausa: 100 });
      if (botonActual) marcarBotonComoProcesado(botonActual);
      return "ya_procesada";
    }

    const boton = await buscarBotonDescarga();
    if (!boton) {
      return "sin_boton";
    }

    if (!forzar && boton.getAttribute("data-hitomi-procesado") === "true") {
      return "ya_procesada";
    }

    try {
      ESTADO.ordenesEjecutadas.add(identificadorOrden);

      if (forzar) {
        // Desbloquear temporalmente para permitir que la web reciba el clic
        ESTADO.permitirClicForzado = true;
      }

      const exitoClick = ejecutarClick(boton);

      if (forzar) {
        // Volver a activar el bloqueo inmediatamente después del clic
        ESTADO.permitirClicForzado = false;
      }

      if (!exitoClick) {
        return "error_click";
      }

      guardarPaginaProcesada(location.href);
      marcarBotonComoProcesado(boton, forzar);

      await esperar(400);
      return "correcto";
    } catch (error) {
      ESTADO.permitirClicForzado = false;
      console.error("Error al ejecutar orden de descarga en esta pestaña:", error);
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

  // ─────────────────────────────────────────────
  // Consulta de pestañas disponibles
  // ─────────────────────────────────────────────
  function obtenerInformacionPestanas(incluirProcesadas = false) {
    try {
      const prefijo = "hitomi_presencia_";
      const paginasProcesadas = obtenerPaginasProcesadas();
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

        const yaProcesada = paginasProcesadas.has(url);
        const titulo = GM_getValue(CLAVES.tituloPestana(id), url);

        if (!yaProcesada || incluirProcesadas) {
          resultado.push({
            id,
            url,
            titulo,
            yaProcesada
          });
        }
      }

      return resultado.sort((a, b) => a.id.localeCompare(b.id));
    } catch (e) {
      console.error("Error al consultar pestañas:", e);
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
  // Estilos de la interfaz y Popups
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

    /* Modal Backdrop & Dialog */
    .hitomi-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      animation: hitomi_fade_in 0.2s ease;
    }

    @keyframes hitomi_fade_in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .hitomi-modal-contenedor {
      background: #0d1117;
      color: #c9d1d9;
      border: 1px solid #30363d;
      border-radius: 16px;
      width: 100%;
      max-width: 620px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      overflow: hidden;
      pointer-events: auto;
    }

    .hitomi-modal-header {
      padding: 18px 24px;
      border-bottom: 1px solid #21262d;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #161b22;
    }

    .hitomi-modal-titulo {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      color: #f0f6fc;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .hitomi-modal-badge-modo {
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 999px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .hitomi-modal-badge-modo.normal {
      background: rgba(35, 134, 54, 0.2);
      color: #3fb950;
      border: 1px solid rgba(63, 185, 80, 0.4);
    }

    .hitomi-modal-badge-modo.forzado {
      background: rgba(217, 119, 6, 0.2);
      color: #f59e0b;
      border: 1px solid rgba(245, 158, 11, 0.4);
    }

    .hitomi-modal-cerrar {
      background: transparent;
      border: none;
      color: #8b949e;
      font-size: 20px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
      line-height: 1;
    }

    .hitomi-modal-cerrar:hover {
      background: #21262d;
      color: #f0f6fc;
    }

    .hitomi-modal-body {
      padding: 16px 24px;
      overflow-y: auto;
      flex: 1;
      max-height: 50vh;
    }

    .hitomi-modal-instruccion {
      font-size: 13px;
      color: #8b949e;
      margin: 0 0 14px 0;
      line-height: 1.4;
    }

    .hitomi-modal-lista {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .hitomi-modal-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      background: #161b22;
      border: 1px solid #21262d;
      border-radius: 8px;
      transition: border-color 0.15s ease, background 0.15s ease;
    }

    .hitomi-modal-item:hover {
      border-color: #30363d;
      background: #1c2128;
    }

    .hitomi-modal-item.es-forzada {
      border-left: 4px solid #f59e0b;
    }

    .hitomi-modal-item input[type="checkbox"] {
      width: 16px;
      height: 16px;
      accent-color: #238636;
      cursor: pointer;
    }

    .hitomi-modal-item-info {
      flex: 1;
      min-width: 0;
    }

    .hitomi-modal-item-titulo {
      font-size: 13px;
      font-weight: 600;
      color: #f0f6fc;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .hitomi-modal-item-url {
      font-size: 11px;
      color: #8b949e;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .hitomi-item-tag {
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 4px;
      font-weight: 600;
      white-space: nowrap;
    }

    .hitomi-tag-nueva {
      background: rgba(46, 160, 67, 0.15);
      color: #3fb950;
    }

    .hitomi-tag-forzada {
      background: rgba(217, 119, 6, 0.2);
      color: #f59e0b;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }

    .hitomi-modal-vacio {
      text-align: center;
      padding: 30px 16px;
      color: #8b949e;
      font-size: 14px;
    }

    .hitomi-modal-footer {
      padding: 16px 24px;
      border-top: 1px solid #21262d;
      background: #161b22;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }

    .hitomi-modal-acciones-secundarias {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .hitomi-modal-acciones-principales {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .hitomi-btn {
      padding: 8px 14px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid transparent;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s ease, opacity 0.15s ease;
      user-select: none;
    }

    .hitomi-btn-secundario {
      background: #21262d;
      color: #c9d1d9;
      border-color: #30363d;
    }

    .hitomi-btn-secundario:hover {
      background: #30363d;
      color: #f0f6fc;
    }

    .hitomi-btn-advertencia {
      background: rgba(217, 119, 6, 0.15);
      color: #f59e0b;
      border-color: rgba(245, 158, 11, 0.4);
    }

    .hitomi-btn-advertencia:hover {
      background: rgba(217, 119, 6, 0.3);
      color: #fbbf24;
    }

    .hitomi-btn-primario {
      background: #238636;
      color: #ffffff;
    }

    .hitomi-btn-primario:hover {
      background: #2ea043;
    }

    .hitomi-btn-forzado-confirmar {
      background: #d97706;
      color: #ffffff;
    }

    .hitomi-btn-forzado-confirmar:hover {
      background: #b45309;
    }
  `);

  // ─────────────────────────────────────────────
  // Popup / Modal de Confirmación
  // ─────────────────────────────────────────────
  function mostrarPopupConfirmacion(pastilla, modoForzadoInicial = false) {
    let modoForzado = modoForzadoInicial;
    const interfaz = crearInterfaz();

    const modalExistente = document.getElementById(CONFIGURACION.ids.modalBackdrop);
    if (modalExistente) modalExistente.remove();

    const backdrop = document.createElement("div");
    backdrop.id = CONFIGURACION.ids.modalBackdrop;
    backdrop.className = "hitomi-modal-backdrop";

    function escapeHtml(texto) {
      return (texto || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    function renderizarContenidoModal() {
      const pestanasInfo = obtenerInformacionPestanas(modoForzado);
      const totalPestanas = pestanasInfo.length;
      const forzadasCount = pestanasInfo.filter(p => p.yaProcesada).length;

      backdrop.innerHTML = `
        <div class="hitomi-modal-contenedor">
          <div class="hitomi-modal-header">
            <h3 class="hitomi-modal-titulo">
              <span>📋 Pestañas Detectadas (${totalPestanas})</span>
              <span class="hitomi-modal-badge-modo ${modoForzado ? 'forzado' : 'normal'}">
                ${modoForzado ? '⚡ Modo Forzado' : '✓ Modo Normal'}
              </span>
            </h3>
            <button class="hitomi-modal-cerrar" id="hitomi-btn-cerrar-modal" title="Cerrar">✕</button>
          </div>

          <div class="hitomi-modal-body">
            <p class="hitomi-modal-instruccion">
              ${
                modoForzado
                  ? `Se re-ejecutarán descargas. Las marcadas como <strong>[⚠️ Ya descargada]</strong> volverán a ser clickeadas (${forzadasCount} en total).`
                  : 'Selecciona las pestañas a las que deseas enviar la orden de descarga:'
              }
            </p>

            ${
              totalPestanas === 0
                ? `<div class="hitomi-modal-vacio">
                     <p>No se encontraron pestañas ${modoForzado ? 'disponibles' : 'pendientes'}.</p>
                   </div>`
                : `<div class="hitomi-modal-lista" id="hitomi-modal-lista-items">
                     ${pestanasInfo
                       .map(
                         p => `
                       <div class="hitomi-modal-item ${p.yaProcesada ? 'es-forzada' : ''}">
                         <input type="checkbox" class="hitomi-check-pestana" data-id="${p.id}" checked />
                         <div class="hitomi-modal-item-info">
                           <div class="hitomi-modal-item-titulo">${escapeHtml(p.titulo)}</div>
                           <div class="hitomi-modal-item-url">${escapeHtml(p.url)}</div>
                         </div>
                         ${
                           p.yaProcesada
                             ? `<span class="hitomi-item-tag hitomi-tag-forzada">⚠️ Ya descargada (Forzada)</span>`
                             : `<span class="hitomi-item-tag hitomi-tag-nueva">Nueva</span>`
                         }
                       </div>
                     `
                       )
                       .join('')}
                   </div>`
            }
          </div>

          <div class="hitomi-modal-footer">
            <div class="hitomi-modal-acciones-secundarias">
              <button class="hitomi-btn hitomi-btn-secundario" id="hitomi-btn-reescanear" title="Volver a escanear pestañas abiertas">
                🔄 Re-escanear
              </button>
              ${
                !modoForzado
                  ? `<button class="hitomi-btn hitomi-btn-advertencia" id="hitomi-btn-modo-forzado" title="Forzar descarga en todas las pestañas">
                       ⚡ Clic Forzado
                     </button>`
                  : `<button class="hitomi-btn hitomi-btn-secundario" id="hitomi-btn-modo-normal" title="Volver al modo normal">
                       ✓ Modo Normal
                     </button>`
              }
            </div>

            <div class="hitomi-modal-acciones-principales">
              <button class="hitomi-btn hitomi-btn-secundario" id="hitomi-btn-cancelar">
                Cancelar
              </button>
              <button class="hitomi-btn ${modoForzado ? 'hitomi-btn-forzado-confirmar' : 'hitomi-btn-primario'}" id="hitomi-btn-confirmar" ${totalPestanas === 0 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>
                ${modoForzado ? '⚡ Iniciar Descarga Forzada' : '▶ Iniciar Descarga'}
              </button>
            </div>
          </div>
        </div>
      `;

      backdrop.querySelector("#hitomi-btn-cerrar-modal").addEventListener("click", cerrarModal);
      backdrop.querySelector("#hitomi-btn-cancelar").addEventListener("click", cerrarModal);

      backdrop.querySelector("#hitomi-btn-reescanear").addEventListener("click", async () => {
        await publicarEstadoPestana();
        renderizarContenidoModal();
      });

      const btnForzado = backdrop.querySelector("#hitomi-btn-modo-forzado");
      if (btnForzado) {
        btnForzado.addEventListener("click", () => {
          modoForzado = true;
          renderizarContenidoModal();
        });
      }

      const btnNormal = backdrop.querySelector("#hitomi-btn-modo-normal");
      if (btnNormal) {
        btnNormal.addEventListener("click", () => {
          modoForzado = false;
          renderizarContenidoModal();
        });
      }

      const btnConfirmar = backdrop.querySelector("#hitomi-btn-confirmar");
      if (btnConfirmar && totalPestanas > 0) {
        btnConfirmar.addEventListener("click", () => {
          const checkboxes = backdrop.querySelectorAll(".hitomi-check-pestana:checked");
          const idsSeleccionados = Array.from(checkboxes).map(cb => cb.getAttribute("data-id"));
          cerrarModal();

          if (idsSeleccionados.length > 0) {
            recorrerPestanasDescarga(pastilla, idsSeleccionados, { forzar: modoForzado });
          }
        });
      }
    }

    function cerrarModal() {
      backdrop.remove();
    }

    interfaz.appendChild(backdrop);
    renderizarContenidoModal();
  }

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
  async function recorrerPestanasDescarga(pastilla, listaIds = null, opciones = {}) {
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

      for (const idPestana of pestañas) {
        const nonce = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const claveRespuesta = CLAVES.respuesta(nonce, idPestana);

        GM_deleteValue(claveRespuesta);
        GM_setValue(CLAVES.orden, {
          pestañaDestino: idPestana,
          nonce,
          forzar
        });

        const inicio = Date.now();
        let respuesta = null;

        while (Date.now() - inicio < CONFIGURACION.tiempoRespuestaPestana) {
          await esperar(100);
          respuesta = GM_getValue(claveRespuesta, null);
          if (respuesta) break;
        }

        GM_deleteValue(claveRespuesta);

        console.info(obtenerHora(), `Pestaña ${idPestana} (forzar=${forzar}):`, respuesta);

        if (respuesta === "correcto" || respuesta === "ya_procesada") {
          const url = GM_getValue(CLAVES.urlPestana(idPestana), "");
          if (url) {
            guardarPaginaProcesada(url);
          }
          if (respuesta === "correcto") {
            procesadas++;
          }
        }

        await esperar(CONFIGURACION.tiempoEntreOrdenes);
      }

      if (procesadas > 0) {
        mostrarEstado(pastilla, `${procesadas} completadas`, "correcto");
      } else {
        mostrarEstado(pastilla, forzar ? "Completado" : "Sin cambios", "error");
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
          GM_deleteValue(CLAVES.tituloPestana(id));
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
