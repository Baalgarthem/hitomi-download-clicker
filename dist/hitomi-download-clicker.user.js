// ==UserScript==
// @name         Hitomi Clicker
// @namespace    https://github.com/Baalgarthem/
// @version      2.9.1
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
        urlIcono: "https://raw.githubusercontent.com/Baalgarthem/hitomi-download-clicker/principal/media/hitomi-logo.png",
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
        selectoresSerie: [
          "#series ul.comma-list li a",
          "#series a",
          "#series li",
          "#series",
          "td#series a[href*='/series/']",
          ".gallery-info td#series a",
          "a[href*='/series/']",
          ".series-list a"
        ],
        selectoresPersonajes: [
          "#characters ul.tags li a",
          "#characters li a",
          "#characters a",
          ".tags li a[href*='/character/']",
          "a[href*='/character/']"
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
        seriePestana: (id) => `hitomi_serie_${id}`,
        personajesPestana: (id) => `hitomi_personajes_${id}`,
        timestampPestana: (id) => `hitomi_timestamp_${id}`,
        pingPresencia: "hitomi_ping_presencia_global",
        estiloSeparador: "hitomi_estilo_separador_tags",
        usarCbz: "hitomi_usar_extension_cbz",
        cerrarPestana: "hitomi_cerrar_pestana_al_descargar",
        modoForzado: "hitomi_modo_forzado",
        rutaDescarga: "hitomi_ruta_descarga_personalizada",
        bloquearBotonNativo: "hitomi_bloquear_boton_nativo",
        incluirSerie: "hitomi_incluir_serie_sufijo"
      };
      ESTADO = {
        bloqueado: false,
        permitirClicForzado: false,
        ordenesEjecutadas: /* @__PURE__ */ new Set(),
        botonPastilla: null,
        ultimoEstadoPublicado: null,
        tagsSeleccionadosPorPestana: /* @__PURE__ */ new Map(),
        personajesSeleccionadosPorPestana: /* @__PURE__ */ new Map(),
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
  function inyectarEstilos(css = "") {
    if (!css || typeof css !== "string") return;
    try {
      if (typeof GM_addStyle !== "undefined") {
        GM_addStyle(css);
      } else {
        const estilo = document.createElement("style");
        estilo.textContent = css;
        (document.head || document.documentElement).appendChild(estilo);
      }
    } catch {
      try {
        const estilo = document.createElement("style");
        estilo.textContent = css;
        (document.head || document.documentElement).appendChild(estilo);
      } catch (e) {
        console.error("Error al inyectar estilos CSS:", e);
      }
    }
  }
  function sanearNombreArchivoFileSystem(nombre = "") {
    if (!nombre || typeof nombre !== "string") return "";
    let saneado = nombre.trim();
    saneado = saneado.replace(/[\/\\]/g, "-");
    saneado = saneado.replace(/:/g, " -");
    saneado = saneado.replace(/[\x00-\x1F\*\?"<>\|]/g, "");
    saneado = saneado.replace(/[\u201C\u201D]/g, "'");
    saneado = saneado.replace(/\s+/g, " ");
    saneado = saneado.replace(/-{2,}/g, "-");
    saneado = saneado.replace(/[\.\s]+$/, "");
    if (saneado.length > 200) {
      saneado = saneado.slice(0, 200).trim();
    }
    return saneado;
  }
  function leerValorGM(clave, valorDefecto = null) {
    try {
      if (typeof GM_getValue !== "undefined") {
        const valor = GM_getValue(clave, valorDefecto);
        if (valor !== void 0 && valor !== null) return valor;
      }
      if (typeof localStorage !== "undefined") {
        const item = localStorage.getItem(clave);
        if (item !== null) {
          try {
            return JSON.parse(item);
          } catch {
            return item;
          }
        }
      }
    } catch {
    }
    return valorDefecto;
  }
  function guardarValorGM(clave, valor) {
    try {
      if (typeof GM_setValue !== "undefined") {
        GM_setValue(clave, valor);
      }
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(clave, typeof valor === "string" ? valor : JSON.stringify(valor));
      }
    } catch (e) {
      console.error(`Error al guardar clave persistente ${clave}:`, e);
    }
  }
  function eliminarValorGM(clave) {
    try {
      if (typeof GM_deleteValue !== "undefined") {
        GM_deleteValue(clave);
      }
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(clave);
      }
    } catch (e) {
      console.error(`Error al eliminar clave persistente ${clave}:`, e);
    }
  }
  function sanearRutaSubcarpeta(ruta = "") {
    if (!ruta || typeof ruta !== "string") return "";
    let saneada = ruta.trim();
    saneada = saneada.replace(/\\/g, "/");
    saneada = saneada.replace(/^[a-zA-Z]:/g, "");
    saneada = saneada.replace(/[\x00-\x1F\*\?"<>\|:]/g, "");
    const partes = saneada.split("/").map((p) => p.trim()).filter((p) => p && p !== "." && p !== "..");
    return partes.join("/");
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
      const datosBrutos = leerValorGM(CLAVES.memoriaPaginas, {});
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
      guardarValorGM(CLAVES.memoriaPaginas, objetoSerializable);
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
      eliminarValorGM(CLAVES.memoriaPaginas);
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
      const badgeBloqueado = boton.querySelector(".hitomi-badge-bloqueado");
      if (badgeBloqueado) badgeBloqueado.remove();
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
        actualizarEstadoVisualBotonNativo(boton);
      }
    } catch (e) {
      console.error("Error al resetear estado del bot\xF3n:", e);
    }
  }
  function actualizarEstadoVisualBotonNativo(boton = null) {
    try {
      const target = boton || obtenerElementoBotonDescarga();
      if (!target) return;
      const estaBloqueadoNativo = leerValorGM(CLAVES.bloquearBotonNativo, false);
      const estaProcesado = target.getAttribute("data-hitomi-procesado") === "true";
      let badgeBloqueado = target.querySelector(".hitomi-badge-bloqueado");
      if (estaBloqueadoNativo && !estaProcesado) {
        target.setAttribute("title", "\u{1F512} Bot\xF3n nativo bloqueado por Hitomi Clicker (descargas gestionadas desde el panel)");
        if (!badgeBloqueado) {
          badgeBloqueado = document.createElement("span");
          badgeBloqueado.className = "hitomi-badge-bloqueado";
          badgeBloqueado.style.cssText = "font-weight: bold; margin-left: 6px; font-size: 0.88em; color: #f87171;";
          badgeBloqueado.textContent = " \u{1F512} Bloqueado";
          target.appendChild(badgeBloqueado);
        }
      } else {
        if (badgeBloqueado) badgeBloqueado.remove();
        if (!estaProcesado) {
          target.removeAttribute("title");
        }
      }
    } catch (e) {
      console.error("Error al actualizar estado visual del bot\xF3n nativo:", e);
    }
  }
  function vincularEventosBotonDescarga(boton) {
    if (!boton) return;
    actualizarEstadoVisualBotonNativo(boton);
    if (boton.dataset.hitomiListenerAttached) return;
    boton.dataset.hitomiListenerAttached = "true";
    boton.addEventListener("click", (evento) => {
      if (ESTADO.permitirClicForzado) {
        return;
      }
      const estaBloqueadoNativo = leerValorGM(CLAVES.bloquearBotonNativo, false);
      if (estaBloqueadoNativo) {
        console.warn(obtenerHora(), "Clic en bot\xF3n nativo evitado: El bot\xF3n de descarga nativo est\xE1 bloqueado por configuraci\xF3n.");
        evento.preventDefault();
        evento.stopImmediatePropagation();
        actualizarEstadoVisualBotonNativo(boton);
        return false;
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
    let titulo = (rawTitle || "").trim();
    if (!titulo || /^(?:hitomi(?:\.la)?|read online at hitomi(?:\.la)?)$/i.test(titulo) || titulo.startsWith("http")) {
      const elH1 = typeof document !== "undefined" ? document.querySelector("h1 a, #gallery-brand a, .gallery-info h1, h1") : null;
      if (elH1 && elH1.textContent) {
        titulo = elH1.textContent.trim();
      }
    }
    if (!titulo && typeof document !== "undefined") {
      titulo = document.title || location.href || "";
    }
    titulo = titulo.replace(/\s*[\|║\-\/┃]\s*Hitomi(?:\.la)?.*$/i, "").trim();
    titulo = titulo.replace(/^Read online at Hitomi(?:\.la)?\s*[\|║\-\/┃]\s*/i, "").trim();
    titulo = titulo.replace(/「[^」]+」/g, "").replace(/【[^】]+】/g, "").trim();
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
  function capitalizarSerie(str = "") {
    if (!str || typeof str !== "string") return "";
    let texto = str.trim();
    texto = texto.replace(/\s*-\s*all$/i, "").trim();
    if (/^(?:n\/?a|none)$/i.test(texto)) return "";
    return texto.replace(/\b[a-zA-ZáéíóúÁÉÍÓÚñÑ]+/g, (word) => {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
  }
  function extraerSeriePagina() {
    try {
      if (typeof document === "undefined") return "";
      for (const selector of CONFIGURACION.selectoresSerie) {
        const el = document.querySelector(selector);
        if (el && el.textContent) {
          const limpia = capitalizarSerie(el.textContent);
          if (limpia) return limpia;
        }
      }
    } catch (e) {
      console.error("Error al extraer serie de la p\xE1gina:", e);
    }
    return "";
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
    const estiloFinal = estiloId || leerValorGM(CLAVES.estiloSeparador, "pipe");
    const configEstilo = ESTILOS_SEPARADOR[estiloFinal] || ESTILOS_SEPARADOR.pipe;
    return `${configEstilo.prefijo}${tagsValidos.join(" ")}${configEstilo.sufijo}`;
  }
  function obtenerNombreFinalCompleto(opciones = {}) {
    const {
      tituloOriginal = "",
      autor = null,
      tagsSeleccionados = [],
      personajesSeleccionados = [],
      estiloSeparador = null,
      serie = null,
      incluirSerie = null
    } = opciones;
    const autorTarget = autor !== null && autor !== void 0 && String(autor).trim() !== "" ? String(autor).trim() : obtenerAutorOEstadoInicial();
    const autorFormateado = formatearNombreAutor(autorTarget);
    const tituloLimpio = limpiarTituloBase(tituloOriginal, autorTarget);
    const seccionTags = formatearCadenaTags(tagsSeleccionados, estiloSeparador);
    const debeIncluirSerie = incluirSerie !== null ? incluirSerie : leerValorGM(CLAVES.incluirSerie, false);
    let seccionSerie = "";
    if (debeIncluirSerie) {
      const serieRaw = serie !== null && serie !== void 0 && String(serie).trim() !== "" ? String(serie).trim() : extraerSeriePagina();
      const serieLimpia = capitalizarSerie(serieRaw);
      if (serieLimpia) {
        seccionSerie = ` \u3010${serieLimpia}\u3011`;
      }
    }
    const seccionPersonajes = formatearCadenaPersonajes(personajesSeleccionados);
    let nombreFinal = `${autorFormateado} ${tituloLimpio}`.trim();
    if (seccionTags) {
      nombreFinal = `${nombreFinal}${seccionTags}`;
    }
    if (seccionSerie) {
      nombreFinal = `${nombreFinal}${seccionSerie}`;
    }
    if (seccionPersonajes) {
      nombreFinal = `${nombreFinal}${seccionPersonajes}`;
    }
    return sanearNombreArchivoFileSystem(nombreFinal);
  }
  function capitalizarPersonaje(str = "") {
    if (!str || typeof str !== "string") return "";
    let texto = str.trim();
    texto = texto.replace(/\s*-\s*all$/i, "").trim();
    texto = texto.replace(/^character:/i, "").trim();
    texto = texto.replace(/[♀♂]/g, "").trim();
    if (/^(?:n\/?a|none)$/i.test(texto)) return "";
    return texto.replace(/\b[a-zA-ZáéíóúÁÉÍÓÚñÑ]+/g, (word) => {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
  }
  function extraerPersonajesPagina() {
    const listaPersonajes = [];
    const procesadosSet = /* @__PURE__ */ new Set();
    try {
      if (typeof document === "undefined") return [];
      for (const selector of CONFIGURACION.selectoresPersonajes) {
        const elementos = document.querySelectorAll(selector);
        if (elementos && elementos.length > 0) {
          elementos.forEach((el) => {
            const raw = (el.textContent || "").trim();
            const clean = capitalizarPersonaje(raw);
            if (clean && !procesadosSet.has(clean)) {
              procesadosSet.add(clean);
              listaPersonajes.push(clean);
            }
          });
          if (listaPersonajes.length > 0) break;
        }
      }
    } catch (e) {
      console.error("Error al extraer personajes de la p\xE1gina:", e);
    }
    return listaPersonajes;
  }
  function formatearCadenaPersonajes(personajesSeleccionados = []) {
    if (!Array.isArray(personajesSeleccionados) || personajesSeleccionados.length === 0) {
      return "";
    }
    const limpios = personajesSeleccionados.map((p) => capitalizarPersonaje(p)).filter(Boolean);
    if (limpios.length === 0) return "";
    return ` \u3010${limpios.join(" ")}\u3011`;
  }
  var init_tags = __esm({
    "src/core/tags.js"() {
      init_constants();
      init_dom();
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
      const personajesSeleccionados = ESTADO.personajesSeleccionadosPorPestana.get(ID_PESTANA) || [];
      const estiloSeparador = leerValorGM(CLAVES.estiloSeparador, "pipe");
      nombreBase = obtenerNombreFinalCompleto({
        tituloOriginal: tituloBase,
        autor,
        tagsSeleccionados,
        personajesSeleccionados,
        estiloSeparador
      });
    }
    if (!nombreBase) return "";
    const usarCbz = leerValorGM(CLAVES.usarCbz, false);
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
  function esElementoBotonDescarga(elemento) {
    if (!elemento || typeof elemento !== "object") return false;
    try {
      const href = elemento.getAttribute && elemento.getAttribute("href") || elemento.href || "";
      const hrefLower = typeof href === "string" ? href.toLowerCase() : "";
      const claseStr = (elemento.className || "").toString().toLowerCase();
      const idStr = (elemento.id || "").toLowerCase();
      if (hrefLower.includes("/reader/") || hrefLower.includes("/galleries/") || hrefLower.includes("/artist/") || hrefLower.includes("/group/") || hrefLower.includes("/tag/") || hrefLower.includes("/series/") || hrefLower.includes("/character/") || hrefLower.includes("/language/") || claseStr.includes("thumbnail") || elemento.closest && elemento.closest(".thumbnail-container, .thumbnail-list, #gallery-images, .gallery-preview")) {
        if (elemento.hasAttribute && elemento.hasAttribute("download")) {
          elemento.removeAttribute("download");
        }
        return false;
      }
      if (ESTADO.permitirClicForzado) {
        return true;
      }
      if (idStr === "dl-button" || claseStr.includes("dl-button") || elemento.hasAttribute && elemento.hasAttribute("data-hitomi-nombre-final")) {
        return true;
      }
      if (claseStr.includes("download") || idStr && idStr.includes("download")) {
        return true;
      }
      if (hrefLower.includes("/download/") || hrefLower.endsWith(".zip") || hrefLower.endsWith(".cbz") || hrefLower.startsWith("blob:")) {
        return true;
      }
      if (elemento.hasAttribute && elemento.hasAttribute("download")) {
        const downloadVal = (elemento.getAttribute("download") || "").toLowerCase();
        if (downloadVal && (downloadVal.endsWith(".zip") || downloadVal.endsWith(".cbz") || downloadVal.includes("."))) {
          return true;
        }
      }
    } catch (e) {
      console.error("Error al evaluar esElementoBotonDescarga:", e);
    }
    return false;
  }
  function limpiarAtributosDescargaInvalidos() {
    try {
      if (typeof document === "undefined") return;
      const enlacesLectura = document.querySelectorAll("a[href*='/reader/'], .thumbnail-container a, .thumbnail-list a");
      enlacesLectura.forEach((a) => {
        if (a.hasAttribute("download")) {
          a.removeAttribute("download");
        }
      });
    } catch {
    }
  }
  function interceptarDescargasNativas() {
    if (interceptorRegistrado) return;
    interceptorRegistrado = true;
    try {
      limpiarAtributosDescargaInvalidos();
      if (typeof document !== "undefined") {
        document.addEventListener("click", (evento) => {
          try {
            limpiarAtributosDescargaInvalidos();
            const target = evento.target ? evento.target.closest("a, button, #dl-button, .download-button, [download]") || evento.target : null;
            if (!target) return;
            if (esElementoBotonDescarga(target)) {
              const estaBloqueadoNativo = leerValorGM(CLAVES.bloquearBotonNativo, false);
              if (estaBloqueadoNativo && !ESTADO.permitirClicForzado) {
                evento.preventDefault();
                evento.stopImmediatePropagation();
                return;
              }
              const ref = target.getAttribute("download") || target.download || target.getAttribute("href") || target.href || "";
              const nombreConExt = generarNombreFinalConExtension(ref);
              if (nombreConExt) {
                const elementosTarget = /* @__PURE__ */ new Set([
                  target,
                  target.closest ? target.closest("a") : null,
                  ...Array.from(target.querySelectorAll ? target.querySelectorAll("a") : [])
                ]);
                elementosTarget.forEach((el) => {
                  if (!el) return;
                  el.setAttribute("download", nombreConExt);
                  if ("download" in el) {
                    el.download = nombreConExt;
                  }
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
            if (esElementoBotonDescarga(this)) {
              const ref = this.getAttribute("download") || this.download || this.getAttribute("href") || this.href || "";
              const nombreConExt = generarNombreFinalConExtension(ref);
              if (nombreConExt) {
                this.setAttribute("download", nombreConExt);
                this.download = nombreConExt;
              }
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
                if (esElementoBotonDescarga(this)) {
                  const nombreConExt = generarNombreFinalConExtension(valor || this.href || "");
                  return originalSet.call(this, nombreConExt || valor);
                }
                return originalSet.call(this, valor);
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
              if (esElementoBotonDescarga(this)) {
                const nombreConExt = generarNombreFinalConExtension(valorAtributo || this.href || "");
                return originalSetAttribute.call(this, nombreAtributo, nombreConExt || valorAtributo, ...restoArgs);
              }
              return originalSetAttribute.call(this, nombreAtributo, valorAtributo, ...restoArgs);
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
                  if (esElementoBotonDescarga(this)) {
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
                        if (esElementoBotonDescarga(a)) {
                          a.setAttribute("download", nombreConExt);
                          a.download = nombreConExt;
                        }
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
  function confirmarYEjecutarClic(boton, esForzado = false, tagsSeleccionados = [], personajesSeleccionados = [], estiloSeparador = null, tituloPersonalizado = null, autorPersonalizado = null) {
    if (!boton) return false;
    let fueClickeadoConExito = false;
    try {
      interceptarDescargasNativas();
      if (Array.isArray(tagsSeleccionados)) {
        ESTADO.tagsSeleccionadosPorPestana.set(ID_PESTANA, tagsSeleccionados);
      }
      if (Array.isArray(personajesSeleccionados)) {
        ESTADO.personajesSeleccionadosPorPestana.set(ID_PESTANA, personajesSeleccionados);
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
      const estiloActivo = estiloSeparador || leerValorGM(CLAVES.estiloSeparador, "pipe");
      const autorTarget = autorPersonalizado && typeof autorPersonalizado === "string" && autorPersonalizado.trim() ? autorPersonalizado.trim() : ESTADO.autoresEditadosPorPestana.get(ID_PESTANA) || obtenerAutorOEstadoInicial();
      const tituloBase = tituloPersonalizado && typeof tituloPersonalizado === "string" && tituloPersonalizado.trim() ? tituloPersonalizado.trim() : ESTADO.titulosEditadosPorPestana.get(ID_PESTANA) || document.title;
      const tagsEfectivos = Array.isArray(tagsSeleccionados) && tagsSeleccionados.length > 0 ? tagsSeleccionados : ESTADO.tagsSeleccionadosPorPestana.get(ID_PESTANA) || [];
      const personajesEfectivos = Array.isArray(personajesSeleccionados) && personajesSeleccionados.length > 0 ? personajesSeleccionados : ESTADO.personajesSeleccionadosPorPestana.get(ID_PESTANA) || [];
      const nombreFinalCompleto = obtenerNombreFinalCompleto({
        tituloOriginal: tituloBase,
        autor: autorTarget,
        tagsSeleccionados: tagsEfectivos,
        personajesSeleccionados: personajesEfectivos,
        estiloSeparador: estiloActivo
      });
      if (nombreFinalCompleto) {
        ESTADO.ultimoNombreFinal = nombreFinalCompleto;
        const nombreLimpioConExt = generarNombreFinalConExtension("");
        try {
          const tituloLimpioSinExt = nombreFinalCompleto.replace(/\.cbz$/i, "").replace(/\.zip$/i, "");
          document.title = tituloLimpioSinExt;
        } catch {
        }
        const elementosTarget = /* @__PURE__ */ new Set([
          boton,
          boton.closest ? boton.closest("a") : null,
          ...Array.from(boton.querySelectorAll ? boton.querySelectorAll("a") : [])
        ]);
        elementosTarget.forEach((el) => {
          if (!el) return;
          el.setAttribute("data-hitomi-nombre-final", nombreLimpioConExt);
          if (tagsEfectivos.length > 0) {
            el.setAttribute("data-hitomi-tags", formatearCadenaTags(tagsEfectivos, estiloActivo));
          }
          el.setAttribute("title", nombreLimpioConExt);
          el.setAttribute("download", nombreLimpioConExt);
          if ("download" in el) el.download = nombreLimpioConExt;
        });
        const rutaCustom = leerValorGM(CLAVES.rutaDescarga, "");
        const rutaLimpia = sanearRutaSubcarpeta(rutaCustom);
        const tieneRutaPersonalizada = !!rutaLimpia;
        if (tieneRutaPersonalizada && typeof GM_download === "function") {
          const nombreConRuta = `${rutaLimpia}/${nombreLimpioConExt}`;
          let hrefRaw = (boton.getAttribute("href") || boton.href || (boton.closest && boton.closest("a") ? boton.closest("a").getAttribute("href") || boton.closest("a").href : "") || "").trim();
          let downloadUrl = "";
          if (hrefRaw) {
            try {
              downloadUrl = new URL(hrefRaw, location.href).href;
            } catch {
              downloadUrl = hrefRaw;
            }
          }
          if (downloadUrl && (downloadUrl.startsWith("http") || downloadUrl.startsWith("blob"))) {
            let ejecucionExitosaGM = false;
            try {
              console.log(obtenerHora(), "Iniciando GM_download hacia subcarpeta:", nombreConRuta);
              GM_download({
                url: downloadUrl,
                name: nombreConRuta,
                saveAs: false,
                onload: () => {
                  console.log(obtenerHora(), "Descarga guardada en subcarpeta:", nombreConRuta);
                },
                onerror: (error) => {
                  console.warn(obtenerHora(), "GM_download fall\xF3, recurriendo a clic nativo:", error);
                  ESTADO.permitirClicForzado = true;
                  if (typeof boton.click === "function") boton.click();
                  ESTADO.permitirClicForzado = false;
                }
              });
              ejecucionExitosaGM = true;
              fueClickeadoConExito = true;
            } catch (errGM) {
              console.warn("Excepci\xF3n al invocar GM_download:", errGM);
              ejecucionExitosaGM = false;
            }
            if (ejecucionExitosaGM) {
              if (esForzado) {
                ESTADO.permitirClicForzado = false;
                if (teniaProcesado) boton.setAttribute("data-hitomi-procesado", teniaProcesado);
                boton.style.pointerEvents = estiloPointerPrevio;
                if ("disabled" in boton) boton.disabled = deshabilitadoPrevio;
              } else {
                ESTADO.permitirClicForzado = false;
              }
              return true;
            }
          }
        }
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
    const { forzar = false, tagsSeleccionados = [], personajesSeleccionados = [], estiloSeparador = null, tituloPersonalizado = null, autorPersonalizado = null } = opciones;
    if (Array.isArray(tagsSeleccionados)) {
      ESTADO.tagsSeleccionadosPorPestana.set(ID_PESTANA, tagsSeleccionados);
    }
    if (Array.isArray(personajesSeleccionados)) {
      ESTADO.personajesSeleccionadosPorPestana.set(ID_PESTANA, personajesSeleccionados);
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
      const clicConfirmado = confirmarYEjecutarClic(boton, forzar, tagsSeleccionados, personajesSeleccionados, estiloSeparador, tituloPersonalizado, autorPersonalizado);
      if (!clicConfirmado) {
        console.warn(obtenerHora(), "Clic no confirmado o bloqueado en el elemento objetivo.");
        return "error_click";
      }
      guardarPaginaProcesada(location.href, forzar);
      marcarBotonComoProcesado(boton, forzar);
      const cerrarPestana = leerValorGM(CLAVES.cerrarPestana, false);
      if (cerrarPestana) {
        setTimeout(() => {
          try {
            console.log(obtenerHora(), "Cerrando pesta\xF1a autom\xE1ticamente tras completar descarga...");
            window.close();
          } catch (e) {
            console.warn("No se pudo cerrar la pesta\xF1a autom\xE1ticamente:", e);
          }
        }, 1800);
      }
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
    inyectarEstilos(`
    .hitomi-modal-backdrop, .hitomi-tag-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(5px);
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
      background: #11151c;
      color: #c9d1d9;
      border: 1px solid #30363d;
      border-radius: 14px;
      width: 100%;
      max-width: 660px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      overflow: hidden;
      pointer-events: auto;
    }

    .hitomi-modal-header {
      padding: 14px 20px;
      border-bottom: 2px solid #b580b5;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: linear-gradient(135deg, #2d3b47 0%, #1c232b 100%);
    }

    .hitomi-modal-titulo {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
      color: #f0f6fc;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .hitomi-modal-badge-modo {
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 999px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .hitomi-modal-badge-modo.normal {
      background: rgba(35, 134, 54, 0.2);
      color: #3fb950;
      border: 1px solid rgba(63, 185, 80, 0.4);
    }

    .hitomi-modal-badge-modo.forzado {
      background: rgba(217, 119, 6, 0.2);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.4);
    }

    .hitomi-modal-cerrar {
      background: transparent;
      border: none;
      color: #8b949e;
      font-size: 18px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
      line-height: 1;
      transition: background 0.15s ease, color 0.15s ease;
    }

    .hitomi-modal-cerrar:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #f0f6fc;
    }

    .hitomi-modal-body {
      padding: 16px 20px;
      overflow-y: auto;
      flex: 1;
      max-height: 52vh;
    }

    .hitomi-modal-instruccion {
      font-size: 12px;
      color: #9ab0c7;
      margin: 0 0 12px 0;
      line-height: 1.45;
    }

    .hitomi-modal-lista {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .hitomi-modal-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      background: #192028;
      border: 1px solid #2d3748;
      border-radius: 8px;
      transition: border-color 0.15s ease, background 0.15s ease;
      user-select: none;
    }

    .hitomi-modal-item:hover {
      border-color: #4a5568;
      background: #202934;
    }

    .hitomi-modal-item.es-forzada {
      border-left: 4px solid #f59e0b;
    }

    .hitomi-modal-item input[type="checkbox"] {
      width: 15px;
      height: 15px;
      accent-color: #ec4899;
      cursor: pointer;
    }

    .hitomi-modal-item-info {
      flex: 1;
      min-width: 0;
    }

    .hitomi-modal-inputs-row {
      display: flex;
      gap: 6px;
      margin-bottom: 2px;
    }

    .hitomi-input-autor-item {
      background: #0f141a;
      color: #3fb950;
      border: 1px solid #2d3748;
      border-radius: 6px;
      padding: 3px 8px;
      font-size: 12px;
      font-weight: 600;
      width: 120px;
      box-sizing: border-box;
      transition: border-color 0.15s ease, background 0.15s ease;
    }

    .hitomi-input-autor-item:focus {
      border-color: #b580b5;
      outline: none;
      background: #161c24;
      box-shadow: 0 0 0 2px rgba(181, 128, 181, 0.25);
    }

    .hitomi-input-titulo-item {
      background: #0f141a;
      color: #f0f6fc;
      border: 1px solid #2d3748;
      border-radius: 6px;
      padding: 3px 8px;
      font-size: 12px;
      font-weight: 600;
      flex: 1;
      min-width: 0;
      box-sizing: border-box;
      transition: border-color 0.15s ease, background 0.15s ease;
    }

    .hitomi-input-titulo-item:focus {
      border-color: #b580b5;
      outline: none;
      background: #161c24;
      box-shadow: 0 0 0 2px rgba(181, 128, 181, 0.25);
    }

    .hitomi-modal-item-url {
      font-size: 11px;
      color: #768390;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .hitomi-item-tag {
      font-size: 10px;
      padding: 2px 7px;
      border-radius: 4px;
      font-weight: 600;
      white-space: nowrap;
    }

    .hitomi-tag-nueva {
      background: rgba(46, 160, 67, 0.15);
      color: #3fb950;
      border: 1px solid rgba(63, 185, 80, 0.3);
    }

    .hitomi-tag-forzada {
      background: rgba(217, 119, 6, 0.18);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }

    /* Estilos del Selector de Tags */
    .hitomi-btn-abrir-tags {
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 6px;
      background: #252e38;
      color: #9ab0c7;
      border: 1px solid #3b4754;
      cursor: pointer;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
    }

    .hitomi-btn-abrir-tags:hover {
      background: #323e4c;
      border-color: #b580b5;
      color: #ffffff;
    }

    .hitomi-btn-abrir-tags.tiene-tags {
      background: rgba(181, 128, 181, 0.15);
      color: #d8b4d8;
      border-color: rgba(181, 128, 181, 0.4);
    }

    .hitomi-estilo-separador-contenedor, .hitomi-custom-tags-contenedor {
      margin-bottom: 12px;
      padding: 10px 12px;
      background: #192028;
      border: 1px solid #2d3748;
      border-radius: 8px;
    }

    .hitomi-input-custom-tag-field {
      background: #0f141a;
      color: #f0f6fc;
      border: 1px solid #2d3748;
      border-radius: 6px;
      padding: 5px 10px;
      font-size: 12px;
      flex: 1;
      min-width: 0;
      box-sizing: border-box;
      transition: border-color 0.15s ease, background 0.15s ease;
    }

    .hitomi-input-custom-tag-field:focus {
      border-color: #b580b5;
      outline: none;
      background: #161c24;
      box-shadow: 0 0 0 2px rgba(181, 128, 181, 0.25);
    }

    .hitomi-selector-estilos {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .hitomi-btn-estilo-tag {
      font-size: 11px;
      padding: 4px 9px;
      border-radius: 6px;
      background: #252e38;
      color: #9ab0c7;
      border: 1px solid #3b4754;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.15s ease;
      user-select: none;
    }

    .hitomi-btn-estilo-tag:hover {
      border-color: #b580b5;
      color: #f0f6fc;
    }

    .hitomi-btn-estilo-tag.activo {
      background: rgba(181, 128, 181, 0.2);
      color: #e2c2e2;
      border-color: #b580b5;
      font-weight: 600;
    }

    .hitomi-grid-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 10px 0;
      max-height: 38vh;
      overflow-y: auto;
    }

    .hitomi-pill-tag {
      font-size: 11px;
      padding: 5px 10px;
      border-radius: 999px;
      background: #252e38;
      color: #9ab0c7;
      border: 1px solid #3b4754;
      cursor: pointer;
      user-select: none;
      font-weight: 500;
      transition: all 0.15s ease;
    }

    .hitomi-pill-tag:hover {
      border-color: #b580b5;
      color: #ffffff;
    }

    .hitomi-pill-tag.activa {
      background: linear-gradient(135deg, #4f6275 0%, #3a4b5c 100%);
      color: #ffffff;
      border-color: #b580b5;
      font-weight: 600;
      box-shadow: 0 0 8px rgba(181, 128, 181, 0.4);
    }

    .hitomi-modal-vacio {
      text-align: center;
      padding: 24px 16px;
      color: #768390;
      font-size: 13px;
    }

    .hitomi-modal-footer {
      padding: 12px 20px;
      border-top: 1px solid #2d3748;
      background: #161c24;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
    }

    .hitomi-modal-acciones-secundarias {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .hitomi-modal-acciones-principales {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .hitomi-btn {
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid transparent;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: background 0.15s ease, border-color 0.15s ease, transform 0.1s ease, opacity 0.15s ease;
      user-select: none;
    }

    .hitomi-btn:hover {
      transform: translateY(-1px);
    }

    .hitomi-btn-secundario {
      background: #252e38;
      color: #c9d1d9;
      border-color: #3b4754;
    }

    .hitomi-btn-secundario:hover {
      background: #323e4c;
      color: #f0f6fc;
      border-color: #4a5568;
    }

    .hitomi-btn-peligro {
      background: rgba(176, 0, 32, 0.18);
      color: #f87171;
      border-color: rgba(239, 68, 68, 0.4);
    }

    .hitomi-btn-peligro:hover {
      background: rgba(176, 0, 32, 0.35);
      color: #fca5a5;
      border-color: rgba(239, 68, 68, 0.6);
    }

    .hitomi-btn-advertencia {
      background: rgba(217, 119, 6, 0.18);
      color: #fbbf24;
      border-color: rgba(245, 158, 11, 0.4);
    }

    .hitomi-btn-advertencia:hover {
      background: rgba(217, 119, 6, 0.35);
      color: #fde047;
      border-color: rgba(245, 158, 11, 0.6);
    }

    .hitomi-btn-primario {
      background: linear-gradient(to bottom, #4f6275, #3a4b5c);
      color: #ffffff;
      border-color: #5d738a;
    }

    .hitomi-btn-primario:hover {
      background: linear-gradient(to bottom, #5a6f84, #44576b);
      border-color: #b580b5;
    }

    .hitomi-btn-forzado-confirmar {
      background: linear-gradient(to bottom, #d97706, #b45309);
      color: #ffffff;
      border-color: #f59e0b;
    }

    .hitomi-btn-forzado-confirmar:hover {
      background: linear-gradient(to bottom, #f59e0b, #d97706);
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
          checkbox.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
      ultimoCheckClickeado = checkbox;
    });
  }
  function mostrarModalSeleccionTags(pestanaId, tituloPestana, tagsDisponibles = [], tagsPreseleccionados = [], callbackGuardar, personajesDisponibles = [], personajesPreseleccionados = []) {
    const interfaz = obtenerOCrearAnfitrionUI(CONFIGURACION.ids.anfitrion);
    const backdropTag = document.createElement("div");
    backdropTag.className = "hitomi-tag-modal-backdrop";
    const tagsSeleccionadosSet = new Set(
      Array.isArray(tagsPreseleccionados) && tagsPreseleccionados.length > 0 ? tagsPreseleccionados : ESTADO.tagsSeleccionadosPorPestana.get(pestanaId) || []
    );
    const personajesSeleccionadosSet = new Set(
      Array.isArray(personajesPreseleccionados) && personajesPreseleccionados.length > 0 ? personajesPreseleccionados : ESTADO.personajesSeleccionadosPorPestana.get(pestanaId) || []
    );
    const todosLosTagsDisponibles = /* @__PURE__ */ new Set();
    (tagsDisponibles || []).forEach((t) => {
      const clean = typeof t === "object" ? t.clean : t;
      if (clean) todosLosTagsDisponibles.add(clean);
    });
    tagsSeleccionadosSet.forEach((t) => {
      if (t) todosLosTagsDisponibles.add(t);
    });
    let estiloActual = leerValorGM(CLAVES.estiloSeparador, "pipe");
    let incluirSerieActual = leerValorGM(CLAVES.incluirSerie, false);
    function generarHtmlPills() {
      const listaOrdenada = Array.from(todosLosTagsDisponibles);
      if (listaOrdenada.length === 0) {
        return `<div class="hitomi-modal-vacio"><p>No hay etiquetas seleccionadas ni disponibles. Ingresa una abajo.</p></div>`;
      }
      return listaOrdenada.map((tagClean) => {
        const estaActivo = tagsSeleccionadosSet.has(tagClean);
        return `<div class="hitomi-pill-tag ${estaActivo ? "activa" : ""}" data-tag="${escapeHtml(tagClean)}" title="Clic para ${estaActivo ? "desmarcar" : "seleccionar"} la etiqueta '${escapeHtml(tagClean)}'">${escapeHtml(tagClean)}</div>`;
      }).join("");
    }
    backdropTag.innerHTML = `
    <div class="hitomi-tag-modal-contenedor">
      <div class="hitomi-modal-header">
        <h3 class="hitomi-modal-titulo">
          <img src="${CONFIGURACION.urlIcono}" class="hitomi-logo-img" style="width:20px;height:20px;border-radius:4px;object-fit:contain;" alt="Hitomi Logo" />
          <span>\u{1F3F7}\uFE0F Seleccionar Tags: ${escapeHtml(tituloPestana)} <span id="hitomi-tag-badge-count" style="font-size: 11px; padding: 2px 8px; border-radius: 999px; background: rgba(236,72,153,0.2); color: #ec4899; border: 1px solid rgba(236,72,153,0.4); margin-left: 6px;" title="Total de etiquetas seleccionadas actualmente">(${tagsSeleccionadosSet.size} seleccionados)</span></span>
        </h3>
        <button class="hitomi-modal-cerrar" id="hitomi-tag-btn-cerrar" title="Cerrar esta ventana">\u2715</button>
      </div>

      <div class="hitomi-modal-body">
        <!-- SECCI\xD3N DE OPCI\xD3N DE SERIE -->
        <div class="hitomi-custom-tags-contenedor" style="margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; user-select: none;">
          <label style="display: inline-flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 600; color: #f0f6fc; cursor: pointer;" title="Incluye el nombre de la serie formateado entre corchetes japoneses \u3010Serie\u3011 como sufijo al final del archivo despu\xE9s de las etiquetas">
            <input type="checkbox" id="hitomi-tag-check-incluir-serie" ${incluirSerieActual ? "checked" : ""} style="width: 15px; height: 15px; accent-color: #ec4899; cursor: pointer;" />
            <span>\u{1F4FA} <strong>Incluir Serie</strong> entre corchetes japoneses \u3010...\u3011</span>
          </label>
        </div>

        <!-- SECCI\xD3N DE PERSONAJES DETECTADOS -->
        <div class="hitomi-custom-tags-contenedor" style="margin-bottom: 12px;">
          <div style="font-size: 12px; font-weight: 600; color: #c9d1d9; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
            <span>\u{1F464} Personajes Detectados:</span>
            ${personajesDisponibles && personajesDisponibles.length > 0 ? `<span id="hitomi-personajes-count-badge" style="font-size: 11px; color: #3fb950; font-weight: 600;">(${personajesSeleccionadosSet.size} de ${personajesDisponibles.length} seleccionados)</span>` : ""}
          </div>
          ${!personajesDisponibles || personajesDisponibles.length === 0 ? `<div style="font-size: 12px; color: #768390; font-style: italic;">No hay personajes por a\xF1adir</div>` : `<div class="hitomi-grid-tags" id="hitomi-contenedor-pills-personajes">
                   ${personajesDisponibles.map((pName) => {
      const estaActivo = personajesSeleccionadosSet.has(pName);
      return `<div class="hitomi-pill-tag ${estaActivo ? "activa" : ""}" data-personaje="${escapeHtml(pName)}" title="Clic para ${estaActivo ? "desmarcar" : "seleccionar"} el personaje '${escapeHtml(pName)}'">${escapeHtml(pName)}</div>`;
    }).join("")}
                 </div>`}
        </div>

        <div class="hitomi-estilo-separador-contenedor">
          <div style="font-size: 12px; font-weight: 600; color: #c9d1d9; margin-bottom: 8px;">
            \u{1F4D0} Estilo del Separador de Tags:
          </div>
          <div class="hitomi-selector-estilos" id="hitomi-selector-estilos-tags">
            <button class="hitomi-btn-estilo-tag ${estiloActual === "pipe" ? "activo" : ""}" data-estilo="pipe" title="Formato Pipe: Concatenar con ' \u2503 tag1 tag2'">
              \u2503 Pipe ( \u2503 tags)
            </button>
            <button class="hitomi-btn-estilo-tag ${estiloActual === "angle" ? "activo" : ""}" data-estilo="angle" title="Formato Angular: Envolver entre ' \u27E8tag1 tag2\u27E9'">
              \u27E8\u27E9 Angular ( \u27E8tags\u27E9)
            </button>
            <button class="hitomi-btn-estilo-tag ${estiloActual === "square" ? "activo" : ""}" data-estilo="square" title="Formato Corchete: Envolver entre ' [tag1 tag2]'">
              [] Corchete ( [tags])
            </button>
            <button class="hitomi-btn-estilo-tag ${estiloActual === "paren" ? "activo" : ""}" data-estilo="paren" title="Formato Par\xE9ntesis: Envolver entre ' (tag1 tag2)'">
              () Par\xE9ntesis ( (tags))
            </button>
          </div>
        </div>

        <div class="hitomi-custom-tags-contenedor">
          <div style="font-size: 12px; font-weight: 600; color: #c9d1d9; margin-bottom: 6px;">
            \u270D\uFE0F Ingresar Tags Personalizados Manualmente (separados por ESPACIOS):
          </div>
          <div style="display: flex; gap: 8px;">
            <input type="text" id="hitomi-input-custom-tag" placeholder="Escribe tags separados por ESPACIOS (ej. schoolgirl blonde)..." class="hitomi-input-custom-tag-field" title="\u26A0\uFE0F Importante: Separa cada etiqueta \xDANICAMENTE con ESPACIOS (ej. schoolgirl blonde female). No se permiten comas ni caracteres especiales." />
            <button type="button" id="hitomi-btn-add-custom-tag" class="hitomi-btn hitomi-btn-secundario" style="white-space: nowrap;" title="A\xF1adir la etiqueta o etiquetas ingresadas a la lista de selecci\xF3n">\u2795 A\xF1adir Tag</button>
          </div>
          <div id="hitomi-custom-tag-warning" style="display: none; font-size: 11px; color: #f87171; margin-top: 6px; font-weight: 600; align-items: center; gap: 4px;">
            \u26A0\uFE0F Car\xE1cter no permitido bloqueado. Usa \xFAnicamente ESPACIOS para separar etiquetas (ej. schoolgirl blonde).
          </div>
        </div>

        <p class="hitomi-modal-instruccion" id="hitomi-tag-instruccion-contador">
          Selecciona las etiquetas que deseas incluir en el nombre final del archivo (<strong style="color:#ec4899;" id="hitomi-count-sel">${tagsSeleccionadosSet.size}</strong> de <strong style="color:#9ab0c7;" id="hitomi-count-total">${todosLosTagsDisponibles.size}</strong> seleccionadas):
        </p>

        <div class="hitomi-grid-tags" id="hitomi-contenedor-pills">
          ${generarHtmlPills()}
        </div>
      </div>

      <div class="hitomi-modal-footer">
        <div class="hitomi-modal-acciones-secundarias">
          <button class="hitomi-btn hitomi-btn-secundario" id="hitomi-tag-btn-todos" title="Marcar todas las etiquetas disponibles">Seleccionar Todos</button>
          <button class="hitomi-btn hitomi-btn-secundario" id="hitomi-tag-btn-ninguno" title="Desmarcar todas las etiquetas seleccionadas">Limpiar Selecci\xF3n</button>
        </div>
        <div class="hitomi-modal-acciones-principales">
          <button class="hitomi-btn hitomi-btn-secundario" id="hitomi-tag-btn-cancelar" title="Descartar cambios y cerrar ventana">Cancelar</button>
          <button class="hitomi-btn hitomi-btn-primario" id="hitomi-tag-btn-guardar" title="Guardar etiquetas seleccionadas para este archivo">Guardar Tags</button>
        </div>
      </div>
    </div>
  `;
    interfaz.appendChild(backdropTag);
    const inputCustom = backdropTag.querySelector("#hitomi-input-custom-tag");
    const btnAddCustom = backdropTag.querySelector("#hitomi-btn-add-custom-tag");
    const warningCustom = backdropTag.querySelector("#hitomi-custom-tag-warning");
    const contenedorPills = backdropTag.querySelector("#hitomi-contenedor-pills");
    const contenedorPersonajes = backdropTag.querySelector("#hitomi-contenedor-pills-personajes");
    const checkIncluirSerieTag = backdropTag.querySelector("#hitomi-tag-check-incluir-serie");
    if (checkIncluirSerieTag) {
      checkIncluirSerieTag.addEventListener("change", () => {
        guardarValorGM(CLAVES.incluirSerie, checkIncluirSerieTag.checked);
      });
    }
    if (contenedorPersonajes) {
      contenedorPersonajes.addEventListener("click", (ev) => {
        const pill = ev.target.closest(".hitomi-pill-tag");
        if (!pill) return;
        const pName = pill.getAttribute("data-personaje");
        if (personajesSeleccionadosSet.has(pName)) {
          personajesSeleccionadosSet.delete(pName);
          pill.classList.remove("activa");
        } else {
          personajesSeleccionadosSet.add(pName);
          pill.classList.add("activa");
        }
        const countBadge = backdropTag.querySelector("#hitomi-personajes-count-badge");
        if (countBadge) {
          countBadge.textContent = `(${personajesSeleccionadosSet.size} de ${personajesDisponibles.length} seleccionados)`;
        }
      });
    }
    let timerWarningTag = null;
    function validarYLimpiarEntradaCustomTag() {
      if (!inputCustom) return;
      const valOriginal = inputCustom.value;
      const valLimpio = valOriginal.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_\-\s]/g, "");
      if (valOriginal !== valLimpio) {
        inputCustom.value = valLimpio;
        if (warningCustom) {
          warningCustom.style.display = "flex";
          if (timerWarningTag) clearTimeout(timerWarningTag);
          timerWarningTag = setTimeout(() => {
            warningCustom.style.display = "none";
          }, 3500);
        }
        inputCustom.style.borderColor = "#f87171";
        inputCustom.style.boxShadow = "0 0 0 2px rgba(248, 113, 113, 0.3)";
        setTimeout(() => {
          if (inputCustom) {
            inputCustom.style.borderColor = "";
            inputCustom.style.boxShadow = "";
          }
        }, 1500);
      }
    }
    function actualizarContadoresTags() {
      const badgeCount = backdropTag.querySelector("#hitomi-tag-badge-count");
      if (badgeCount) {
        badgeCount.textContent = `(${tagsSeleccionadosSet.size} seleccionados)`;
      }
      const countSel = backdropTag.querySelector("#hitomi-count-sel");
      if (countSel) {
        countSel.textContent = tagsSeleccionadosSet.size;
      }
      const countTotal = backdropTag.querySelector("#hitomi-count-total");
      if (countTotal) {
        countTotal.textContent = todosLosTagsDisponibles.size;
      }
    }
    function actualizarGridPills() {
      if (contenedorPills) {
        contenedorPills.innerHTML = generarHtmlPills();
      }
      actualizarContadoresTags();
    }
    function agregarTagPersonalizado() {
      if (!inputCustom) return;
      validarYLimpiarEntradaCustomTag();
      const valorBruto = inputCustom.value || "";
      if (!valorBruto.trim()) return;
      const tagsNuevos = valorBruto.split(/\s+/).map((t) => limpiarNombreTag(t)).filter(Boolean);
      if (tagsNuevos.length === 0) return;
      tagsNuevos.forEach((tagClean) => {
        tagsSeleccionadosSet.add(tagClean);
        todosLosTagsDisponibles.add(tagClean);
      });
      inputCustom.value = "";
      if (warningCustom) warningCustom.style.display = "none";
      actualizarGridPills();
    }
    if (btnAddCustom) {
      btnAddCustom.addEventListener("click", agregarTagPersonalizado);
    }
    if (inputCustom) {
      inputCustom.addEventListener("input", validarYLimpiarEntradaCustomTag);
      inputCustom.addEventListener("paste", () => setTimeout(validarYLimpiarEntradaCustomTag, 10));
      inputCustom.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") {
          ev.preventDefault();
          agregarTagPersonalizado();
        }
      });
    }
    const selectorEstilos = backdropTag.querySelector("#hitomi-selector-estilos-tags");
    if (selectorEstilos) {
      selectorEstilos.addEventListener("click", (ev) => {
        const btnEstilo = ev.target.closest(".hitomi-btn-estilo-tag");
        if (!btnEstilo) return;
        const nuevoEstilo = btnEstilo.getAttribute("data-estilo");
        guardarValorGM(CLAVES.estiloSeparador, nuevoEstilo);
        selectorEstilos.querySelectorAll(".hitomi-btn-estilo-tag").forEach((b) => b.classList.remove("activo"));
        btnEstilo.classList.add("activo");
      });
    }
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
        actualizarContadoresTags();
      });
    }
    const btnTodos = backdropTag.querySelector("#hitomi-tag-btn-todos");
    if (btnTodos) {
      btnTodos.addEventListener("click", () => {
        todosLosTagsDisponibles.forEach((tagNombre) => {
          tagsSeleccionadosSet.add(tagNombre);
        });
        actualizarGridPills();
      });
    }
    const btnNinguno = backdropTag.querySelector("#hitomi-tag-btn-ninguno");
    if (btnNinguno) {
      btnNinguno.addEventListener("click", () => {
        tagsSeleccionadosSet.clear();
        actualizarGridPills();
      });
    }
    const cerrar = () => backdropTag.remove();
    backdropTag.querySelector("#hitomi-tag-btn-cerrar").addEventListener("click", cerrar);
    backdropTag.querySelector("#hitomi-tag-btn-cancelar").addEventListener("click", cerrar);
    backdropTag.querySelector("#hitomi-tag-btn-guardar").addEventListener("click", () => {
      const listaFinalTags = Array.from(tagsSeleccionadosSet);
      const listaFinalPersonajes = Array.from(personajesSeleccionadosSet);
      ESTADO.tagsSeleccionadosPorPestana.set(pestanaId, listaFinalTags);
      ESTADO.personajesSeleccionadosPorPestana.set(pestanaId, listaFinalPersonajes);
      cerrar();
      if (typeof callbackGuardar === "function") callbackGuardar(listaFinalTags, listaFinalPersonajes);
    });
  }
  function mostrarModalRutaDescarga(callbackGuardar) {
    const interfaz = obtenerOCrearAnfitrionUI(CONFIGURACION.ids.anfitrion);
    const backdropRuta = document.createElement("div");
    backdropRuta.className = "hitomi-tag-modal-backdrop";
    const rutaActualBruta = leerValorGM(CLAVES.rutaDescarga, "");
    const rutaActualSaneada = sanearRutaSubcarpeta(rutaActualBruta);
    backdropRuta.innerHTML = `
    <div class="hitomi-tag-modal-contenedor" style="max-width: 520px;">
      <div class="hitomi-modal-header">
        <h3 class="hitomi-modal-titulo">
          <img src="${CONFIGURACION.urlIcono}" class="hitomi-logo-img" style="width:20px;height:20px;border-radius:4px;object-fit:contain;" alt="Hitomi Logo" />
          <span>\u{1F4C2} Ruta Personalizada de Descargas</span>
        </h3>
        <button class="hitomi-modal-cerrar" id="hitomi-ruta-btn-cerrar" title="Cerrar esta ventana">\u2715</button>
      </div>

      <div class="hitomi-modal-body">
        <div style="margin-bottom: 14px; padding: 10px 12px; background: #192028; border: 1px solid #2d3748; border-radius: 8px;">
          <div style="font-size: 11px; font-weight: 700; color: #b580b5; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
            \u{1F4CD} Estado de la Ruta Actual:
          </div>
          <div id="hitomi-ruta-estado-label" style="font-size: 13px; font-weight: 600; color: ${rutaActualSaneada ? "#3fb950" : "#9ab0c7"}; display: flex; align-items: center; gap: 6px;">
            ${rutaActualSaneada ? `<span>\u{1F4C1} Subcarpeta: <strong>${escapeHtml(rutaActualSaneada)}/</strong></span>` : `<span>\u{1F4E5} Predeterminada (Carpeta Descargas de tu navegador)</span>`}
          </div>
        </div>

        <div class="hitomi-custom-tags-contenedor" style="margin-bottom: 12px;">
          <label for="hitomi-input-ruta-custom" style="display: block; font-size: 12px; font-weight: 600; color: #c9d1d9; margin-bottom: 6px;">
            \u270D\uFE0F Subcarpeta de Descargas (relativa a la carpeta Descargas):
          </label>
          <div style="display: flex; gap: 8px; align-items: center;">
            <input type="text" id="hitomi-input-ruta-custom" value="${escapeHtml(rutaActualSaneada)}" placeholder="Ej. Hitomi/Comics..." class="hitomi-input-custom-tag-field" title="Ingresa el nombre de la subcarpeta (ej. Comics o Hitomi/Doujins). Dejar en blanco para usar la carpeta por defecto." />
          </div>
        </div>

        <p class="hitomi-modal-instruccion" style="margin-bottom: 0;">
          \u{1F4A1} <strong>Nota del Navegador:</strong> Por razones de seguridad de Chromium y Firefox, los archivos se guardan dentro de tu carpeta principal de Descargas. Especificar <code>Hitomi/Comics</code> guardar\xE1 los archivos en <code>Descargas/Hitomi/Comics/</code>. Si no especificas nada o la reseteas, se guardar\xE1 en tu carpeta por defecto.
        </p>
      </div>

      <div class="hitomi-modal-footer">
        <div class="hitomi-modal-acciones-secundarias">
          <button class="hitomi-btn hitomi-btn-advertencia" id="hitomi-ruta-btn-reset" title="Restaurar la ruta al estado por defecto (carpeta Descargas predeterminada)">
            \u{1F504} Resetear a Predeterminado
          </button>
        </div>
        <div class="hitomi-modal-acciones-principales">
          <button class="hitomi-btn hitomi-btn-secundario" id="hitomi-ruta-btn-cancelar" title="Cancelar sin guardar cambios">Cancelar</button>
          <button class="hitomi-btn hitomi-btn-primario" id="hitomi-ruta-btn-guardar" title="Guardar esta ruta de descarga">Guardar Ruta</button>
        </div>
      </div>
    </div>
  `;
    interfaz.appendChild(backdropRuta);
    const inputRuta = backdropRuta.querySelector("#hitomi-input-ruta-custom");
    const cerrar = () => backdropRuta.remove();
    backdropRuta.querySelector("#hitomi-ruta-btn-cerrar").addEventListener("click", cerrar);
    backdropRuta.querySelector("#hitomi-ruta-btn-cancelar").addEventListener("click", cerrar);
    backdropRuta.querySelector("#hitomi-ruta-btn-reset").addEventListener("click", () => {
      eliminarValorGM(CLAVES.rutaDescarga);
      if (inputRuta) inputRuta.value = "";
      cerrar();
      if (typeof callbackGuardar === "function") callbackGuardar("");
    });
    if (inputRuta) {
      inputRuta.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") {
          ev.preventDefault();
          backdropRuta.querySelector("#hitomi-ruta-btn-guardar").click();
        }
      });
    }
    backdropRuta.querySelector("#hitomi-ruta-btn-guardar").addEventListener("click", () => {
      const valorIngresado = inputRuta ? inputRuta.value : "";
      const rutaFinal = sanearRutaSubcarpeta(valorIngresado);
      if (rutaFinal) {
        guardarValorGM(CLAVES.rutaDescarga, rutaFinal);
      } else {
        eliminarValorGM(CLAVES.rutaDescarga);
      }
      cerrar();
      if (typeof callbackGuardar === "function") callbackGuardar(rutaFinal);
    });
  }
  function mostrarPopupConfirmacion(pastilla, modoForzadoInicial = null) {
    let modoForzado = modoForzadoInicial !== null ? modoForzadoInicial : leerValorGM(CLAVES.modoForzado, false);
    const interfaz = obtenerOCrearAnfitrionUI(CONFIGURACION.ids.anfitrion);
    const modalExistente = document.getElementById(CONFIGURACION.ids.modalBackdrop);
    if (modalExistente) modalExistente.remove();
    const backdrop = document.createElement("div");
    backdrop.id = CONFIGURACION.ids.modalBackdrop;
    backdrop.className = "hitomi-modal-backdrop";
    const pestanasMarcadasSet = /* @__PURE__ */ new Set();
    let pestanasInicializadas = false;
    function renderizarContenidoModal() {
      const pestanasInfo = obtenerInformacionPestanas(modoForzado);
      const totalPestanas = pestanasInfo.length;
      const forzadasCount = pestanasInfo.filter((p) => p.yaProcesada).length;
      const usarCbz = leerValorGM(CLAVES.usarCbz, false);
      const cerrarPestana = leerValorGM(CLAVES.cerrarPestana, false);
      const bloquearBotonNativo = leerValorGM(CLAVES.bloquearBotonNativo, false);
      const rutaCustom = leerValorGM(CLAVES.rutaDescarga, "");
      const rutaSaneada = sanearRutaSubcarpeta(rutaCustom);
      const rutaFormateada = rutaSaneada ? escapeHtml(rutaSaneada) : "Predeterminada";
      if (!pestanasInicializadas) {
        pestanasInfo.forEach((p) => pestanasMarcadasSet.add(p.id));
        pestanasInicializadas = true;
      }
      const marcadosInicialCount = pestanasInfo.filter((p) => pestanasMarcadasSet.has(p.id)).length;
      const todosMarcadosInicial = totalPestanas > 0 && marcadosInicialCount === totalPestanas;
      backdrop.innerHTML = `
      <div class="hitomi-modal-contenedor">
        <div class="hitomi-modal-header">
          <h3 class="hitomi-modal-titulo">
            <img src="${CONFIGURACION.urlIcono}" class="hitomi-logo-img" style="width:20px;height:20px;border-radius:4px;object-fit:contain;" alt="Hitomi Logo" />
            <span>\u{1F4CB} Pesta\xF1as Detectadas (${totalPestanas})</span>
            <span class="hitomi-modal-badge-modo ${modoForzado ? "forzado" : "normal"}" title="${modoForzado ? "Modo Forzado: Permite volver a descargar c\xF3mics que ya hab\xEDas procesado previamente" : "Modo Normal: Omite c\xF3mics ya procesados y solo descarga c\xF3mics nuevos"}">
              ${modoForzado ? "\u26A1 Modo Forzado" : "\u2713 Modo Normal"}
            </span>
          </h3>
          <button class="hitomi-modal-cerrar" id="hitomi-btn-cerrar-modal" title="Cerrar esta ventana">\u2715</button>
        </div>

        <div class="hitomi-modal-body">
          <p class="hitomi-modal-instruccion">
            ${modoForzado ? `\u26A1 <strong>Modo Forzado Activo:</strong> Se volver\xE1n a descargar los c\xF3mics seleccionados aunque ya hayan sido procesados (${forzadasCount} ya descargados).<br><small style="color:#768390">Usa <strong>Shift + Clic</strong> para seleccionar rangos o <strong>\u{1F3F7}\uFE0F Tags</strong> para personalizar etiquetas.</small>` : 'Selecciona los c\xF3mics que deseas descargar en lote desde tus pesta\xF1as abiertas:<br><small style="color:#768390">Usa <strong>Shift + Clic</strong> para seleccionar rangos o <strong>\u{1F3F7}\uFE0F Tags</strong> para personalizar etiquetas.</small>'}
          </p>

          ${totalPestanas === 0 ? `<div class="hitomi-modal-vacio">
                   <p>No se encontraron pesta\xF1as de Hitomi ${modoForzado ? "disponibles" : "pendientes"}.</p>
                 </div>` : `
                 <!-- SECCI\xD3N DE OPCIONES Y CONFIGURACI\xD3N (CHECKBOXES Y RUTAS) -->
                 <div class="hitomi-seccion-opciones" style="margin-bottom: 12px; padding: 10px 14px; background: #192028; border: 1px solid #2d3748; border-radius: 10px;">
                   <div style="font-size: 11px; font-weight: 700; color: #b580b5; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                     \u2699\uFE0F OPCIONES DE DESCARGA
                   </div>
                   <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; user-select: none;">
                     <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                       <label style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: #f0f6fc; cursor: pointer;" title="Marcar o desmarcar todos los c\xF3mics de la lista de una sola vez">
                         <input type="checkbox" id="hitomi-check-master-pestanas" ${todosMarcadosInicial ? "checked" : ""} style="width: 15px; height: 15px; accent-color: #ec4899; cursor: pointer;" title="Marcar o desmarcar todo" />
                         <span id="hitomi-label-master-pestanas">${todosMarcadosInicial ? "Deseleccionar Todo" : "Seleccionar Todo"}</span>
                       </label>

                       <label style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: #c9d1d9; cursor: pointer;" title="Guardar los archivos descargados formateados con la extensi\xF3n de c\xF3mic .cbz">
                         <input type="checkbox" id="hitomi-check-usar-cbz" ${usarCbz ? "checked" : ""} style="accent-color: #ec4899; cursor: pointer; width: 15px; height: 15px;" title="Activar/desactivar guardado con extensi\xF3n .cbz" />
                         <span>\u{1F4E6} Formato <strong>.cbz</strong></span>
                       </label>

                       <label style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: #c9d1d9; cursor: pointer;" title="Cierra autom\xE1ticamente cada pesta\xF1a del navegador despu\xE9s de iniciar su descarga">
                         <input type="checkbox" id="hitomi-check-cerrar-pestana" ${cerrarPestana ? "checked" : ""} style="accent-color: #ec4899; cursor: pointer; width: 15px; height: 15px;" title="Activar/desactivar cierre autom\xE1tico de pesta\xF1as descargadas" />
                         <span>\u{1F6AA} <strong>Cerrar pesta\xF1as</strong></span>
                       </label>

                       <label style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: #c9d1d9; cursor: pointer;" title="Bloquea los clics directos sobre el bot\xF3n de descarga nativo (#dl-button) de Hitomi.la para prevenir descargas accidentales">
                         <input type="checkbox" id="hitomi-check-bloquear-boton-nativo" ${bloquearBotonNativo ? "checked" : ""} style="accent-color: #ec4899; cursor: pointer; width: 15px; height: 15px;" title="Activar/desactivar bloqueo de bot\xF3n de descarga nativo de la p\xE1gina" />
                         <span>\u{1F6E1}\uFE0F <strong>Bloquear bot\xF3n nativo</strong></span>
                       </label>
                     </div>

                     <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                       <button class="hitomi-btn hitomi-btn-secundario" id="hitomi-btn-abrir-ruta" title="Configurar o cambiar la subcarpeta personalizada donde se guardar\xE1n tus descargas (ej. Hitomi/Comics)">
                         \u{1F4C2} Ruta: <strong>${rutaFormateada}</strong>
                       </button>

                       ${!modoForzado ? `<button class="hitomi-btn hitomi-btn-advertencia" id="hitomi-btn-modo-forzado" title="Permitir volver a descargar c\xF3mics que ya hab\xEDas guardado anteriormente">
                                \u26A1 Activar Modo Forzado
                              </button>` : `<button class="hitomi-btn hitomi-btn-secundario" id="hitomi-btn-modo-normal" title="Desactivar modo forzado y descargar \xFAnicamente los c\xF3mics que est\xE9n pendientes">
                                \u2713 Volver a Modo Normal
                              </button>`}
                     </div>
                   </div>
                 </div>


                 <!-- SECCI\xD3N DE C\xD3MICS DETECTADOS -->
                 <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                   <span style="font-size: 11px; font-weight: 700; color: #9ab0c7; text-transform: uppercase; letter-spacing: 0.5px;">
                     \u{1F4DA} C\xF3mics Detectados (${totalPestanas})
                   </span>
                   <span style="font-size: 11px; color: #768390;" title="Mant\xE9n presionado Shift al hacer clic en las casillas para marcar/desmarcar un rango entero">\u{1F4A1} Tip: Usa <strong>Shift + Clic</strong> para rangos</span>
                 </div>

                 <div class="hitomi-modal-lista" id="hitomi-modal-lista-items">
                   ${pestanasInfo.map(
        (p) => {
          const estaMarcada = pestanasMarcadasSet.has(p.id);
          const tagsSel = ESTADO.tagsSeleccionadosPorPestana.get(p.id) || [];
          const personajesSel = ESTADO.personajesSeleccionadosPorPestana.get(p.id) || [];
          const totalSelCount = tagsSel.length + personajesSel.length;
          const tieneTags = totalSelCount > 0;
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
                              <input type="checkbox" class="hitomi-check-pestana" data-id="${p.id}" ${estaMarcada ? "checked" : ""} style="accent-color: #ec4899;" title="Marcar/desmarcar este c\xF3mic para la descarga" />
                              <div class="hitomi-modal-item-info">
                                <div class="hitomi-modal-inputs-row">
                                  <input type="text" class="hitomi-input-autor-item" data-id="${p.id}" value="${escapeHtml(autorMostrar)}" title="Editar autor o grupo (se antepondr\xE1 entre corchetes \u300C...\u300D al inicio)" placeholder="Autor..." />
                                  <input type="text" class="hitomi-input-titulo-item" data-id="${p.id}" value="${escapeHtml(tituloMostrar)}" title="Editar el nombre de archivo con el que se guardar\xE1 este c\xF3mic en tu computadora" placeholder="T\xEDtulo del archivo..." />
                                </div>
                                <div class="hitomi-modal-item-url" title="${escapeHtml(p.url)}">${escapeHtml(p.url)}</div>
                              </div>
                              <button class="hitomi-btn-abrir-tags ${tieneTags ? "tiene-tags" : ""}" data-id="${p.id}" title="Abrir el panel para elegir qu\xE9 etiquetas y personajes concatenar al nombre de este c\xF3mic">
                                \u{1F3F7}\uFE0F Tags ${tieneTags ? `(${totalSelCount})` : ""}
                              </button>
                              ${p.yaProcesada ? `<span class="hitomi-item-tag hitomi-tag-forzada" title="Indica si este c\xF3mic es nuevo o si ya se hab\xEDa descargado antes">${p.esForzada ? "\u26A0\uFE0F Re-descargada" : "\u26A0\uFE0F Ya descargada"}</span>` : `<span class="hitomi-item-tag hitomi-tag-nueva" title="C\xF3mic nuevo pendiente de descarga">Nueva</span>`}
                            </div>
                          `;
        }
      ).join("")}
                  </div>`}
        </div>

        <!-- PIE DE MODAL / SECCI\xD3N DE ACCIONES (BOTONES DE EJECUCI\xD3N) -->
        <div class="hitomi-modal-footer">
          <div class="hitomi-modal-acciones-secundarias">
            <button class="hitomi-btn hitomi-btn-secundario" id="hitomi-btn-reescanear" title="Volver a buscar las pesta\xF1as de Hitomi abiertas en el navegador y actualizar la lista">
              \u{1F504} Escanear Pesta\xF1as
            </button>
            <button class="hitomi-btn hitomi-btn-peligro" id="hitomi-btn-limpiar-memoria" title="Borrar el registro de descargas realizadas para volver a empezar desde cero">
              \u{1F5D1}\uFE0F Limpiar Memoria
            </button>
          </div>

          <div class="hitomi-modal-acciones-principales">
            <button class="hitomi-btn hitomi-btn-secundario" id="hitomi-btn-cancelar" title="Cerrar este panel sin realizar ninguna descarga">
              Cancelar
            </button>
            <button class="hitomi-btn ${modoForzado ? "hitomi-btn-forzado-confirmar" : "hitomi-btn-primario"}" id="hitomi-btn-confirmar" ${marcadosInicialCount === 0 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ""} title="Enviar la orden de descarga a todos los c\xF3mics marcados con la casilla rosada">
              ${modoForzado ? `\u26A1 Re-descargar Forzado (${marcadosInicialCount})` : `\u25B6 Iniciar Descarga (${marcadosInicialCount})`}
            </button>
          </div>
        </div>
      </div>
    `;
      const checkCbz = backdrop.querySelector("#hitomi-check-usar-cbz");
      if (checkCbz) {
        checkCbz.addEventListener("change", () => {
          guardarValorGM(CLAVES.usarCbz, checkCbz.checked);
        });
      }
      const checkCerrarPestana = backdrop.querySelector("#hitomi-check-cerrar-pestana");
      if (checkCerrarPestana) {
        checkCerrarPestana.addEventListener("change", () => {
          guardarValorGM(CLAVES.cerrarPestana, checkCerrarPestana.checked);
        });
      }
      const checkBloquearBotonNativo = backdrop.querySelector("#hitomi-check-bloquear-boton-nativo");
      if (checkBloquearBotonNativo) {
        checkBloquearBotonNativo.addEventListener("change", () => {
          guardarValorGM(CLAVES.bloquearBotonNativo, checkBloquearBotonNativo.checked);
          actualizarEstadoVisualBotonNativo();
        });
      }
      const checkMaster = backdrop.querySelector("#hitomi-check-master-pestanas");
      const labelMaster = backdrop.querySelector("#hitomi-label-master-pestanas");
      const listaItems = backdrop.querySelector("#hitomi-modal-lista-items");
      function sincronizarEstadoCheckboxes() {
        if (!listaItems) return;
        const checkboxes = Array.from(listaItems.querySelectorAll(".hitomi-check-pestana"));
        if (checkboxes.length === 0) return;
        checkboxes.forEach((cb) => {
          const id = cb.getAttribute("data-id");
          if (cb.checked) {
            pestanasMarcadasSet.add(id);
          } else {
            pestanasMarcadasSet.delete(id);
          }
        });
        const marcadosCount = checkboxes.filter((cb) => cb.checked).length;
        const todosMarcados = marcadosCount === checkboxes.length;
        if (checkMaster && labelMaster) {
          checkMaster.checked = todosMarcados;
          labelMaster.textContent = todosMarcados ? "Deseleccionar Todo" : "Seleccionar Todo";
        }
        const btnConfirmar2 = backdrop.querySelector("#hitomi-btn-confirmar");
        if (btnConfirmar2) {
          btnConfirmar2.disabled = marcadosCount === 0;
          btnConfirmar2.style.opacity = marcadosCount === 0 ? "0.5" : "1";
          btnConfirmar2.style.cursor = marcadosCount === 0 ? "not-allowed" : "pointer";
          btnConfirmar2.textContent = modoForzado ? `\u26A1 Re-descargar Forzado (${marcadosCount})` : `\u25B6 Iniciar Descarga (${marcadosCount})`;
        }
      }
      if (checkMaster && listaItems) {
        checkMaster.addEventListener("change", () => {
          const estadoNuevo = checkMaster.checked;
          const checkboxes = listaItems.querySelectorAll(".hitomi-check-pestana");
          checkboxes.forEach((cb) => {
            cb.checked = estadoNuevo;
            const id = cb.getAttribute("data-id");
            if (estadoNuevo) pestanasMarcadasSet.add(id);
            else pestanasMarcadasSet.delete(id);
          });
          sincronizarEstadoCheckboxes();
        });
      }
      if (listaItems) {
        vincularSeleccionMultipleCheckboxes(listaItems);
        listaItems.addEventListener("change", (ev) => {
          if (ev.target.classList.contains("hitomi-check-pestana")) {
            sincronizarEstadoCheckboxes();
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
          sincronizarEstadoCheckboxes();
          mostrarModalSeleccionTags(
            pId,
            ESTADO.titulosEditadosPorPestana.get(pId) || pInfo.titulo,
            pInfo.tagsDisponibles || [],
            ESTADO.tagsSeleccionadosPorPestana.get(pId) || [],
            () => renderizarContenidoModal(),
            pInfo.personajesDisponibles || [],
            ESTADO.personajesSeleccionadosPorPestana.get(pId) || []
          );
        });
      }
      backdrop.querySelector("#hitomi-btn-cerrar-modal").addEventListener("click", cerrarModal);
      backdrop.querySelector("#hitomi-btn-cancelar").addEventListener("click", cerrarModal);
      backdrop.querySelector("#hitomi-btn-reescanear").addEventListener("click", async () => {
        const btnReescanear = backdrop.querySelector("#hitomi-btn-reescanear");
        if (btnReescanear) {
          btnReescanear.disabled = true;
          btnReescanear.style.opacity = "0.7";
          btnReescanear.innerHTML = "\u{1F504} Escaneando...";
        }
        await solicitarSincronizacionGlobalPestanas(modoForzado);
        renderizarContenidoModal();
      });
      backdrop.querySelector("#hitomi-btn-limpiar-memoria").addEventListener("click", async () => {
        limpiarMemoriaProcesadas();
        resetearEstadoBotonDescarga();
        ESTADO.titulosEditadosPorPestana.clear();
        ESTADO.autoresEditadosPorPestana.clear();
        ESTADO.tagsSeleccionadosPorPestana.clear();
        ESTADO.personajesSeleccionadosPorPestana.clear();
        pestanasMarcadasSet.clear();
        await solicitarSincronizacionGlobalPestanas(modoForzado);
        renderizarContenidoModal();
      });
      const btnAbrirRuta = backdrop.querySelector("#hitomi-btn-abrir-ruta");
      if (btnAbrirRuta) {
        btnAbrirRuta.addEventListener("click", () => {
          sincronizarEstadoCheckboxes();
          mostrarModalRutaDescarga(() => {
            renderizarContenidoModal();
          });
        });
      }
      const btnForzado = backdrop.querySelector("#hitomi-btn-modo-forzado");
      if (btnForzado) {
        btnForzado.addEventListener("click", () => {
          modoForzado = true;
          guardarValorGM(CLAVES.modoForzado, true);
          sincronizarEstadoCheckboxes();
          renderizarContenidoModal();
        });
      }
      const btnNormal = backdrop.querySelector("#hitomi-btn-modo-normal");
      if (btnNormal) {
        btnNormal.addEventListener("click", () => {
          modoForzado = false;
          guardarValorGM(CLAVES.modoForzado, false);
          sincronizarEstadoCheckboxes();
          renderizarContenidoModal();
        });
      }
      const btnConfirmar = backdrop.querySelector("#hitomi-btn-confirmar");
      if (btnConfirmar && totalPestanas > 0) {
        btnConfirmar.addEventListener("click", () => {
          sincronizarEstadoCheckboxes();
          const idsSeleccionados = Array.from(pestanasMarcadasSet);
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
    solicitarSincronizacionGlobalPestanas(modoForzado).then(() => {
      if (document.getElementById(CONFIGURACION.ids.modalBackdrop)) {
        renderizarContenidoModal();
      }
    }).catch(() => {
    });
  }
  var init_modal = __esm({
    "src/ui/modal.js"() {
      init_constants();
      init_presence();
      init_memory();
      init_badge();
      init_dom();
      init_author();
      init_tags();
    }
  });

/* ════════════════════════════════════════════════════════════ */
/*                   MÓDULO: src/ui/pill.js                   */
/* ════════════════════════════════════════════════════════════ */
  function aplicarEstilosPastilla() {
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
  function mostrarEstado(elemento, mensaje, tipo) {
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
  function montarPastilla() {
    if (ESTADO.botonPastilla || !esPaginaHitomi()) return;
    const interfaz = obtenerOCrearAnfitrionUI(CONFIGURACION.ids.anfitrion);
    const pastilla = document.createElement("div");
    pastilla.id = CONFIGURACION.ids.pastilla;
    pastilla.innerHTML = `
    <img src="${CONFIGURACION.urlIcono}" class="hitomi-logo-img" alt="Hitomi Logo" />
    <span class="hitomi-punto"></span>
    <strong>Hitomi DL</strong>
  `;
    pastilla.title = "\u26A1 Hitomi Download Manager\n- Clic normal: Abrir panel de descargas de pesta\xF1as abiertas\n- Shift + Clic: Limpiar memoria de p\xE1ginas procesadas";
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
  async function publicarEstadoPestana(forzar = false) {
    if (!esPaginaHitomi() || publicandoEstado) return;
    publicandoEstado = true;
    try {
      const boton = await buscarBotonDescarga({ intentos: 3, pausa: 80 });
      const memoria = obtenerMemoriaPaginasProcesadas();
      const estadoActual = obtenerEstadoPaginaProcesada(location.href, memoria);
      if (boton && estadoActual.procesada) {
        marcarBotonComoProcesado(boton, estadoActual.esForzada);
      }
      const tieneBoton = boton && elementoVisible(boton) ? 1 : 0;
      const autorDetectado = obtenerAutorOEstadoInicial();
      const tituloLimpio = limpiarTituloBase(document.title || location.href, autorDetectado);
      const tagsDisponibles = extraerTagsPagina();
      const serieDetectada = extraerSeriePagina();
      const personajesDetectados = extraerPersonajesPagina();
      const ahora = Date.now();
      guardarValorGM(CLAVES.presencia(ID_PESTANA), tieneBoton);
      guardarValorGM(CLAVES.urlPestana(ID_PESTANA), location.href);
      guardarValorGM(CLAVES.tituloPestana(ID_PESTANA), tituloLimpio);
      guardarValorGM(CLAVES.autorPestana(ID_PESTANA), autorDetectado);
      guardarValorGM(CLAVES.tagsPestana(ID_PESTANA), tagsDisponibles);
      guardarValorGM(CLAVES.seriePestana(ID_PESTANA), serieDetectada);
      guardarValorGM(CLAVES.personajesPestana(ID_PESTANA), personajesDetectados);
      guardarValorGM(CLAVES.timestampPestana(ID_PESTANA), ahora);
      ESTADO.ultimoEstadoPublicado = tieneBoton;
    } catch (e) {
      console.error("Error al publicar estado de pesta\xF1a:", e);
    } finally {
      publicandoEstado = false;
    }
  }
  function eliminarPresenciaPestana() {
    try {
      eliminarValorGM(CLAVES.presencia(ID_PESTANA));
      eliminarValorGM(CLAVES.urlPestana(ID_PESTANA));
      eliminarValorGM(CLAVES.tituloPestana(ID_PESTANA));
      eliminarValorGM(CLAVES.autorPestana(ID_PESTANA));
      eliminarValorGM(CLAVES.tagsPestana(ID_PESTANA));
      eliminarValorGM(CLAVES.seriePestana(ID_PESTANA));
      eliminarValorGM(CLAVES.personajesPestana(ID_PESTANA));
      eliminarValorGM(CLAVES.timestampPestana(ID_PESTANA));
    } catch {
    }
  }
  function obtenerInformacionPestanas(incluirProcesadas = false) {
    try {
      const prefijo = "hitomi_presencia_";
      const memoria = obtenerMemoriaPaginasProcesadas();
      const todasLasClaves = typeof GM_listValues !== "undefined" ? GM_listValues() : Object.keys(localStorage);
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
        const personajesDisponibles = leerValorGM(CLAVES.personajesPestana(id), []);
        if (!estado.procesada || incluirProcesadas) {
          resultado.push({
            id,
            url,
            titulo,
            autor,
            tagsDisponibles,
            serie,
            personajesDisponibles,
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
      const estiloSeparador = leerValorGM(CLAVES.estiloSeparador, "pipe");
      for (const idPestana of pesta\u00F1as) {
        const nonce = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const tagsSeleccionados = ESTADO.tagsSeleccionadosPorPestana.get(idPestana) || [];
        const personajesSeleccionados = ESTADO.personajesSeleccionadosPorPestana.get(idPestana) || [];
        const tituloPersonalizado = ESTADO.titulosEditadosPorPestana.get(idPestana) || null;
        const autorPersonalizado = ESTADO.autoresEditadosPorPestana.get(idPestana) || null;
        let respuesta = null;
        if (idPestana === ID_PESTANA) {
          respuesta = await ejecutarOrdenDescarga(nonce, { forzar, tagsSeleccionados, personajesSeleccionados, estiloSeparador, tituloPersonalizado, autorPersonalizado });
        } else {
          const claveRespuesta = CLAVES.respuesta(nonce, idPestana);
          eliminarValorGM(claveRespuesta);
          guardarValorGM(CLAVES.orden, {
            pesta\u00F1aDestino: idPestana,
            nonce,
            forzar,
            tagsSeleccionados,
            personajesSeleccionados,
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
        console.info(obtenerHora(), `Pesta\xF1a ${idPestana} (forzar=${forzar}, local=${idPestana === ID_PESTANA}):`, respuesta);
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
  function limpiarRegistrosPestanasAntiguas() {
    try {
      const prefijoUrl = "hitomi_url_";
      const todasLasClaves = typeof GM_listValues !== "undefined" ? GM_listValues() : Object.keys(localStorage);
      const clavesUrl = todasLasClaves.filter((clave) => clave.startsWith(prefijoUrl));
      const ahora = Date.now();
      const UMBRAL_EXPIRACION_MS = 6e4;
      for (const clave of clavesUrl) {
        const id = clave.replace(prefijoUrl, "");
        const presencia = leerValorGM(CLAVES.presencia(id), null);
        const timestamp = Number(leerValorGM(CLAVES.timestampPestana(id), 0));
        const caducado = id !== ID_PESTANA && timestamp > 0 && ahora - timestamp > UMBRAL_EXPIRACION_MS;
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
      console.error("Error al limpiar registros de pesta\xF1as antiguas:", e);
    }
  }
  async function solicitarSincronizacionGlobalPestanas(modoForzado = false) {
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
    await publicarEstadoPestana(true);
    await esperar(180);
    limpiarRegistrosPestanasAntiguas();
    return obtenerInformacionPestanas(modoForzado);
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
          if (typeof GM_addValueChangeListener !== "undefined") {
            GM_addValueChangeListener(
              CLAVES.orden,
              async (_clave, _valorAnterior, valorNuevo, cambioRemoto) => {
                if (!cambioRemoto || !valorNuevo || typeof valorNuevo !== "object") {
                  return;
                }
                const { pesta\u00F1aDestino, nonce, forzar, tagsSeleccionados, personajesSeleccionados, estiloSeparador, tituloPersonalizado, autorPersonalizado } = valorNuevo;
                if (pesta\u00F1aDestino !== ID_PESTANA) {
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
                  if (valorNuevo && typeof valorNuevo === "object" && valorNuevo.pesta\u00F1aDestino === ID_PESTANA) {
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
                } catch {
                }
              } else if (e.key === CLAVES.pingPresencia && e.newValue) {
                try {
                  const valorNuevo = JSON.parse(e.newValue);
                  if (valorNuevo && typeof valorNuevo === "object" && valorNuevo.solicitante !== ID_PESTANA) {
                    await publicarEstadoPestana(true);
                  }
                } catch {
                }
              }
            });
          }
        } catch (e) {
          console.error("Error en escuchador de \xF3rdenes:", e);
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
