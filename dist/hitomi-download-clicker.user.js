// ==UserScript==
// @name         Hitomi Clicker
// @namespace    https://github.com/Baalgarthem/
// @version      1.7.6
// @description  Recorre pestañas abiertas de Hitomi y ejecuta descargas automáticas organizando archivos en 3 componentes: 「Autor/Grupo」 Título ┃ tags. Incluye edición de autor y título por ítem, fallback automático a grupo o Unknown en N/A, selección de delimitadores, extensión .cbz y menú modal de confirmación con IPC.
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
// @run-at       document-idle
// @noframes
// @license      MIT
// ==/UserScript==


(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };

/* ════════════════════════════════════════════════════════════ */
/*              MÓDULO: src/config/constants.js               */
/* ════════════════════════════════════════════════════════════ */
  function generarIdPestana() {
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
  var CONFIGURACION, ESTILOS_SEPARADOR, ID_PESTANA, CLAVES, ESTADO;
  var init_constants = __esm({
    "src/config/constants.js"() {
      CONFIGURACION = {
        dominio: "hitomi.la",
        selectorBotonDescarga: "#dl-button",
        selectoresAlternativosBoton: [
          "a#dl-button",
          "button#dl-button",
          "a[href*='download']",
          "button[onclick*='download']",
          ".download-button",
          ".dl-button",
          "[data-action='download']",
          "a.btn-download",
          "button.btn-download"
        ],
        selectoresArtista: [
          "#artists ul.comma-list li a",
          "#artists a",
          "#artists li",
          "#artists",
          ".gallery-info td a[href*='/artist/']",
          "#artist-list a",
          ".artist-list a"
        ],
        selectoresGrupo: [
          "#groups ul.comma-list li a",
          "#groups a",
          "#groups li",
          "#groups",
          "td#groups a[href*='/group/']",
          ".gallery-info td#groups a",
          "#group-list a",
          ".group-list a"
        ],
        selectoresTags: [
          "#tags ul.tags li a",
          "#tags li a",
          "#tags a",
          ".tags li a",
          ".tags a",
          "a[href*='/tag/']"
        ],
        intervaloBusquedaBoton: 150,
        intentosBusquedaBoton: 40,
        tiempoEntreOrdenes: 120,
        tiempoRespuestaPestana: 4e3,
        ids: {
          pastilla: "hitomi-clicker-pastilla",
          anfitrion: "hitomi-clicker-interfaz",
          modalBackdrop: "hitomi-clicker-modal-backdrop"
        }
      };
      ESTILOS_SEPARADOR = {
        pipe: { id: "pipe", label: "\u2503 Pipe", prefijo: " \u2503 ", sufijo: "" },
        angle: { id: "angle", label: "\u27E8\u27E9 Angular", prefijo: " \u27E8", sufijo: "\u27E9" },
        square: { id: "square", label: "[] Corchete", prefijo: " [", sufijo: "]" },
        paren: { id: "paren", label: "() Par\xE9ntesis", prefijo: " (", sufijo: ")" }
      };
      ID_PESTANA = generarIdPestana();
      CLAVES = {
        presencia: (id) => `hitomi_presencia_${id}`,
        orden: "hitomi_orden_global",
        respuesta: (nonce, id) => `hitomi_respuesta_${nonce}_${id}`,
        memoriaPaginas: "hitomi_paginas_procesadas",
        urlPestana: (id) => `hitomi_url_${id}`,
        tituloPestana: (id) => `hitomi_titulo_${id}`,
        autorPestana: (id) => `hitomi_autor_${id}`,
        tagsPestana: (id) => `hitomi_tags_${id}`,
        estiloSeparador: "hitomi_estilo_separador_tags",
        usarCbz: "hitomi_usar_extension_cbz"
      };
      ESTADO = {
        bloqueado: false,
        permitirClicForzado: false,
        ordenesEjecutadas: /* @__PURE__ */ new Set(),
        botonPastilla: null,
        ultimoEstadoPublicado: null,
        tagsSeleccionadosPorPestana: /* @__PURE__ */ new Map(),
        titulosEditadosPorPestana: /* @__PURE__ */ new Map(),
        autoresEditadosPorPestana: /* @__PURE__ */ new Map(),
        ultimoNombreFinal: null
      };
    }
  });

/* ════════════════════════════════════════════════════════════ */
/*                  MÓDULO: src/utils/dom.js                  */
/* ════════════════════════════════════════════════════════════ */
  function normalizarUrl(url) {
    if (!url || typeof url !== "string") return "";
    try {
      const urlObjeto = new URL(url.trim());
      return `${urlObjeto.protocol}//${urlObjeto.host.toLowerCase()}${urlObjeto.pathname.replace(/\/+$/, "")}`;
    } catch {
      return url.trim().split("#")[0].split("?")[0].replace(/\/+$/, "");
    }
  }
  function elementoVisible(elemento) {
    if (!elemento || !document.body || !document.body.contains(elemento)) return false;
    try {
      const estilo = getComputedStyle(elemento);
      const rectangulo = elemento.getBoundingClientRect();
      return estilo.display !== "none" && estilo.visibility !== "hidden" && estilo.opacity !== "0" && (rectangulo.width > 0 || elemento.offsetWidth > 0) && (rectangulo.height > 0 || elemento.offsetHeight > 0);
    } catch {
      return false;
    }
  }
  function escapeHtml(texto = "") {
    return (texto || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
  function obtenerOCrearAnfitrionUI(idAnfitrion) {
    let anfitrion = document.getElementById(idAnfitrion);
    if (!anfitrion) {
      anfitrion = document.createElement("div");
      anfitrion.id = idAnfitrion;
      Object.assign(anfitrion.style, {
        all: "initial",
        position: "fixed",
        inset: "0",
        zIndex: "2147483647",
        pointerEvents: "none"
      });
      (document.body || document.documentElement).appendChild(anfitrion);
    }
    return anfitrion;
  }
  var esperar, obtenerHora, esPaginaHitomi;
  var init_dom = __esm({
    "src/utils/dom.js"() {
      esperar = (milisegundos) => new Promise((resolver) => setTimeout(resolver, milisegundos));
      obtenerHora = () => `[${(/* @__PURE__ */ new Date()).toTimeString().slice(0, 8)}]`;
      esPaginaHitomi = () => /^https?:\/\/(?:www\.)?hitomi\.la\//i.test(location.href);
    }
  });

/* ════════════════════════════════════════════════════════════ */
/*                 MÓDULO: src/core/memory.js                 */
/* ════════════════════════════════════════════════════════════ */
  function obtenerMemoriaPaginasProcesadas() {
    try {
      const datosBrutos = GM_getValue(CLAVES.memoriaPaginas, {});
      const memoria = /* @__PURE__ */ new Map();
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
      console.error("Error al leer memoria de p\xE1ginas procesadas:", e);
      return /* @__PURE__ */ new Map();
    }
  }
  function guardarPaginaProcesada(url, esForzada = false) {
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
      GM_setValue(CLAVES.memoriaPaginas, objetoSerializable);
    } catch (e) {
      console.error("Error al guardar p\xE1gina procesada en memoria:", e);
    }
  }
  function obtenerEstadoPaginaProcesada(url, memoriaMap = null) {
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
  function paginaYaProcesada(url, memoriaMap = null) {
    return obtenerEstadoPaginaProcesada(url, memoriaMap).procesada;
  }
  function limpiarMemoriaProcesadas() {
    try {
      GM_deleteValue(CLAVES.memoriaPaginas);
    } catch (e) {
      console.error("Error al limpiar memoria:", e);
    }
  }
  var init_memory = __esm({
    "src/core/memory.js"() {
      init_constants();
      init_dom();
    }
  });

/* ════════════════════════════════════════════════════════════ */
/*                  MÓDULO: src/ui/badge.js                   */
/* ════════════════════════════════════════════════════════════ */
  function marcarBotonComoProcesado(boton, esForzado = false) {
    if (!boton) return;
    try {
      const estadoMemoria = obtenerEstadoPaginaProcesada(location.href);
      const debeSerForzado = esForzado || estadoMemoria.esForzada;
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
      if (debeSerForzado) {
        badge.textContent = " \u2713 Re-descargado";
        badge.style.color = "#f59e0b";
      } else {
        badge.textContent = " \u2713 Descargado";
        badge.style.color = "#12b886";
      }
    } catch (e) {
      console.error("Error al aplicar estado procesado al bot\xF3n:", e);
    }
  }
  function resetearEstadoBotonDescarga() {
    try {
      const boton = obtenerElementoBotonDescarga();
      if (boton) {
        boton.removeAttribute("data-hitomi-procesado");
        boton.style.opacity = "";
        boton.style.cursor = "";
        const badge = boton.querySelector(".hitomi-badge-procesado");
        if (badge) badge.remove();
      }
    } catch (e) {
      console.error("Error al resetear estado del bot\xF3n:", e);
    }
  }
  function vincularEventosBotonDescarga(boton) {
    if (!boton || boton.dataset.hitomiListenerAttached) return;
    boton.dataset.hitomiListenerAttached = "true";
    boton.addEventListener("click", (evento) => {
      if (ESTADO.permitirClicForzado) {
        return;
      }
      if (paginaYaProcesada(location.href) || boton.getAttribute("data-hitomi-procesado") === "true") {
        console.warn(obtenerHora(), "Clic evitado: La p\xE1gina ya ha sido descargada previamente.");
        evento.preventDefault();
        evento.stopImmediatePropagation();
        const estadoLocal = obtenerEstadoPaginaProcesada(location.href);
        marcarBotonComoProcesado(boton, estadoLocal.esForzada);
        return false;
      }
      try {
        guardarPaginaProcesada(location.href, false);
        marcarBotonComoProcesado(boton, false);
        publicarEstadoPestana();
      } catch (e) {
        console.error("Error al registrar clic en bot\xF3n:", e);
      }
    }, true);
  }
  var init_badge = __esm({
    "src/ui/badge.js"() {
      init_constants();
      init_memory();
      init_download();
      init_presence();
      init_dom();
    }
  });

/* ════════════════════════════════════════════════════════════ */
/*                 MÓDULO: src/core/author.js                 */
/* ════════════════════════════════════════════════════════════ */
  function capitalizarNombre(texto = "") {
    if (!texto || typeof texto !== "string") return "";
    return texto.trim().split(/\s+/).map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()).join(" ");
  }
  function extraerNombreAutor() {
    try {
      for (const selector of CONFIGURACION.selectoresArtista) {
        const elementos = document.querySelectorAll(selector);
        if (elementos && elementos.length > 0) {
          const nombres = [];
          elementos.forEach((el) => {
            const texto = (el.textContent || "").trim();
            if (texto && !nombres.includes(texto)) {
              nombres.push(texto);
            }
          });
          if (nombres.length > 0) {
            return nombres.join(", ");
          }
        }
      }
      const celdas = document.querySelectorAll("td, th, .gallery-info tr");
      for (let i = 0; i < celdas.length; i++) {
        const contenido = (celdas[i].textContent || "").toLowerCase();
        if (contenido.includes("artist") || contenido.includes("artista")) {
          const enlace = celdas[i].parentElement ? celdas[i].parentElement.querySelector("a") : null;
          if (enlace && enlace.textContent.trim()) {
            return enlace.textContent.trim();
          }
        }
      }
    } catch (e) {
      console.error("Error al extraer nombre del autor:", e);
    }
    return "";
  }
  function extraerNombreGrupo() {
    try {
      for (const selector of CONFIGURACION.selectoresGrupo) {
        const elementos = document.querySelectorAll(selector);
        if (elementos && elementos.length > 0) {
          const nombres = [];
          elementos.forEach((el) => {
            const texto = (el.textContent || "").trim();
            if (texto && !nombres.includes(texto)) {
              nombres.push(texto);
            }
          });
          if (nombres.length > 0) {
            return nombres.join(", ");
          }
        }
      }
      const celdas = document.querySelectorAll("td, th, .gallery-info tr");
      for (let i = 0; i < celdas.length; i++) {
        const contenido = (celdas[i].textContent || "").toLowerCase();
        if (contenido.includes("group") || contenido.includes("grupo")) {
          const enlace = celdas[i].parentElement ? celdas[i].parentElement.querySelector("a") : null;
          if (enlace && enlace.textContent.trim()) {
            return enlace.textContent.trim();
          }
        }
      }
    } catch (e) {
      console.error("Error al extraer nombre del grupo:", e);
    }
    return "";
  }
  function obtenerAutorOEstadoInicial() {
    const autor = extraerNombreAutor();
    const esAutorInvalido = !autor || /^n\/?a$/i.test(autor.trim()) || /^none$/i.test(autor.trim()) || /^unknown$/i.test(autor.trim());
    if (!esAutorInvalido) {
      return capitalizarNombre(autor);
    }
    const grupo = extraerNombreGrupo();
    const esGrupoInvalido = !grupo || /^n\/?a$/i.test(grupo.trim()) || /^none$/i.test(grupo.trim()) || /^unknown$/i.test(grupo.trim());
    if (!esGrupoInvalido) {
      return capitalizarNombre(grupo);
    }
    return "Unknown";
  }
  function formatearNombreAutor(autor) {
    let autorLimpio = (autor || "").trim();
    autorLimpio = autorLimpio.replace(/^「\s*/, "").replace(/\s*」$/, "").trim();
    const esInvalidoOSinAutor = !autorLimpio || /^n\/?a$/i.test(autorLimpio) || /^none$/i.test(autorLimpio) || /^unknown$/i.test(autorLimpio);
    if (esInvalidoOSinAutor) {
      return "\u300CUnknown\u300D";
    }
    const nombreCapitalizado = capitalizarNombre(autorLimpio);
    return `\u300C${nombreCapitalizado}\u300D`;
  }
  var init_author = __esm({
    "src/core/author.js"() {
      init_constants();
    }
  });

/* ════════════════════════════════════════════════════════════ */
/*                  MÓDULO: src/core/tags.js                  */
/* ════════════════════════════════════════════════════════════ */
  function limpiarNombreTag(rawTag = "") {
    if (!rawTag || typeof rawTag !== "string") return "";
    let tag = rawTag.trim();
    tag = tag.replace(/[♀♂]/g, "").trim();
    tag = tag.replace(/^(?:female|male|group|parody|character|language):/i, "").trim();
    return tag.replace(/\s+/g, " ");
  }
  function limpiarTituloBase(rawTitle = "", autorNombre = "") {
    let titulo = (rawTitle || document.title || "").trim();
    titulo = titulo.replace(/\s*[\|║\-\/┃]\s*Hitomi(?:\.la)?.*$/i, "").trim();
    titulo = titulo.replace(/^Read online at Hitomi(?:\.la)?\s*[\|║\-\/┃]\s*/i, "").trim();
    titulo = titulo.replace(/「[^」]+」/g, "").trim();
    const autorLimpio = (autorNombre || "").trim();
    if (autorLimpio) {
      const regexByAutor = new RegExp(`\\s+(?:by|por)\\s+${autorLimpio.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
      titulo = titulo.replace(regexByAutor, "").trim();
    }
    titulo = titulo.replace(/\s+(?:by|por)\s+[\w\s\.\-]+$/i, "").trim();
    titulo = titulo.split("\u2503")[0].trim();
    titulo = titulo.replace(/\s*[⟨\[\(].*?[⟩\]\)]\s*$/g, "").trim();
    return titulo.replace(/\s+/g, " ");
  }
  function extraerTagsPagina() {
    const listaTags = [];
    const procesadosSet = /* @__PURE__ */ new Set();
    try {
      for (const selector of CONFIGURACION.selectoresTags) {
        const elementos = document.querySelectorAll(selector);
        if (elementos && elementos.length > 0) {
          elementos.forEach((el) => {
            const textoRaw = (el.textContent || "").trim();
            const textoClean = limpiarNombreTag(textoRaw);
            if (textoClean && !procesadosSet.has(textoClean)) {
              procesadosSet.add(textoClean);
              listaTags.push({
                raw: textoRaw,
                clean: textoClean
              });
            }
          });
          if (listaTags.length > 0) break;
        }
      }
    } catch (e) {
      console.error("Error al extraer tags de la p\xE1gina:", e);
    }
    return listaTags;
  }
  function formatearCadenaTags(tagsSeleccionados = [], estiloId = null) {
    if (!Array.isArray(tagsSeleccionados) || tagsSeleccionados.length === 0) {
      return "";
    }
    const tagsValidos = tagsSeleccionados.map((t) => typeof t === "string" ? limpiarNombreTag(t) : typeof t === "object" && t ? limpiarNombreTag(t.clean || t.raw) : "").filter(Boolean);
    if (tagsValidos.length === 0) return "";
    const estiloFinal = estiloId || (typeof GM_getValue !== "undefined" ? GM_getValue(CLAVES.estiloSeparador, "pipe") : "pipe");
    const configEstilo = ESTILOS_SEPARADOR[estiloFinal] || ESTILOS_SEPARADOR.pipe;
    return `${configEstilo.prefijo}${tagsValidos.join(" ")}${configEstilo.sufijo}`;
  }
  function obtenerNombreFinalCompleto(opciones = {}) {
    const {
      tituloOriginal = "",
      autor = null,
      tagsSeleccionados = [],
      estiloSeparador = null
    } = opciones;
    const autorTarget = autor !== null && autor !== void 0 && String(autor).trim() !== "" ? String(autor).trim() : obtenerAutorOEstadoInicial();
    const autorFormateado = formatearNombreAutor(autorTarget);
    const tituloLimpio = limpiarTituloBase(tituloOriginal, autorTarget);
    const seccionTags = formatearCadenaTags(tagsSeleccionados, estiloSeparador);
    let nombreFinal = `${autorFormateado} ${tituloLimpio}`.trim();
    if (seccionTags) {
      nombreFinal = `${nombreFinal}${seccionTags}`;
    }
    return nombreFinal;
  }
  var init_tags = __esm({
    "src/core/tags.js"() {
      init_constants();
      init_author();
    }
  });

/* ════════════════════════════════════════════════════════════ */
/*                MÓDULO: src/core/download.js                */
/* ════════════════════════════════════════════════════════════ */
  function obtenerElementoBotonDescarga() {
    try {
      const botonPrincipal = document.querySelector(CONFIGURACION.selectorBotonDescarga);
      if (botonPrincipal && elementoVisible(botonPrincipal)) {
        return botonPrincipal;
      }
      for (const selector of CONFIGURACION.selectoresAlternativosBoton) {
        const candidato = document.querySelector(selector);
        if (candidato && elementoVisible(candidato)) {
          return candidato;
        }
      }
      const elementosInteractivos = document.querySelectorAll("button, a, div[role='button'], span[role='button']");
      for (let i = 0; i < elementosInteractivos.length; i++) {
        const el = elementosInteractivos[i];
        if (!elementoVisible(el)) continue;
        const id = (el.id || "").toLowerCase();
        const clase = (el.className || "").toString().toLowerCase();
        const texto = (el.textContent || "").toLowerCase();
        const title = (el.getAttribute("title") || "").toLowerCase();
        const ariaLabel = (el.getAttribute("aria-label") || "").toLowerCase();
        if (id.includes("dl-button") || id.includes("download") || clase.includes("download") || texto.includes("download") || texto.includes("descargar") || title.includes("download") || ariaLabel.includes("download")) {
          return el;
        }
      }
    } catch (e) {
      console.error("Error al buscar elemento de bot\xF3n de descarga:", e);
    }
    return null;
  }
  async function buscarBotonDescarga(opciones = {}) {
    const intentos = opciones.intentos ?? CONFIGURACION.intentosBusquedaBoton;
    const pausa = opciones.pausa ?? CONFIGURACION.intervaloBusquedaBoton;
    for (let intento = 0; intento < intentos; intento++) {
      try {
        const boton = obtenerElementoBotonDescarga();
        if (boton) {
          vincularEventosBotonDescarga(boton);
          return boton;
        }
      } catch (e) {
        console.error("Error en b\xFAsqueda de bot\xF3n:", e);
      }
      await esperar(pausa);
    }
    return null;
  }
  function generarNombreFinalConExtension(referenciaUrl = "") {
    let nombreBase = ESTADO.ultimoNombreFinal;
    if (!nombreBase) {
      const autor = ESTADO.autoresEditadosPorPestana.get(ID_PESTANA) || obtenerAutorOEstadoInicial();
      const tituloBase = ESTADO.titulosEditadosPorPestana.get(ID_PESTANA) || document.title || "";
      const tagsSeleccionados = ESTADO.tagsSeleccionadosPorPestana.get(ID_PESTANA) || [];
      const estiloSeparador = typeof GM_getValue !== "undefined" ? GM_getValue(CLAVES.estiloSeparador, "pipe") : "pipe";
      nombreBase = obtenerNombreFinalCompleto({
        tituloOriginal: tituloBase,
        autor,
        tagsSeleccionados,
        estiloSeparador
      });
    }
    if (!nombreBase) return "";
    const usarCbz = typeof GM_getValue !== "undefined" ? GM_getValue(CLAVES.usarCbz, false) : false;
    const baseLimpia = nombreBase.replace(/\.zip$/i, "").replace(/\.cbz$/i, "");
    if (usarCbz) {
      return `${baseLimpia}.cbz`;
    }
    const matchExt = (referenciaUrl || "").match(/\.([a-z0-9]{2,4})(?:[\?#]|$)/i);
    let extension = matchExt ? `.${matchExt[1]}` : ".zip";
    if (extension.toLowerCase() === ".cbz" && !usarCbz) {
      extension = ".zip";
    }
    return `${baseLimpia}${extension}`;
  }
  function interceptarDescargasNativas() {
    if (interceptorRegistrado) return;
    interceptorRegistrado = true;
    try {
      if (typeof document !== "undefined") {
        document.addEventListener("click", (evento) => {
          try {
            const target = evento.target ? evento.target.closest("a, button, #dl-button, .download-button, [download]") || evento.target : null;
            if (!target) return;
            const esEnlaceODescarga = target.tagName === "A" || target.hasAttribute("download") || target.id === "dl-button" || target.className && typeof target.className === "string" && target.className.includes("download");
            if (esEnlaceODescarga) {
              const ref = target.getAttribute("download") || target.download || target.getAttribute("href") || target.href || "";
              const nombreConExt = generarNombreFinalConExtension(ref);
              if (nombreConExt) {
                target.setAttribute("download", nombreConExt);
                if ("download" in target) {
                  target.download = nombreConExt;
                }
                const enlacesHijos = target.querySelectorAll ? target.querySelectorAll("a") : [];
                enlacesHijos.forEach((a) => {
                  a.setAttribute("download", nombreConExt);
                  a.download = nombreConExt;
                });
              }
            }
          } catch (err) {
            console.error("Error en interceptor global de clics:", err);
          }
        }, true);
      }
      if (typeof HTMLAnchorElement !== "undefined") {
        const originalClick = HTMLAnchorElement.prototype.click;
        HTMLAnchorElement.prototype.click = function(...args) {
          try {
            const ref = this.getAttribute("download") || this.download || this.getAttribute("href") || this.href || "";
            const nombreConExt = generarNombreFinalConExtension(ref);
            if (nombreConExt) {
              this.setAttribute("download", nombreConExt);
              this.download = nombreConExt;
            }
          } catch (err) {
            console.error("Error en HTMLAnchorElement.prototype.click:", err);
          }
          return originalClick.apply(this, args);
        };
        try {
          const descriptor = Object.getOwnPropertyDescriptor(HTMLAnchorElement.prototype, "download");
          if (descriptor && descriptor.set) {
            const originalSet = descriptor.set;
            Object.defineProperty(HTMLAnchorElement.prototype, "download", {
              set: function(valor) {
                const nombreConExt = generarNombreFinalConExtension(valor || this.href || "");
                return originalSet.call(this, nombreConExt || valor);
              },
              get: descriptor.get,
              configurable: true,
              enumerable: true
            });
          }
        } catch {
        }
        try {
          const originalSetAttribute = HTMLAnchorElement.prototype.setAttribute;
          HTMLAnchorElement.prototype.setAttribute = function(nombreAtributo, valorAtributo, ...restoArgs) {
            if (typeof nombreAtributo === "string" && nombreAtributo.toLowerCase() === "download") {
              const nombreConExt = generarNombreFinalConExtension(valorAtributo || this.href || "");
              return originalSetAttribute.call(this, nombreAtributo, nombreConExt || valorAtributo, ...restoArgs);
            }
            return originalSetAttribute.call(this, nombreAtributo, valorAtributo, ...restoArgs);
          };
        } catch {
        }
        try {
          const descriptorHref = Object.getOwnPropertyDescriptor(HTMLAnchorElement.prototype, "href");
          if (descriptorHref && descriptorHref.set) {
            const originalSetHref = descriptorHref.set;
            Object.defineProperty(HTMLAnchorElement.prototype, "href", {
              set: function(valor) {
                const res = originalSetHref.call(this, valor);
                try {
                  if (this.hasAttribute("download") || this.id === "dl-button" || this.className && typeof this.className === "string" && this.className.includes("download")) {
                    const ref = valor || this.getAttribute("download") || this.download || "";
                    const nombreConExt = generarNombreFinalConExtension(ref);
                    if (nombreConExt) {
                      this.setAttribute("download", nombreConExt);
                      this.download = nombreConExt;
                    }
                  }
                } catch {
                }
                return res;
              },
              get: descriptorHref.get,
              configurable: true,
              enumerable: true
            });
          }
        } catch {
        }
      }
      if (typeof window !== "undefined" && window.URL && typeof window.URL.createObjectURL === "function") {
        try {
          const originalCreateObjectURL = window.URL.createObjectURL;
          window.URL.createObjectURL = function(object) {
            const url = originalCreateObjectURL.call(this, object);
            try {
              if (url && typeof url === "string") {
                const nombreConExt = generarNombreFinalConExtension(url);
                if (nombreConExt && typeof document !== "undefined") {
                  setTimeout(() => {
                    try {
                      const enlacesConBlob = document.querySelectorAll(`a[href="${url}"]`);
                      enlacesConBlob.forEach((a) => {
                        a.setAttribute("download", nombreConExt);
                        a.download = nombreConExt;
                      });
                    } catch {
                    }
                  }, 0);
                }
              }
            } catch {
            }
            return url;
          };
        } catch {
        }
      }
      if (typeof window !== "undefined" && typeof window.fetch === "function") {
        try {
          const originalFetch = window.fetch;
          window.fetch = async function(input, init) {
            try {
              const urlStr = typeof input === "string" ? input : input && input.url ? input.url : "";
              if (urlStr && (urlStr.endsWith(".zip") || urlStr.endsWith(".cbz") || urlStr.includes("/download/"))) {
                generarNombreFinalConExtension(urlStr);
              }
            } catch {
            }
            return originalFetch.apply(this, arguments);
          };
        } catch {
        }
      }
      if (typeof XMLHttpRequest !== "undefined" && XMLHttpRequest.prototype && typeof XMLHttpRequest.prototype.open === "function") {
        try {
          const originalXhrOpen = XMLHttpRequest.prototype.open;
          XMLHttpRequest.prototype.open = function(method, url, ...resto) {
            try {
              const urlStr = typeof url === "string" ? url : url ? url.toString() : "";
              if (urlStr && (urlStr.endsWith(".zip") || urlStr.endsWith(".cbz") || urlStr.includes("/download/"))) {
                generarNombreFinalConExtension(urlStr);
              }
            } catch {
            }
            return originalXhrOpen.call(this, method, url, ...resto);
          };
        } catch {
        }
      }
    } catch (e) {
      console.error("Error al registrar interceptor multinivel de descargas:", e);
    }
  }
  function confirmarYEjecutarClic(boton, esForzado = false, tagsSeleccionados = [], estiloSeparador = null, tituloPersonalizado = null, autorPersonalizado = null) {
    if (!boton) return false;
    let fueClickeadoConExito = false;
    try {
      interceptarDescargasNativas();
      if (Array.isArray(tagsSeleccionados)) {
        ESTADO.tagsSeleccionadosPorPestana.set(ID_PESTANA, tagsSeleccionados);
      }
      if (tituloPersonalizado && typeof tituloPersonalizado === "string" && tituloPersonalizado.trim()) {
        ESTADO.titulosEditadosPorPestana.set(ID_PESTANA, tituloPersonalizado.trim());
      }
      if (autorPersonalizado && typeof autorPersonalizado === "string" && autorPersonalizado.trim()) {
        ESTADO.autoresEditadosPorPestana.set(ID_PESTANA, autorPersonalizado.trim());
      }
      const teniaProcesado = boton.getAttribute("data-hitomi-procesado");
      const estiloPointerPrevio = boton.style.pointerEvents;
      const deshabilitadoPrevio = boton.disabled;
      const estiloActivo = estiloSeparador || (typeof GM_getValue !== "undefined" ? GM_getValue(CLAVES.estiloSeparador, "pipe") : "pipe");
      const autorTarget = autorPersonalizado && typeof autorPersonalizado === "string" && autorPersonalizado.trim() ? autorPersonalizado.trim() : ESTADO.autoresEditadosPorPestana.get(ID_PESTANA) || obtenerAutorOEstadoInicial();
      const tituloBase = tituloPersonalizado && typeof tituloPersonalizado === "string" && tituloPersonalizado.trim() ? tituloPersonalizado.trim() : ESTADO.titulosEditadosPorPestana.get(ID_PESTANA) || document.title;
      const tagsEfectivos = Array.isArray(tagsSeleccionados) && tagsSeleccionados.length > 0 ? tagsSeleccionados : ESTADO.tagsSeleccionadosPorPestana.get(ID_PESTANA) || [];
      const nombreFinalCompleto = obtenerNombreFinalCompleto({
        tituloOriginal: tituloBase,
        autor: autorTarget,
        tagsSeleccionados: tagsEfectivos,
        estiloSeparador: estiloActivo
      });
      if (nombreFinalCompleto) {
        ESTADO.ultimoNombreFinal = nombreFinalCompleto;
        const nombreFinalConExt = generarNombreFinalConExtension();
        try {
          const tituloLimpioSinExt = nombreFinalCompleto.replace(/\.cbz$/i, "").replace(/\.zip$/i, "");
          document.title = tituloLimpioSinExt;
        } catch {
        }
        boton.setAttribute("data-hitomi-nombre-final", nombreFinalConExt);
        if (tagsEfectivos.length > 0) {
          boton.setAttribute("data-hitomi-tags", formatearCadenaTags(tagsEfectivos, estiloActivo));
        }
        boton.setAttribute("title", nombreFinalConExt);
        boton.setAttribute("download", nombreFinalConExt);
        if ("download" in boton) boton.download = nombreFinalConExt;
        const enlacesHijos = boton.querySelectorAll("a");
        enlacesHijos.forEach((a) => {
          a.setAttribute("download", nombreFinalConExt);
          a.download = nombreFinalConExt;
        });
      }
      ESTADO.permitirClicForzado = true;
      boton.removeAttribute("data-hitomi-procesado");
      boton.style.pointerEvents = "auto";
      if ("disabled" in boton) boton.disabled = false;
      let eventoCapturado = false;
      const comprobadorClic = () => {
        eventoCapturado = true;
      };
      boton.addEventListener("click", comprobadorClic, { capture: true, once: true });
      if (typeof boton.focus === "function") {
        try {
          boton.focus();
        } catch {
        }
      }
      if (typeof boton.click === "function") {
        boton.click();
      } else {
        const mouseEvent = new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window
        });
        boton.dispatchEvent(mouseEvent);
      }
      fueClickeadoConExito = true;
      if (esForzado) {
        ESTADO.permitirClicForzado = false;
        if (teniaProcesado) boton.setAttribute("data-hitomi-procesado", teniaProcesado);
        boton.style.pointerEvents = estiloPointerPrevio;
        if ("disabled" in boton) boton.disabled = deshabilitadoPrevio;
      } else {
        ESTADO.permitirClicForzado = false;
      }
    } catch (e) {
      ESTADO.permitirClicForzado = false;
      console.error("Error al ejecutar y confirmar clic real:", e);
      fueClickeadoConExito = false;
    }
    return fueClickeadoConExito;
  }
  async function ejecutarOrdenDescarga(identificadorOrden, opciones = {}) {
    const { forzar = false, tagsSeleccionados = [], estiloSeparador = null, tituloPersonalizado = null, autorPersonalizado = null } = opciones;
    if (Array.isArray(tagsSeleccionados)) {
      ESTADO.tagsSeleccionadosPorPestana.set(ID_PESTANA, tagsSeleccionados);
    }
    if (tituloPersonalizado) {
      ESTADO.titulosEditadosPorPestana.set(ID_PESTANA, tituloPersonalizado);
    }
    if (autorPersonalizado) {
      ESTADO.autoresEditadosPorPestana.set(ID_PESTANA, autorPersonalizado);
    }
    if (ESTADO.ordenesEjecutadas.has(identificadorOrden)) {
      return "orden_repetida";
    }
    const estadoPagina = obtenerEstadoPaginaProcesada(location.href);
    if (!forzar && estadoPagina.procesada) {
      const botonActual = await buscarBotonDescarga({ intentos: 3, pausa: 100 });
      if (botonActual) marcarBotonComoProcesado(botonActual, estadoPagina.esForzada);
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
      const clicConfirmado = confirmarYEjecutarClic(boton, forzar, tagsSeleccionados, estiloSeparador, tituloPersonalizado, autorPersonalizado);
      if (!clicConfirmado) {
        console.warn(obtenerHora(), "Clic no confirmado o bloqueado en el elemento objetivo.");
        return "error_click";
      }
      guardarPaginaProcesada(location.href, forzar);
      marcarBotonComoProcesado(boton, forzar);
      await esperar(400);
      return "correcto";
    } catch (error) {
      ESTADO.permitirClicForzado = false;
      console.error("Error al ejecutar orden de descarga en esta pesta\xF1a:", error);
      return "error";
    }
  }
  var interceptorRegistrado;
  var init_download = __esm({
    "src/core/download.js"() {
      init_constants();
      init_dom();
      init_memory();
      init_badge();
      init_author();
      init_tags();
      interceptorRegistrado = false;
    }
  });

/* ════════════════════════════════════════════════════════════ */
/*                  MÓDULO: src/ui/modal.js                   */
/* ════════════════════════════════════════════════════════════ */
  function aplicarEstilosModal() {
    GM_addStyle(`
    .hitomi-modal-backdrop, .hitomi-tag-modal-backdrop {
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

    .hitomi-modal-contenedor, .hitomi-tag-modal-contenedor {
      background: #0d1117;
      color: #c9d1d9;
      border: 1px solid #30363d;
      border-radius: 16px;
      width: 100%;
      max-width: 640px;
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
      user-select: none;
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

    .hitomi-modal-inputs-row {
      display: flex;
      gap: 6px;
      margin-bottom: 3px;
    }

    .hitomi-input-autor-item {
      background: #0d1117;
      color: #3fb950;
      border: 1px solid #30363d;
      border-radius: 6px;
      padding: 4px 8px;
      font-size: 13px;
      font-weight: 600;
      width: 120px;
      box-sizing: border-box;
      transition: border-color 0.15s ease, background 0.15s ease;
    }

    .hitomi-input-autor-item:focus {
      border-color: #58a6ff;
      outline: none;
      background: #161b22;
      box-shadow: 0 0 0 2px rgba(88, 166, 255, 0.2);
    }

    .hitomi-input-titulo-item {
      background: #0d1117;
      color: #f0f6fc;
      border: 1px solid #30363d;
      border-radius: 6px;
      padding: 4px 8px;
      font-size: 13px;
      font-weight: 600;
      flex: 1;
      min-width: 0;
      box-sizing: border-box;
      transition: border-color 0.15s ease, background 0.15s ease;
    }

    .hitomi-input-titulo-item:focus {
      border-color: #58a6ff;
      outline: none;
      background: #161b22;
      box-shadow: 0 0 0 2px rgba(88, 166, 255, 0.2);
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

    /* Estilos del Selector de Tags */
    .hitomi-btn-abrir-tags {
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 6px;
      background: #21262d;
      color: #58a6ff;
      border: 1px solid #30363d;
      cursor: pointer;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: background 0.15s ease, border-color 0.15s ease;
    }

    .hitomi-btn-abrir-tags:hover {
      background: #30363d;
      border-color: #58a6ff;
    }

    .hitomi-btn-abrir-tags.tiene-tags {
      background: rgba(88, 166, 255, 0.15);
      color: #79c0ff;
      border-color: rgba(88, 166, 255, 0.4);
    }

    .hitomi-estilo-separador-contenedor {
      margin-bottom: 14px;
      padding: 10px 14px;
      background: #161b22;
      border: 1px solid #21262d;
      border-radius: 8px;
    }

    .hitomi-selector-estilos {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .hitomi-btn-estilo-tag {
      font-size: 11px;
      padding: 5px 10px;
      border-radius: 6px;
      background: #21262d;
      color: #8b949e;
      border: 1px solid #30363d;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.15s ease;
      user-select: none;
    }

    .hitomi-btn-estilo-tag:hover {
      border-color: #58a6ff;
      color: #c9d1d9;
    }

    .hitomi-btn-estilo-tag.activo {
      background: rgba(35, 134, 54, 0.2);
      color: #3fb950;
      border-color: #3fb950;
      font-weight: 600;
    }

    .hitomi-grid-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 12px 0;
      max-height: 40vh;
      overflow-y: auto;
    }

    .hitomi-pill-tag {
      font-size: 12px;
      padding: 6px 12px;
      border-radius: 999px;
      background: #21262d;
      color: #8b949e;
      border: 1px solid #30363d;
      cursor: pointer;
      user-select: none;
      font-weight: 500;
      transition: all 0.15s ease;
    }

    .hitomi-pill-tag:hover {
      border-color: #58a6ff;
      color: #c9d1d9;
    }

    .hitomi-pill-tag.activa {
      background: #1f6feb;
      color: #ffffff;
      border-color: #58a6ff;
      font-weight: 600;
      box-shadow: 0 0 8px rgba(31, 111, 235, 0.4);
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
      flex-wrap: wrap;
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

    .hitomi-btn-peligro {
      background: rgba(176, 0, 32, 0.15);
      color: #f87171;
      border-color: rgba(176, 0, 32, 0.4);
    }

    .hitomi-btn-peligro:hover {
      background: rgba(176, 0, 32, 0.3);
      color: #fca5a5;
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
  }
  function vincularSeleccionMultipleCheckboxes(listaContenedor) {
    let ultimoCheckClickeado = null;
    listaContenedor.addEventListener("click", (evento) => {
      const checkbox = evento.target.closest(".hitomi-check-pestana");
      if (!checkbox) return;
      const todosCheckboxes = Array.from(listaContenedor.querySelectorAll(".hitomi-check-pestana"));
      if (evento.shiftKey && ultimoCheckClickeado && ultimoCheckClickeado !== checkbox) {
        const idxInicio = todosCheckboxes.indexOf(ultimoCheckClickeado);
        const idxFin = todosCheckboxes.indexOf(checkbox);
        if (idxInicio !== -1 && idxFin !== -1) {
          const inicio = Math.min(idxInicio, idxFin);
          const fin = Math.max(idxInicio, idxFin);
          const estadoMarcado = checkbox.checked;
          for (let i = inicio; i <= fin; i++) {
            todosCheckboxes[i].checked = estadoMarcado;
          }
        }
      }
      ultimoCheckClickeado = checkbox;
    });
  }
  function mostrarModalSeleccionTags(pestanaId, tituloPestana, tagsDisponibles = [], tagsPreseleccionados = [], callbackGuardar) {
    const interfaz = obtenerOCrearAnfitrionUI(CONFIGURACION.ids.anfitrion);
    const backdropTag = document.createElement("div");
    backdropTag.className = "hitomi-tag-modal-backdrop";
    const tagsSeleccionadosSet = new Set(
      Array.isArray(tagsPreseleccionados) && tagsPreseleccionados.length > 0 ? tagsPreseleccionados : ESTADO.tagsSeleccionadosPorPestana.get(pestanaId) || []
    );
    let estiloActual = typeof GM_getValue !== "undefined" ? GM_getValue(CLAVES.estiloSeparador, "pipe") : "pipe";
    backdropTag.innerHTML = `
    <div class="hitomi-tag-modal-contenedor">
      <div class="hitomi-modal-header">
        <h3 class="hitomi-modal-titulo">
          <span>\u{1F3F7}\uFE0F Seleccionar Tags para: ${escapeHtml(tituloPestana)}</span>
        </h3>
        <button class="hitomi-modal-cerrar" id="hitomi-tag-btn-cerrar">\u2715</button>
      </div>

      <div class="hitomi-modal-body">
        <div class="hitomi-estilo-separador-contenedor">
          <div style="font-size: 12px; font-weight: 600; color: #c9d1d9; margin-bottom: 8px;">
            \u{1F4D0} Estilo del Separador de Tags:
          </div>
          <div class="hitomi-selector-estilos" id="hitomi-selector-estilos-tags">
            <button class="hitomi-btn-estilo-tag ${estiloActual === "pipe" ? "activo" : ""}" data-estilo="pipe">
              \u2503 Pipe ( \u2503 tags)
            </button>
            <button class="hitomi-btn-estilo-tag ${estiloActual === "angle" ? "activo" : ""}" data-estilo="angle">
              \u27E8\u27E9 Angular ( \u27E8tags\u27E9)
            </button>
            <button class="hitomi-btn-estilo-tag ${estiloActual === "square" ? "activo" : ""}" data-estilo="square">
              [] Corchete ( [tags])
            </button>
            <button class="hitomi-btn-estilo-tag ${estiloActual === "paren" ? "activo" : ""}" data-estilo="paren">
              () Par\xE9ntesis ( (tags))
            </button>
          </div>
        </div>

        <p class="hitomi-modal-instruccion">
          Selecciona las etiquetas que deseas a\xF1adir al nombre del archivo concatenadas:
        </p>

        ${tagsDisponibles.length === 0 ? `<div class="hitomi-modal-vacio"><p>No se encontraron etiquetas en esta p\xE1gina.</p></div>` : `<div class="hitomi-grid-tags" id="hitomi-contenedor-pills">
                ${tagsDisponibles.map((t) => {
      const tagClean = typeof t === "object" ? t.clean : t;
      const estaActivo = tagsSeleccionadosSet.has(tagClean);
      return `<div class="hitomi-pill-tag ${estaActivo ? "activa" : ""}" data-tag="${escapeHtml(tagClean)}">${escapeHtml(tagClean)}</div>`;
    }).join("")}
               </div>`}
      </div>

      <div class="hitomi-modal-footer">
        <div class="hitomi-modal-acciones-secundarias">
          <button class="hitomi-btn hitomi-btn-secundario" id="hitomi-tag-btn-todos">Seleccionar Todos</button>
          <button class="hitomi-btn hitomi-btn-secundario" id="hitomi-tag-btn-ninguno">Limpiar Selecci\xF3n</button>
        </div>
        <div class="hitomi-modal-acciones-principales">
          <button class="hitomi-btn hitomi-btn-secundario" id="hitomi-tag-btn-cancelar">Cancelar</button>
          <button class="hitomi-btn hitomi-btn-primario" id="hitomi-tag-btn-guardar">Guardar Tags</button>
        </div>
      </div>
    </div>
  `;
    interfaz.appendChild(backdropTag);
    const selectorEstilos = backdropTag.querySelector("#hitomi-selector-estilos-tags");
    if (selectorEstilos) {
      selectorEstilos.addEventListener("click", (ev) => {
        const btnEstilo = ev.target.closest(".hitomi-btn-estilo-tag");
        if (!btnEstilo) return;
        const nuevoEstilo = btnEstilo.getAttribute("data-estilo");
        if (typeof GM_setValue !== "undefined") {
          GM_setValue(CLAVES.estiloSeparador, nuevoEstilo);
        }
        selectorEstilos.querySelectorAll(".hitomi-btn-estilo-tag").forEach((b) => b.classList.remove("activo"));
        btnEstilo.classList.add("activo");
      });
    }
    const contenedorPills = backdropTag.querySelector("#hitomi-contenedor-pills");
    if (contenedorPills) {
      contenedorPills.addEventListener("click", (ev) => {
        const pill = ev.target.closest(".hitomi-pill-tag");
        if (!pill) return;
        const tagNombre = pill.getAttribute("data-tag");
        if (tagsSeleccionadosSet.has(tagNombre)) {
          tagsSeleccionadosSet.delete(tagNombre);
          pill.classList.remove("activa");
        } else {
          tagsSeleccionadosSet.add(tagNombre);
          pill.classList.add("activa");
        }
      });
    }
    const btnTodos = backdropTag.querySelector("#hitomi-tag-btn-todos");
    if (btnTodos && contenedorPills) {
      btnTodos.addEventListener("click", () => {
        contenedorPills.querySelectorAll(".hitomi-pill-tag").forEach((pill) => {
          const tagNombre = pill.getAttribute("data-tag");
          tagsSeleccionadosSet.add(tagNombre);
          pill.classList.add("activa");
        });
      });
    }
    const btnNinguno = backdropTag.querySelector("#hitomi-tag-btn-ninguno");
    if (btnNinguno && contenedorPills) {
      btnNinguno.addEventListener("click", () => {
        tagsSeleccionadosSet.clear();
        contenedorPills.querySelectorAll(".hitomi-pill-tag").forEach((pill) => {
          pill.classList.remove("activa");
        });
      });
    }
    const cerrar = () => backdropTag.remove();
    backdropTag.querySelector("#hitomi-tag-btn-cerrar").addEventListener("click", cerrar);
    backdropTag.querySelector("#hitomi-tag-btn-cancelar").addEventListener("click", cerrar);
    backdropTag.querySelector("#hitomi-tag-btn-guardar").addEventListener("click", () => {
      const listaFinal = Array.from(tagsSeleccionadosSet);
      ESTADO.tagsSeleccionadosPorPestana.set(pestanaId, listaFinal);
      cerrar();
      if (typeof callbackGuardar === "function") callbackGuardar(listaFinal);
    });
  }
  function mostrarPopupConfirmacion(pastilla, modoForzadoInicial = false) {
    let modoForzado = modoForzadoInicial;
    const interfaz = obtenerOCrearAnfitrionUI(CONFIGURACION.ids.anfitrion);
    const modalExistente = document.getElementById(CONFIGURACION.ids.modalBackdrop);
    if (modalExistente) modalExistente.remove();
    const backdrop = document.createElement("div");
    backdrop.id = CONFIGURACION.ids.modalBackdrop;
    backdrop.className = "hitomi-modal-backdrop";
    function renderizarContenidoModal() {
      const pestanasInfo = obtenerInformacionPestanas(modoForzado);
      const totalPestanas = pestanasInfo.length;
      const forzadasCount = pestanasInfo.filter((p) => p.yaProcesada).length;
      const usarCbz = typeof GM_getValue !== "undefined" ? GM_getValue(CLAVES.usarCbz, false) : false;
      backdrop.innerHTML = `
      <div class="hitomi-modal-contenedor">
        <div class="hitomi-modal-header">
          <h3 class="hitomi-modal-titulo">
            <span>\u{1F4CB} Pesta\xF1as Detectadas (${totalPestanas})</span>
            <span class="hitomi-modal-badge-modo ${modoForzado ? "forzado" : "normal"}">
              ${modoForzado ? "\u26A1 Modo Forzado" : "\u2713 Modo Normal"}
            </span>
          </h3>
          <button class="hitomi-modal-cerrar" id="hitomi-btn-cerrar-modal" title="Cerrar">\u2715</button>
        </div>

        <div class="hitomi-modal-body">
          <p class="hitomi-modal-instruccion">
            ${modoForzado ? `Se re-ejecutar\xE1n descargas. Las marcadas como <strong>[\u26A0\uFE0F Re-descargada]</strong> o <strong>[\u26A0\uFE0F Ya descargada]</strong> volver\xE1n a ser clickeadas (${forzadasCount} en total).<br><small style="color:#8b949e">Usa <strong>Shift + Clic</strong> para seleccionar rangos o la casilla <strong>\u{1F3F7}\uFE0F Tags</strong> para personalizar etiquetas.</small>` : 'Selecciona las pesta\xF1as a las que deseas enviar la orden de descarga:<br><small style="color:#8b949e">Usa <strong>Shift + Clic</strong> para seleccionar rangos o la casilla <strong>\u{1F3F7}\uFE0F Tags</strong> para personalizar etiquetas.</small>'}
          </p>

          ${totalPestanas === 0 ? `<div class="hitomi-modal-vacio">
                   <p>No se encontraron pesta\xF1as ${modoForzado ? "disponibles" : "pendientes"}.</p>
                 </div>` : `
                 <div class="hitomi-bar-master-toggle" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; padding: 8px 12px; background: #161b22; border: 1px solid #21262d; border-radius: 8px; user-select: none;">
                   <label style="display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #f0f6fc; cursor: pointer;">
                     <input type="checkbox" id="hitomi-check-master-pestanas" checked style="width: 16px; height: 16px; accent-color: #238636; cursor: pointer;" />
                     <span id="hitomi-label-master-pestanas">Deseleccionar Todo</span>
                   </label>
                   <span style="font-size: 11px; color: #8b949e;">Usa <strong>Shift + Clic</strong> para seleccionar rangos</span>
                 </div>
                 <div class="hitomi-modal-lista" id="hitomi-modal-lista-items">
                   ${pestanasInfo.map(
        (p) => {
          const tagsSel = ESTADO.tagsSeleccionadosPorPestana.get(p.id) || [];
          const tieneTags = tagsSel.length > 0;
          const autorEditado = ESTADO.autoresEditadosPorPestana.get(p.id);
          let autorMostrar = autorEditado !== void 0 && autorEditado !== null ? autorEditado : p.autor || "";
          if (!autorMostrar || /^n\/?a$/i.test(autorMostrar.trim()) || /^none$/i.test(autorMostrar.trim())) {
            autorMostrar = "Unknown";
          } else {
            autorMostrar = capitalizarNombre(autorMostrar);
          }
          const tituloEditado = ESTADO.titulosEditadosPorPestana.get(p.id);
          const tituloMostrar = tituloEditado !== void 0 && tituloEditado !== null ? tituloEditado : p.titulo;
          return `
                           <div class="hitomi-modal-item ${p.yaProcesada ? "es-forzada" : ""}">
                             <input type="checkbox" class="hitomi-check-pestana" data-id="${p.id}" checked />
                             <div class="hitomi-modal-item-info">
                               <div class="hitomi-modal-inputs-row">
                                 <input type="text" class="hitomi-input-autor-item" data-id="${p.id}" value="${escapeHtml(autorMostrar)}" title="Editar autor (Prefijo \u300C...\u300D)" placeholder="Autor..." />
                                 <input type="text" class="hitomi-input-titulo-item" data-id="${p.id}" value="${escapeHtml(tituloMostrar)}" title="Haz clic para editar el nombre detectado de este archivo" placeholder="T\xEDtulo del archivo..." />
                               </div>
                               <div class="hitomi-modal-item-url">${escapeHtml(p.url)}</div>
                             </div>
                             <button class="hitomi-btn-abrir-tags ${tieneTags ? "tiene-tags" : ""}" data-id="${p.id}" title="Seleccionar etiquetas para concatenar con \u2503">
                               \u{1F3F7}\uFE0F Tags ${tieneTags ? `(${tagsSel.length})` : ""}
                             </button>
                             ${p.yaProcesada ? `<span class="hitomi-item-tag hitomi-tag-forzada">${p.esForzada ? "\u26A0\uFE0F Re-descargada (Forzada)" : "\u26A0\uFE0F Ya descargada (Forzada)"}</span>` : `<span class="hitomi-item-tag hitomi-tag-nueva">Nueva</span>`}
                           </div>
                         `;
        }
      ).join("")}
                 </div>`}
        </div>

        <div class="hitomi-modal-footer">
          <div class="hitomi-modal-acciones-secundarias">
            <button class="hitomi-btn hitomi-btn-secundario" id="hitomi-btn-reescanear" title="Volver a escanear pesta\xF1as abiertas">
              \u{1F504} Re-escanear
            </button>
            <button class="hitomi-btn hitomi-btn-peligro" id="hitomi-btn-limpiar-memoria" title="Borrar historial y olvidar todas las p\xE1ginas procesadas">
              \u{1F5D1}\uFE0F Limpiar Memoria
            </button>
            <label class="hitomi-toggle-cbz" style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: #c9d1d9; cursor: pointer; user-select: none; background: #21262d; padding: 6px 12px; border-radius: 6px; border: 1px solid #30363d; font-weight: 600;" title="Renombrar la extensi\xF3n de todos los archivos descargados a .cbz (archivado de c\xF3mics)">
              <input type="checkbox" id="hitomi-check-usar-cbz" ${usarCbz ? "checked" : ""} style="accent-color: #238636; cursor: pointer; width: 14px; height: 14px;" />
              <span>\u{1F4E6} Renombrar a <strong>.cbz</strong></span>
            </label>
            ${!modoForzado ? `<button class="hitomi-btn hitomi-btn-advertencia" id="hitomi-btn-modo-forzado" title="Forzar descarga en todas las pesta\xF1as">
                     \u26A1 Clic Forzado
                   </button>` : `<button class="hitomi-btn hitomi-btn-secundario" id="hitomi-btn-modo-normal" title="Volver al modo normal">
                     \u2713 Modo Normal
                   </button>`}
          </div>

          <div class="hitomi-modal-acciones-principales">
            <button class="hitomi-btn hitomi-btn-secundario" id="hitomi-btn-cancelar">
              Cancelar
            </button>
            <button class="hitomi-btn ${modoForzado ? "hitomi-btn-forzado-confirmar" : "hitomi-btn-primario"}" id="hitomi-btn-confirmar" ${totalPestanas === 0 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ""}>
              ${modoForzado ? "\u26A1 Iniciar Descarga Forzada" : "\u25B6 Iniciar Descarga"}
            </button>
          </div>
        </div>
      </div>
    `;
      const checkCbz = backdrop.querySelector("#hitomi-check-usar-cbz");
      if (checkCbz) {
        checkCbz.addEventListener("change", () => {
          if (typeof GM_setValue !== "undefined") {
            GM_setValue(CLAVES.usarCbz, checkCbz.checked);
          }
        });
      }
      const checkMaster = backdrop.querySelector("#hitomi-check-master-pestanas");
      const labelMaster = backdrop.querySelector("#hitomi-label-master-pestanas");
      const listaItems = backdrop.querySelector("#hitomi-modal-lista-items");
      function actualizarEstadoMaster() {
        if (!listaItems || !checkMaster || !labelMaster) return;
        const checkboxes = Array.from(listaItems.querySelectorAll(".hitomi-check-pestana"));
        if (checkboxes.length === 0) return;
        const todosMarcados = checkboxes.every((cb) => cb.checked);
        checkMaster.checked = todosMarcados;
        labelMaster.textContent = todosMarcados ? "Deseleccionar Todo" : "Seleccionar Todo";
        const btnConfirmar2 = backdrop.querySelector("#hitomi-btn-confirmar");
        const marcadosCount = checkboxes.filter((cb) => cb.checked).length;
        if (btnConfirmar2) {
          btnConfirmar2.disabled = marcadosCount === 0;
          btnConfirmar2.style.opacity = marcadosCount === 0 ? "0.5" : "1";
          btnConfirmar2.style.cursor = marcadosCount === 0 ? "not-allowed" : "pointer";
        }
      }
      if (checkMaster && listaItems) {
        checkMaster.addEventListener("change", () => {
          const estadoNuevo = checkMaster.checked;
          const checkboxes = listaItems.querySelectorAll(".hitomi-check-pestana");
          checkboxes.forEach((cb) => {
            cb.checked = estadoNuevo;
          });
          labelMaster.textContent = estadoNuevo ? "Deseleccionar Todo" : "Seleccionar Todo";
          const btnConfirmar2 = backdrop.querySelector("#hitomi-btn-confirmar");
          if (btnConfirmar2) {
            btnConfirmar2.disabled = !estadoNuevo;
            btnConfirmar2.style.opacity = estadoNuevo ? "1" : "0.5";
            btnConfirmar2.style.cursor = estadoNuevo ? "pointer" : "not-allowed";
          }
        });
      }
      if (listaItems) {
        vincularSeleccionMultipleCheckboxes(listaItems);
        listaItems.addEventListener("change", (ev) => {
          if (ev.target.classList.contains("hitomi-check-pestana")) {
            actualizarEstadoMaster();
          }
        });
        listaItems.addEventListener("input", (ev) => {
          const inputAutor = ev.target.closest(".hitomi-input-autor-item");
          if (inputAutor) {
            const pId = inputAutor.getAttribute("data-id");
            ESTADO.autoresEditadosPorPestana.set(pId, inputAutor.value);
            return;
          }
          const inputTitulo = ev.target.closest(".hitomi-input-titulo-item");
          if (inputTitulo) {
            const pId = inputTitulo.getAttribute("data-id");
            ESTADO.titulosEditadosPorPestana.set(pId, inputTitulo.value);
            return;
          }
        });
        listaItems.addEventListener("click", (ev) => {
          const btnTags = ev.target.closest(".hitomi-btn-abrir-tags");
          if (!btnTags) return;
          const pId = btnTags.getAttribute("data-id");
          const pInfo = pestanasInfo.find((item) => item.id === pId);
          if (!pInfo) return;
          mostrarModalSeleccionTags(
            pId,
            ESTADO.titulosEditadosPorPestana.get(pId) || pInfo.titulo,
            pInfo.tagsDisponibles || [],
            ESTADO.tagsSeleccionadosPorPestana.get(pId) || [],
            () => renderizarContenidoModal()
          );
        });
      }
      backdrop.querySelector("#hitomi-btn-cerrar-modal").addEventListener("click", cerrarModal);
      backdrop.querySelector("#hitomi-btn-cancelar").addEventListener("click", cerrarModal);
      backdrop.querySelector("#hitomi-btn-reescanear").addEventListener("click", async () => {
        await publicarEstadoPestana();
        renderizarContenidoModal();
      });
      backdrop.querySelector("#hitomi-btn-limpiar-memoria").addEventListener("click", async () => {
        limpiarMemoriaProcesadas();
        resetearEstadoBotonDescarga();
        ESTADO.titulosEditadosPorPestana.clear();
        ESTADO.autoresEditadosPorPestana.clear();
        ESTADO.tagsSeleccionadosPorPestana.clear();
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
          const idsSeleccionados = Array.from(checkboxes).map((cb) => cb.getAttribute("data-id"));
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
  var init_modal = __esm({
    "src/ui/modal.js"() {
      init_constants();
      init_presence();
      init_memory();
      init_badge();
      init_dom();
      init_author();
    }
  });

/* ════════════════════════════════════════════════════════════ */
/*                   MÓDULO: src/ui/pill.js                   */
/* ════════════════════════════════════════════════════════════ */
  function aplicarEstilosPastilla() {
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
  function montarPastilla() {
    if (ESTADO.botonPastilla || !esPaginaHitomi()) return;
    const interfaz = obtenerOCrearAnfitrionUI(CONFIGURACION.ids.anfitrion);
    const pastilla = document.createElement("div");
    pastilla.id = CONFIGURACION.ids.pastilla;
    pastilla.innerHTML = `
    <span class="hitomi-punto"></span>
    <strong>Hitomi DL</strong>
  `;
    pastilla.title = "Click para procesar pesta\xF1as.\nShift + Click limpia memoria.";
    pastilla.addEventListener("click", (evento) => {
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
  var timerMostrarEstado;
  var init_pill = __esm({
    "src/ui/pill.js"() {
      init_constants();
      init_dom();
      init_memory();
      init_badge();
      init_presence();
      init_modal();
      timerMostrarEstado = null;
    }
  });

/* ════════════════════════════════════════════════════════════ */
/*                MÓDULO: src/core/presence.js                */
/* ════════════════════════════════════════════════════════════ */
  async function publicarEstadoPestana() {
    if (!esPaginaHitomi() || publicandoEstado) return;
    publicandoEstado = true;
    try {
      const boton = await buscarBotonDescarga({ intentos: 5, pausa: 100 });
      const memoria = obtenerMemoriaPaginasProcesadas();
      const estadoActual = obtenerEstadoPaginaProcesada(location.href, memoria);
      if (boton && estadoActual.procesada) {
        marcarBotonComoProcesado(boton, estadoActual.esForzada);
      }
      const tieneBoton = boton && elementoVisible(boton) ? 1 : 0;
      if (ESTADO.ultimoEstadoPublicado !== tieneBoton) {
        const autorDetectado = obtenerAutorOEstadoInicial();
        const tituloLimpio = limpiarTituloBase(document.title || location.href, autorDetectado);
        const tagsDisponibles = extraerTagsPagina();
        GM_setValue(CLAVES.presencia(ID_PESTANA), tieneBoton);
        GM_setValue(CLAVES.urlPestana(ID_PESTANA), location.href);
        GM_setValue(CLAVES.tituloPestana(ID_PESTANA), tituloLimpio);
        GM_setValue(CLAVES.autorPestana(ID_PESTANA), autorDetectado);
        GM_setValue(CLAVES.tagsPestana(ID_PESTANA), tagsDisponibles);
        ESTADO.ultimoEstadoPublicado = tieneBoton;
      }
    } catch (e) {
      console.error("Error al publicar estado de pesta\xF1a:", e);
    } finally {
      publicandoEstado = false;
    }
  }
  function eliminarPresenciaPestana() {
    try {
      GM_deleteValue(CLAVES.presencia(ID_PESTANA));
      GM_deleteValue(CLAVES.urlPestana(ID_PESTANA));
      GM_deleteValue(CLAVES.tituloPestana(ID_PESTANA));
      GM_deleteValue(CLAVES.autorPestana(ID_PESTANA));
      GM_deleteValue(CLAVES.tagsPestana(ID_PESTANA));
    } catch {
    }
  }
  function obtenerInformacionPestanas(incluirProcesadas = false) {
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
        const autor = GM_getValue(CLAVES.autorPestana(id), "");
        const tagsDisponibles = GM_getValue(CLAVES.tagsPestana(id), []);
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
      console.error("Error al consultar informaci\xF3n de pesta\xF1as:", e);
      return [];
    }
  }
  async function recorrerPestanasDescarga(pastilla, listaIds = null, opciones = {}) {
    const { forzar = false } = opciones;
    if (ESTADO.bloqueado) return;
    ESTADO.bloqueado = true;
    mostrarEstado(pastilla, forzar ? "Forzando..." : "Procesando...", "correcto");
    try {
      const pesta\u00F1asInfo = obtenerInformacionPestanas(forzar);
      let pesta\u00F1as = listaIds || pesta\u00F1asInfo.map((p) => p.id);
      if (!pesta\u00F1as.length) {
        mostrarEstado(pastilla, "Sin pesta\xF1as", "error");
        return;
      }
      let procesadas = 0;
      const estiloSeparador = GM_getValue(CLAVES.estiloSeparador, "pipe");
      for (const idPestana of pesta\u00F1as) {
        const nonce = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const tagsSeleccionados = ESTADO.tagsSeleccionadosPorPestana.get(idPestana) || [];
        const tituloPersonalizado = ESTADO.titulosEditadosPorPestana.get(idPestana) || null;
        const autorPersonalizado = ESTADO.autoresEditadosPorPestana.get(idPestana) || null;
        let respuesta = null;
        if (idPestana === ID_PESTANA) {
          respuesta = await ejecutarOrdenDescarga(nonce, { forzar, tagsSeleccionados, estiloSeparador, tituloPersonalizado, autorPersonalizado });
        } else {
          const claveRespuesta = CLAVES.respuesta(nonce, idPestana);
          GM_deleteValue(claveRespuesta);
          GM_setValue(CLAVES.orden, {
            pesta\u00F1aDestino: idPestana,
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
            respuesta = GM_getValue(claveRespuesta, null);
            if (respuesta) break;
          }
          GM_deleteValue(claveRespuesta);
        }
        console.info(obtenerHora(), `Pesta\xF1a ${idPestana} (forzar=${forzar}, local=${idPestana === ID_PESTANA}):`, respuesta);
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
  function limpiarRegistrosPestanasAntiguas() {
    try {
      const prefijo = "hitomi_url_";
      const claves = GM_listValues().filter((clave) => clave.startsWith(prefijo));
      for (const clave of claves) {
        const id = clave.replace(prefijo, "");
        const presencia = GM_getValue(CLAVES.presencia(id), null);
        if (presencia === null) {
          GM_deleteValue(clave);
          GM_deleteValue(CLAVES.tituloPestana(id));
          GM_deleteValue(CLAVES.autorPestana(id));
          GM_deleteValue(CLAVES.tagsPestana(id));
        }
      }
    } catch {
    }
  }
  var publicandoEstado;
  var init_presence = __esm({
    "src/core/presence.js"() {
      init_constants();
      init_dom();
      init_memory();
      init_download();
      init_badge();
      init_pill();
      init_author();
      init_tags();
      publicandoEstado = false;
    }
  });

/* ════════════════════════════════════════════════════════════ */
/*                    MÓDULO: src/index.js                    */
/* ════════════════════════════════════════════════════════════ */
  var require_index = __commonJS({
    "src/index.js"() {
      init_constants();
      init_dom();
      init_presence();
      init_download();
      init_modal();
      init_pill();
      var timerObservador = null;
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
              const { pesta\u00F1aDestino, nonce, forzar, tagsSeleccionados, estiloSeparador, tituloPersonalizado, autorPersonalizado } = valorNuevo;
              if (pesta\u00F1aDestino !== ID_PESTANA) {
                return;
              }
              const resultado = await ejecutarOrdenDescarga(nonce, {
                forzar: !!forzar,
                tagsSeleccionados: tagsSeleccionados || [],
                estiloSeparador: estiloSeparador || GM_getValue(CLAVES.estiloSeparador, "pipe"),
                tituloPersonalizado: tituloPersonalizado || null,
                autorPersonalizado: autorPersonalizado || null
              });
              try {
                GM_setValue(CLAVES.respuesta(nonce, ID_PESTANA), resultado);
              } catch (e) {
                console.error("Error al devolver respuesta de orden:", e);
              }
            }
          );
        } catch (e) {
          console.error("Error en escuchador de \xF3rdenes:", e);
        }
      }
      function iniciarScript() {
        if (!esPaginaHitomi()) return;
        aplicarEstilosPastilla();
        aplicarEstilosModal();
        interceptarDescargasNativas();
        limpiarRegistrosPestanasAntiguas();
        montarPastilla();
        publicarEstadoPestana();
        registrarObservadorDOM();
        registrarEscuchadorOrdenesIPC();
        console.info(obtenerHora(), "Hitomi Clicker iniciado con soporte para Tags \u2503 + tags y descarga nativa de autor", {
          pesta\u00F1a: ID_PESTANA,
          pagina: location.href
        });
      }
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciarScript, { once: true });
      } else {
        iniciarScript();
      }
    }
  });
  require_index();
})();
// @license      MIT
