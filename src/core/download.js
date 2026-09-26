// ─────────────────────────────────────────────
// Detección Multinivel y Ejecución del Botón de Descarga
// ─────────────────────────────────────────────

import { CONFIGURACION, ESTADO, CLAVES, ID_PESTANA } from '../config/constants.js';
import { elementoVisible, esperar, obtenerHora, leerValorGM } from '../utils/dom.js';


import { obtenerEstadoPaginaProcesada, guardarPaginaProcesada } from './memory.js';
import { vincularEventosBotonDescarga, marcarBotonComoProcesado } from '../ui/badge.js';
import { extraerNombreAutor, obtenerAutorOEstadoInicial } from './author.js';
import { obtenerNombreFinalCompleto, formatearCadenaTags } from './tags.js';

export function obtenerElementoBotonDescarga() {
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

      if (
        id.includes("dl-button") ||
        id.includes("download") ||
        clase.includes("download") ||
        texto.includes("download") ||
        texto.includes("descargar") ||
        title.includes("download") ||
        ariaLabel.includes("download")
      ) {
        return el;
      }
    }
  } catch (e) {
    console.error("Error al buscar elemento de botón de descarga:", e);
  }
  return null;
}

export async function buscarBotonDescarga(opciones = {}) {
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
      console.error("Error en búsqueda de botón:", e);
    }
    await esperar(pausa);
  }
  return null;
}

/**
 * Genera y resuelve el nombre de archivo final completo con su extensión (.cbz o la original del enlace).
 * Retorna SIEMPRE un nombre de archivo limpio sin barras de ruta ni prefijos de subcarpeta.
 * Garantía de seguridad: el resultado pasa por un guard final que elimina cualquier separador de ruta.
 * @param {string} referenciaUrl - URL de referencia para inferir la extensión del archivo.
 * @returns {string} Nombre de archivo seguro, listo para inyectar en a.download o title.
 */
export function generarNombreFinalConExtension(referenciaUrl = "") {
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
  // Strip de extensiones previas para evitar doble .cbz.cbz o .zip.cbz
  const baseLimpia = nombreBase.replace(/\.(zip|cbz)$/i, "");

  let resultado;
  if (usarCbz) {
    resultado = `${baseLimpia}.cbz`;
  } else {
    // Inferir extensión desde la URL de referencia; si no aplica, usar .zip por defecto
    const matchExt = (referenciaUrl || "").match(/\.([a-z0-9]{2,4})(?:[\?#]|$)/i);
    let extension = matchExt ? `.${matchExt[1]}` : ".zip";
    // Si la URL referencia un .cbz pero el usuario no activó la opción, usar .zip
    if (extension.toLowerCase() === ".cbz" && !usarCbz) {
      extension = ".zip";
    }
    resultado = `${baseLimpia}${extension}`;
  }

  // ─── GUARDIA DE SEGURIDAD FINAL ───────────────────────────────────────────
  // El nombre de archivo retornado JAMÁS debe contener separadores de ruta.
  // Esta línea es el último eslabón de defensa contra filtraciones de rutas.
  return resultado.replace(/[/\\]/g, "-");
}


/**
 * Determina estrictamente si un elemento DOM es el botón de descarga objetivo o un enlace explícito de descarga.
 * Excluye explícitamente enlaces de navegación, lectores (/reader/), galerías o miniaturas (thumbnails).
 * @param {Element} elemento - Elemento DOM a evaluar.
 * @returns {boolean} True si es un botón o enlace de descarga real.
 */
export function esElementoBotonDescarga(elemento) {
  if (!elemento || typeof elemento !== "object") return false;

  try {
    const href = (elemento.getAttribute && elemento.getAttribute("href")) || elemento.href || "";
    const hrefLower = typeof href === "string" ? href.toLowerCase() : "";
    const claseStr = (elemento.className || "").toString().toLowerCase();
    const idStr = (elemento.id || "").toLowerCase();

    // 1. Descartar explícitamente cualquier enlace de lector, miniaturas o navegación general
    if (
      hrefLower.includes("/reader/") ||
      hrefLower.includes("/galleries/") ||
      hrefLower.includes("/artist/") ||
      hrefLower.includes("/group/") ||
      hrefLower.includes("/tag/") ||
      hrefLower.includes("/series/") ||
      hrefLower.includes("/character/") ||
      hrefLower.includes("/language/") ||
      claseStr.includes("thumbnail") ||
      (elemento.closest && elemento.closest(".thumbnail-container, .thumbnail-list, #gallery-images, .gallery-preview"))
    ) {
      if (elemento.hasAttribute && elemento.hasAttribute("download")) {
        elemento.removeAttribute("download");
      }
      return false;
    }

    // 2. Si se está ejecutando nuestra orden programática de descarga
    if (ESTADO.permitirClicForzado) {
      return true;
    }

    // 3. Es el botón principal `#dl-button` o posee nuestro atributo procesado
    if (idStr === "dl-button" || claseStr.includes("dl-button") || (elemento.hasAttribute && elemento.hasAttribute("data-hitomi-nombre-final"))) {
      return true;
    }

    // 4. Es una etiqueta o botón con clase/id específica de descarga
    if (claseStr.includes("download") || (idStr && idStr.includes("download"))) {
      return true;
    }

    // 5. Apunta explícitamente a un archivo o endpoint de descarga (.zip, .cbz, /download/, blob:)
    if (hrefLower.includes("/download/") || hrefLower.endsWith(".zip") || hrefLower.endsWith(".cbz") || hrefLower.startsWith("blob:")) {
      return true;
    }

    // 6. Si ya tiene atributo download Y su valor o destino indica un archivo descargable
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

/**
 * Limpia proactivamente cualquier atributo download asignado erróneamente a enlaces de lectura o miniaturas.
 */
export function limpiarAtributosDescargaInvalidos() {
  try {
    if (typeof document === "undefined") return;
    const enlacesLectura = document.querySelectorAll("a[href*='/reader/'], .thumbnail-container a, .thumbnail-list a");
    enlacesLectura.forEach(a => {
      if (a.hasAttribute("download")) {
        a.removeAttribute("download");
      }
    });
  } catch { }
}

let interceptorRegistrado = false;

/**
 * Intercepta de forma global y multinivel todas las descargas del sitio mediante:
 * 1. Escuchador global de clics en la fase de captura (capturing phase click listener).
 * 2. Sobrescritura del método HTMLAnchorElement.prototype.click.
 * 3. Intercepción de asignaciones a la propiedad HTMLAnchorElement.prototype.download.
 * 4. Intercepción del método HTMLAnchorElement.prototype.setAttribute para 'download'.
 * 5. Intercepción de asignaciones a la propiedad HTMLAnchorElement.prototype.href.
 * 6. Intercepción de URL.createObjectURL para asociar nombres personalizados a Object URLs.
 * 7. Intercepción de la API global window.fetch para solicitudes dinámicas de descarga.
 * 8. Intercepción de XMLHttpRequest.prototype.open para solicitudes XHR de descarga.
 */
export function interceptarDescargasNativas() {
  if (interceptorRegistrado) return;
  interceptorRegistrado = true;

  try {
    limpiarAtributosDescargaInvalidos();

    // 1. Escuchador global de clics en fase de captura (capturing phase)
    if (typeof document !== "undefined") {
      document.addEventListener("click", evento => {
        try {
          limpiarAtributosDescargaInvalidos();

          const target = evento.target ? (evento.target.closest("a, button, #dl-button, .download-button, [download]") || evento.target) : null;
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
              const elementosTarget = new Set([
                target,
                target.closest ? target.closest("a") : null,
                ...Array.from(target.querySelectorAll ? target.querySelectorAll("a") : [])
              ]);

              elementosTarget.forEach(el => {
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
      // 2. Prototype .click override
      const originalClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function (...args) {
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

      // 3. Property descriptor setter override for .download
      try {
        const descriptor = Object.getOwnPropertyDescriptor(HTMLAnchorElement.prototype, "download");
        if (descriptor && descriptor.set) {
          const originalSet = descriptor.set;
          Object.defineProperty(HTMLAnchorElement.prototype, "download", {
            set: function (valor) {
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
      } catch { }

      // 4. setAttribute override for 'download'
      try {
        const originalSetAttribute = HTMLAnchorElement.prototype.setAttribute;
        HTMLAnchorElement.prototype.setAttribute = function (nombreAtributo, valorAtributo, ...restoArgs) {
          if (typeof nombreAtributo === "string" && nombreAtributo.toLowerCase() === "download") {
            if (esElementoBotonDescarga(this)) {
              const nombreConExt = generarNombreFinalConExtension(valorAtributo || this.href || "");
              return originalSetAttribute.call(this, nombreAtributo, nombreConExt || valorAtributo, ...restoArgs);
            }
            // No es botón de descarga nuestro: dejar pasar el setAttribute original sin modificar
            return originalSetAttribute.call(this, nombreAtributo, valorAtributo, ...restoArgs);
          }
          return originalSetAttribute.call(this, nombreAtributo, valorAtributo, ...restoArgs);
        };
      } catch { }

      // 5. Interceptor .href: eliminado intencionalmente.
      // El setter de .href era demasiado agresivo: disparaba en cualquier asignación href
      // (incluyendo navegación normal) e intentaba calcular filenames antes de que
      // ESTADO.ultimoNombreFinal estuviera disponible, causando efectos secundarios imprevisibles.
    }

    // 6. Intercepción de URL.createObjectURL
    if (typeof window !== "undefined" && window.URL && typeof window.URL.createObjectURL === "function") {
      try {
        const originalCreateObjectURL = window.URL.createObjectURL;
        window.URL.createObjectURL = function (object) {
          const url = originalCreateObjectURL.call(this, object);
          try {
            if (url && typeof url === "string") {
              const nombreConExt = generarNombreFinalConExtension(url);
              if (nombreConExt && typeof document !== "undefined") {
                setTimeout(() => {
                  try {
                    const enlacesConBlob = document.querySelectorAll(`a[href="${url}"]`);
                    enlacesConBlob.forEach(a => {
                      if (esElementoBotonDescarga(a)) {
                        a.setAttribute("download", nombreConExt);
                        a.download = nombreConExt;
                      }
                    });
                  } catch { }
                }, 0);
              }
            }
          } catch { }
          return url;
        };
      } catch { }
    }


    // 7. Intercepción de Fetch API — solo observación, sin modificar el flujo
    if (typeof window !== "undefined" && typeof window.fetch === "function") {
      try {
        const originalFetch = window.fetch;
        window.fetch = async function (input, init) {
          return originalFetch.apply(this, arguments);
        };
      } catch { }
    }

    // 8. Intercepción de XMLHttpRequest — solo observación, sin modificar el flujo
    if (typeof XMLHttpRequest !== "undefined" && XMLHttpRequest.prototype && typeof XMLHttpRequest.prototype.open === "function") {
      try {
        const originalXhrOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function (method, url, ...resto) {
          return originalXhrOpen.call(this, method, url, ...resto);
        };
      } catch { }
    }
  } catch (e) {
    console.error("Error al registrar interceptor multinivel de descargas:", e);
  }
}

export function confirmarYEjecutarClic(boton, esForzado = false, tagsSeleccionados = [], personajesSeleccionados = [], estiloSeparador = null, tituloPersonalizado = null, autorPersonalizado = null) {
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

    const autorTarget = (autorPersonalizado && typeof autorPersonalizado === "string" && autorPersonalizado.trim())
      ? autorPersonalizado.trim()
      : (ESTADO.autoresEditadosPorPestana.get(ID_PESTANA) || obtenerAutorOEstadoInicial());
    const tituloBase = (tituloPersonalizado && typeof tituloPersonalizado === "string" && tituloPersonalizado.trim())
      ? tituloPersonalizado.trim()
      : (ESTADO.titulosEditadosPorPestana.get(ID_PESTANA) || document.title);
    const tagsEfectivos = (Array.isArray(tagsSeleccionados) && tagsSeleccionados.length > 0)
      ? tagsSeleccionados
      : (ESTADO.tagsSeleccionadosPorPestana.get(ID_PESTANA) || []);
    const personajesEfectivos = (Array.isArray(personajesSeleccionados) && personajesSeleccionados.length > 0)
      ? personajesSeleccionados
      : (ESTADO.personajesSeleccionadosPorPestana.get(ID_PESTANA) || []);

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

      // Ajustar document.title SOLO con el nombre sin extensiones para evitar carpetas internas .cbz/.zip anidadas
      try {
        const tituloLimpioSinExt = nombreFinalCompleto.replace(/\.cbz$/i, "").replace(/\.zip$/i, "");
        document.title = tituloLimpioSinExt;
      } catch { }

      // Asignar el nombre limpio (sin barras de subcarpeta) a todos los atributos HTML download
      const elementosTarget = new Set([
        boton,
        boton.closest ? boton.closest("a") : null,
        ...Array.from(boton.querySelectorAll ? boton.querySelectorAll("a") : [])
      ]);

      elementosTarget.forEach(el => {
        if (!el) return;
        el.setAttribute("data-hitomi-nombre-final", nombreLimpioConExt);
        if (tagsEfectivos.length > 0) {
          el.setAttribute("data-hitomi-tags", formatearCadenaTags(tagsEfectivos, estiloActivo));
        }
        el.setAttribute("title", nombreLimpioConExt);
        el.setAttribute("download", nombreLimpioConExt);
        if ("download" in el) el.download = nombreLimpioConExt;
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
      try { boton.focus(); } catch { }
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

export async function ejecutarOrdenDescarga(identificadorOrden, opciones = {}) {
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

    // Verificar si el usuario activó la opción de cerrar pestaña automáticamente al descargar
    const cerrarPestana = leerValorGM(CLAVES.cerrarPestana, false);
    if (cerrarPestana) {

      setTimeout(() => {
        try {
          console.log(obtenerHora(), "Cerrando pestaña automáticamente tras completar descarga...");
          window.close();
        } catch (e) {
          console.warn("No se pudo cerrar la pestaña automáticamente:", e);
        }
      }, 1800);
    }

    await esperar(400);
    return "correcto";
  } catch (error) {
    ESTADO.permitirClicForzado = false;
    console.error("Error al ejecutar orden de descarga en esta pestaña:", error);
    return "error";
  }
}
