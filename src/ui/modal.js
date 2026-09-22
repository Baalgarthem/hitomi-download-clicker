// ─────────────────────────────────────────────
// Interfaz Visual: Modal de Confirmación y Selección de Tags
// ─────────────────────────────────────────────

import { CONFIGURACION, ESTADO, CLAVES } from '../config/constants.js';
import { obtenerInformacionPestanas, publicarEstadoPestana, recorrerPestanasDescarga } from '../core/presence.js';
import { limpiarMemoriaProcesadas } from '../core/memory.js';
import { resetearEstadoBotonDescarga } from './badge.js';
import { obtenerOCrearAnfitrionUI, escapeHtml, inyectarEstilos, leerValorGM, guardarValorGM } from '../utils/dom.js';
import { capitalizarNombre } from '../core/author.js';
import { limpiarNombreTag } from '../core/tags.js';

export function aplicarEstilosModal() {
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

export function vincularSeleccionMultipleCheckboxes(listaContenedor) {
  let ultimoCheckClickeado = null;

  listaContenedor.addEventListener("click", evento => {
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

/**
 * Muestra el sub-modal de selección personalizada de tags para un comic específico.
 */
export function mostrarModalSeleccionTags(pestanaId, tituloPestana, tagsDisponibles = [], tagsPreseleccionados = [], callbackGuardar) {
  const interfaz = obtenerOCrearAnfitrionUI(CONFIGURACION.ids.anfitrion);
  const backdropTag = document.createElement("div");
  backdropTag.className = "hitomi-tag-modal-backdrop";

  const tagsSeleccionadosSet = new Set(
    Array.isArray(tagsPreseleccionados) && tagsPreseleccionados.length > 0
      ? tagsPreseleccionados
      : (ESTADO.tagsSeleccionadosPorPestana.get(pestanaId) || [])
  );

  const todosLosTagsDisponibles = new Set();
  (tagsDisponibles || []).forEach(t => {
    const clean = typeof t === "object" ? t.clean : t;
    if (clean) todosLosTagsDisponibles.add(clean);
  });
  tagsSeleccionadosSet.forEach(t => {
    if (t) todosLosTagsDisponibles.add(t);
  });

  let estiloActual = leerValorGM(CLAVES.estiloSeparador, "pipe");


  function generarHtmlPills() {
    const listaOrdenada = Array.from(todosLosTagsDisponibles);
    if (listaOrdenada.length === 0) {
      return `<div class="hitomi-modal-vacio"><p>No hay etiquetas seleccionadas ni disponibles. Ingresa una abajo.</p></div>`;
    }

    return listaOrdenada
      .map(tagClean => {
        const estaActivo = tagsSeleccionadosSet.has(tagClean);
        return `<div class="hitomi-pill-tag ${estaActivo ? 'activa' : ''}" data-tag="${escapeHtml(tagClean)}" title="Clic para ${estaActivo ? 'desmarcar' : 'seleccionar'} la etiqueta '${escapeHtml(tagClean)}'">${escapeHtml(tagClean)}</div>`;
      })
      .join("");
  }

  backdropTag.innerHTML = `
    <div class="hitomi-tag-modal-contenedor">
      <div class="hitomi-modal-header">
        <h3 class="hitomi-modal-titulo">
          <img src="${CONFIGURACION.urlIcono}" class="hitomi-logo-img" style="width:20px;height:20px;border-radius:4px;object-fit:contain;" alt="Hitomi Logo" />
          <span>🏷️ Seleccionar Tags: ${escapeHtml(tituloPestana)}</span>
        </h3>
        <button class="hitomi-modal-cerrar" id="hitomi-tag-btn-cerrar" title="Cerrar esta ventana">✕</button>
      </div>

      <div class="hitomi-modal-body">
        <div class="hitomi-estilo-separador-contenedor">
          <div style="font-size: 12px; font-weight: 600; color: #c9d1d9; margin-bottom: 8px;">
            📐 Estilo del Separador de Tags:
          </div>
          <div class="hitomi-selector-estilos" id="hitomi-selector-estilos-tags">
            <button class="hitomi-btn-estilo-tag ${estiloActual === 'pipe' ? 'activo' : ''}" data-estilo="pipe" title="Formato Pipe: Concatenar con ' ┃ tag1 tag2'">
              ┃ Pipe ( ┃ tags)
            </button>
            <button class="hitomi-btn-estilo-tag ${estiloActual === 'angle' ? 'activo' : ''}" data-estilo="angle" title="Formato Angular: Envolver entre ' ⟨tag1 tag2⟩'">
              ⟨⟩ Angular ( ⟨tags⟩)
            </button>
            <button class="hitomi-btn-estilo-tag ${estiloActual === 'square' ? 'activo' : ''}" data-estilo="square" title="Formato Corchete: Envolver entre ' [tag1 tag2]'">
              [] Corchete ( [tags])
            </button>
            <button class="hitomi-btn-estilo-tag ${estiloActual === 'paren' ? 'activo' : ''}" data-estilo="paren" title="Formato Paréntesis: Envolver entre ' (tag1 tag2)'">
              () Paréntesis ( (tags))
            </button>
          </div>
        </div>

        <div class="hitomi-custom-tags-contenedor">
          <div style="font-size: 12px; font-weight: 600; color: #c9d1d9; margin-bottom: 6px;">
            ✍️ Ingresar Tags Personalizados Manualmente (separados por ESPACIOS):
          </div>
          <div style="display: flex; gap: 8px;">
            <input type="text" id="hitomi-input-custom-tag" placeholder="Escribe tags separados por ESPACIOS (ej. schoolgirl blonde)..." class="hitomi-input-custom-tag-field" title="⚠️ Importante: Separa cada etiqueta ÚNICAMENTE con ESPACIOS (ej. schoolgirl blonde female). No se permiten comas ni caracteres especiales." />
            <button type="button" id="hitomi-btn-add-custom-tag" class="hitomi-btn hitomi-btn-secundario" style="white-space: nowrap;" title="Añadir la etiqueta o etiquetas ingresadas a la lista de selección">➕ Añadir Tag</button>
          </div>
          <div id="hitomi-custom-tag-warning" style="display: none; font-size: 11px; color: #f87171; margin-top: 6px; font-weight: 600; align-items: center; gap: 4px;">
            ⚠️ Carácter no permitido bloqueado. Usa únicamente ESPACIOS para separar etiquetas (ej. schoolgirl blonde).
          </div>
        </div>

        <p class="hitomi-modal-instruccion">
          Selecciona las etiquetas que deseas incluir en el nombre final del archivo:
        </p>

        <div class="hitomi-grid-tags" id="hitomi-contenedor-pills">
          ${generarHtmlPills()}
        </div>
      </div>

      <div class="hitomi-modal-footer">
        <div class="hitomi-modal-acciones-secundarias">
          <button class="hitomi-btn hitomi-btn-secundario" id="hitomi-tag-btn-todos" title="Marcar todas las etiquetas disponibles">Seleccionar Todos</button>
          <button class="hitomi-btn hitomi-btn-secundario" id="hitomi-tag-btn-ninguno" title="Desmarcar todas las etiquetas seleccionadas">Limpiar Selección</button>
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

  let timerWarningTag = null;

  function validarYLimpiarEntradaCustomTag() {
    if (!inputCustom) return;
    const valOriginal = inputCustom.value;
    // Permite letras (incluyendo acentuadas), números, guiones, guiones bajos y espacios
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

  function actualizarGridPills() {
    if (contenedorPills) {
      contenedorPills.innerHTML = generarHtmlPills();
    }
  }

  function agregarTagPersonalizado() {
    if (!inputCustom) return;
    validarYLimpiarEntradaCustomTag();

    const valorBruto = inputCustom.value || "";
    if (!valorBruto.trim()) return;

    // Separar por espacios en blanco (\s+) en lugar de comas
    const tagsNuevos = valorBruto.split(/\s+/).map(t => limpiarNombreTag(t)).filter(Boolean);
    if (tagsNuevos.length === 0) return;

    tagsNuevos.forEach(tagClean => {
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
    inputCustom.addEventListener("keydown", ev => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        agregarTagPersonalizado();
      }
    });
  }

  const selectorEstilos = backdropTag.querySelector("#hitomi-selector-estilos-tags");
  if (selectorEstilos) {
    selectorEstilos.addEventListener("click", ev => {
      const btnEstilo = ev.target.closest(".hitomi-btn-estilo-tag");
      if (!btnEstilo) return;

      const nuevoEstilo = btnEstilo.getAttribute("data-estilo");
      guardarValorGM(CLAVES.estiloSeparador, nuevoEstilo);
      selectorEstilos.querySelectorAll(".hitomi-btn-estilo-tag").forEach(b => b.classList.remove("activo"));

      btnEstilo.classList.add("activo");
    });
  }

  if (contenedorPills) {
    contenedorPills.addEventListener("click", ev => {
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
  if (btnTodos) {
    btnTodos.addEventListener("click", () => {
      todosLosTagsDisponibles.forEach(tagNombre => {
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
    const listaFinal = Array.from(tagsSeleccionadosSet);
    ESTADO.tagsSeleccionadosPorPestana.set(pestanaId, listaFinal);
    cerrar();
    if (typeof callbackGuardar === "function") callbackGuardar(listaFinal);
  });
}

export function mostrarPopupConfirmacion(pastilla, modoForzadoInicial = null) {
  let modoForzado = modoForzadoInicial !== null ? modoForzadoInicial : leerValorGM(CLAVES.modoForzado, false);
  const interfaz = obtenerOCrearAnfitrionUI(CONFIGURACION.ids.anfitrion);

  const modalExistente = document.getElementById(CONFIGURACION.ids.modalBackdrop);
  if (modalExistente) modalExistente.remove();

  const backdrop = document.createElement("div");
  backdrop.id = CONFIGURACION.ids.modalBackdrop;
  backdrop.className = "hitomi-modal-backdrop";

  // Estado de selección persistente durante la sesión activa del modal
  const pestanasMarcadasSet = new Set();
  let pestanasInicializadas = false;

  function renderizarContenidoModal() {
    const pestanasInfo = obtenerInformacionPestanas(modoForzado);
    const totalPestanas = pestanasInfo.length;
    const forzadasCount = pestanasInfo.filter(p => p.yaProcesada).length;
    const usarCbz = leerValorGM(CLAVES.usarCbz, false);
    const cerrarPestana = leerValorGM(CLAVES.cerrarPestana, false);


    // Inicializar la selección por defecto solo la primera vez que se abre la ventana
    if (!pestanasInicializadas) {
      pestanasInfo.forEach(p => pestanasMarcadasSet.add(p.id));
      pestanasInicializadas = true;
    }

    const marcadosInicialCount = pestanasInfo.filter(p => pestanasMarcadasSet.has(p.id)).length;
    const todosMarcadosInicial = totalPestanas > 0 && marcadosInicialCount === totalPestanas;

    backdrop.innerHTML = `
      <div class="hitomi-modal-contenedor">
        <div class="hitomi-modal-header">
          <h3 class="hitomi-modal-titulo">
            <img src="${CONFIGURACION.urlIcono}" class="hitomi-logo-img" style="width:20px;height:20px;border-radius:4px;object-fit:contain;" alt="Hitomi Logo" />
            <span>📋 Pestañas Detectadas (${totalPestanas})</span>
            <span class="hitomi-modal-badge-modo ${modoForzado ? 'forzado' : 'normal'}" title="${modoForzado ? 'Modo Forzado: Permite volver a descargar cómics que ya habías procesado previamente' : 'Modo Normal: Omite cómics ya procesados y solo descarga cómics nuevos'}">
              ${modoForzado ? '⚡ Modo Forzado' : '✓ Modo Normal'}
            </span>
          </h3>
          <button class="hitomi-modal-cerrar" id="hitomi-btn-cerrar-modal" title="Cerrar esta ventana">✕</button>
        </div>

        <div class="hitomi-modal-body">
          <p class="hitomi-modal-instruccion">
            ${
              modoForzado
                ? `⚡ <strong>Modo Forzado Activo:</strong> Se volverán a descargar los cómics seleccionados aunque ya hayan sido procesados (${forzadasCount} ya descargados).<br><small style="color:#768390">Usa <strong>Shift + Clic</strong> para seleccionar rangos o <strong>🏷️ Tags</strong> para personalizar etiquetas.</small>`
                : 'Selecciona los cómics que deseas descargar en lote desde tus pestañas abiertas:<br><small style="color:#768390">Usa <strong>Shift + Clic</strong> para seleccionar rangos o <strong>🏷️ Tags</strong> para personalizar etiquetas.</small>'
            }
          </p>

          ${
            totalPestanas === 0
              ? `<div class="hitomi-modal-vacio">
                   <p>No se encontraron pestañas de Hitomi ${modoForzado ? 'disponibles' : 'pendientes'}.</p>
                 </div>`
              : `
                 <!-- SECCIÓN DE OPCIONES Y CONFIGURACIÓN (CHECKBOXES) -->
                 <div class="hitomi-seccion-opciones" style="margin-bottom: 12px; padding: 10px 14px; background: #192028; border: 1px solid #2d3748; border-radius: 10px;">
                   <div style="font-size: 11px; font-weight: 700; color: #b580b5; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                     ⚙️ OPCIONES DE DESCARGA
                   </div>
                   <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; user-select: none;">
                     <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                       <label style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: #f0f6fc; cursor: pointer;" title="Marcar o desmarcar todos los cómics de la lista de una sola vez">
                         <input type="checkbox" id="hitomi-check-master-pestanas" ${todosMarcadosInicial ? 'checked' : ''} style="width: 15px; height: 15px; accent-color: #ec4899; cursor: pointer;" title="Marcar o desmarcar todo" />
                         <span id="hitomi-label-master-pestanas">${todosMarcadosInicial ? 'Deseleccionar Todo' : 'Seleccionar Todo'}</span>
                       </label>

                       <label style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: #c9d1d9; cursor: pointer;" title="Guardar los archivos descargados formateados con la extensión de cómic .cbz">
                         <input type="checkbox" id="hitomi-check-usar-cbz" ${usarCbz ? 'checked' : ''} style="accent-color: #ec4899; cursor: pointer; width: 15px; height: 15px;" title="Activar/desactivar guardado con extensión .cbz" />
                         <span>📦 Formato <strong>.cbz</strong></span>
                       </label>

                       <label style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: #c9d1d9; cursor: pointer;" title="Cierra automáticamente cada pestaña del navegador después de iniciar su descarga">
                         <input type="checkbox" id="hitomi-check-cerrar-pestana" ${cerrarPestana ? 'checked' : ''} style="accent-color: #ec4899; cursor: pointer; width: 15px; height: 15px;" title="Activar/desactivar cierre automático de pestañas descargadas" />
                         <span>🚪 <strong>Cerrar pestañas</strong> al descargar</span>
                       </label>
                     </div>

                     <div>
                       ${
                         !modoForzado
                           ? `<button class="hitomi-btn hitomi-btn-advertencia" id="hitomi-btn-modo-forzado" title="Permitir volver a descargar cómics que ya habías guardado anteriormente">
                                ⚡ Activar Modo Forzado
                              </button>`
                           : `<button class="hitomi-btn hitomi-btn-secundario" id="hitomi-btn-modo-normal" title="Desactivar modo forzado y descargar únicamente los cómics que estén pendientes">
                                ✓ Volver a Modo Normal
                              </button>`
                       }
                     </div>
                   </div>
                 </div>

                 <!-- SECCIÓN DE CÓMICS DETECTADOS -->
                 <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                   <span style="font-size: 11px; font-weight: 700; color: #9ab0c7; text-transform: uppercase; letter-spacing: 0.5px;">
                     📚 Cómics Detectados (${totalPestanas})
                   </span>
                   <span style="font-size: 11px; color: #768390;" title="Mantén presionado Shift al hacer clic en las casillas para marcar/desmarcar un rango entero">💡 Tip: Usa <strong>Shift + Clic</strong> para rangos</span>
                 </div>

                 <div class="hitomi-modal-lista" id="hitomi-modal-lista-items">
                   ${pestanasInfo
                     .map(
                       p => {
                         const estaMarcada = pestanasMarcadasSet.has(p.id);
                         const tagsSel = ESTADO.tagsSeleccionadosPorPestana.get(p.id) || [];
                         const tieneTags = tagsSel.length > 0;

                         const autorEditado = ESTADO.autoresEditadosPorPestana.get(p.id);
                         let autorMostrar = (autorEditado !== undefined && autorEditado !== null) ? autorEditado : (p.autor || "");
                         if (!autorMostrar || /^n\/?a$/i.test(autorMostrar.trim()) || /^none$/i.test(autorMostrar.trim())) {
                           autorMostrar = "Unknown";
                         } else {
                           autorMostrar = capitalizarNombre(autorMostrar);
                         }

                         const tituloEditado = ESTADO.titulosEditadosPorPestana.get(p.id);
                         const tituloMostrar = (tituloEditado !== undefined && tituloEditado !== null) ? tituloEditado : p.titulo;
                         return `
                           <div class="hitomi-modal-item ${p.yaProcesada ? 'es-forzada' : ''}">
                             <input type="checkbox" class="hitomi-check-pestana" data-id="${p.id}" ${estaMarcada ? 'checked' : ''} style="accent-color: #ec4899;" title="Marcar/desmarcar este cómic para la descarga" />
                             <div class="hitomi-modal-item-info">
                               <div class="hitomi-modal-inputs-row">
                                 <input type="text" class="hitomi-input-autor-item" data-id="${p.id}" value="${escapeHtml(autorMostrar)}" title="Editar autor o grupo (se antepondrá entre corchetes 「...」 al inicio)" placeholder="Autor..." />
                                 <input type="text" class="hitomi-input-titulo-item" data-id="${p.id}" value="${escapeHtml(tituloMostrar)}" title="Editar el nombre de archivo con el que se guardará este cómic en tu computadora" placeholder="Título del archivo..." />
                               </div>
                               <div class="hitomi-modal-item-url" title="${escapeHtml(p.url)}">${escapeHtml(p.url)}</div>
                             </div>
                             <button class="hitomi-btn-abrir-tags ${tieneTags ? 'tiene-tags' : ''}" data-id="${p.id}" title="Abrir el panel para elegir qué etiquetas concatenar al nombre de este cómic">
                               🏷️ Tags ${tieneTags ? `(${tagsSel.length})` : ''}
                             </button>
                             ${
                               p.yaProcesada
                                 ? `<span class="hitomi-item-tag hitomi-tag-forzada" title="Indica si este cómic es nuevo o si ya se había descargado antes">${p.esForzada ? '⚠️ Re-descargada' : '⚠️ Ya descargada'}</span>`
                                 : `<span class="hitomi-item-tag hitomi-tag-nueva" title="Cómic nuevo pendiente de descarga">Nueva</span>`
                             }
                           </div>
                         `;
                       }
                     )
                     .join('')}
                 </div>`
          }
        </div>

        <!-- PIE DE MODAL / SECCIÓN DE ACCIONES (BOTONES DE EJECUCIÓN) -->
        <div class="hitomi-modal-footer">
          <div class="hitomi-modal-acciones-secundarias">
            <button class="hitomi-btn hitomi-btn-secundario" id="hitomi-btn-reescanear" title="Volver a buscar las pestañas de Hitomi abiertas en el navegador y actualizar la lista">
              🔄 Escanear Pestañas
            </button>
            <button class="hitomi-btn hitomi-btn-peligro" id="hitomi-btn-limpiar-memoria" title="Borrar el registro de descargas realizadas para volver a empezar desde cero">
              🗑️ Limpiar Memoria
            </button>
          </div>

          <div class="hitomi-modal-acciones-principales">
            <button class="hitomi-btn hitomi-btn-secundario" id="hitomi-btn-cancelar" title="Cerrar este panel sin realizar ninguna descarga">
              Cancelar
            </button>
            <button class="hitomi-btn ${modoForzado ? 'hitomi-btn-forzado-confirmar' : 'hitomi-btn-primario'}" id="hitomi-btn-confirmar" ${marcadosInicialCount === 0 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''} title="Enviar la orden de descarga a todos los cómics marcados con la casilla rosada">
              ${modoForzado ? `⚡ Re-descargar Forzado (${marcadosInicialCount})` : `▶ Iniciar Descarga (${marcadosInicialCount})`}
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


    const checkMaster = backdrop.querySelector("#hitomi-check-master-pestanas");
    const labelMaster = backdrop.querySelector("#hitomi-label-master-pestanas");
    const listaItems = backdrop.querySelector("#hitomi-modal-lista-items");

    function sincronizarEstadoCheckboxes() {
      if (!listaItems) return;
      const checkboxes = Array.from(listaItems.querySelectorAll(".hitomi-check-pestana"));
      if (checkboxes.length === 0) return;

      checkboxes.forEach(cb => {
        const id = cb.getAttribute("data-id");
        if (cb.checked) {
          pestanasMarcadasSet.add(id);
        } else {
          pestanasMarcadasSet.delete(id);
        }
      });

      const marcadosCount = checkboxes.filter(cb => cb.checked).length;
      const todosMarcados = marcadosCount === checkboxes.length;

      if (checkMaster && labelMaster) {
        checkMaster.checked = todosMarcados;
        labelMaster.textContent = todosMarcados ? "Deseleccionar Todo" : "Seleccionar Todo";
      }

      const btnConfirmar = backdrop.querySelector("#hitomi-btn-confirmar");
      if (btnConfirmar) {
        btnConfirmar.disabled = marcadosCount === 0;
        btnConfirmar.style.opacity = marcadosCount === 0 ? "0.5" : "1";
        btnConfirmar.style.cursor = marcadosCount === 0 ? "not-allowed" : "pointer";
        btnConfirmar.textContent = modoForzado
          ? `⚡ Re-descargar Forzado (${marcadosCount})`
          : `▶ Iniciar Descarga (${marcadosCount})`;
      }
    }

    if (checkMaster && listaItems) {
      checkMaster.addEventListener("change", () => {
        const estadoNuevo = checkMaster.checked;
        const checkboxes = listaItems.querySelectorAll(".hitomi-check-pestana");
        checkboxes.forEach(cb => {
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

      listaItems.addEventListener("change", ev => {
        if (ev.target.classList.contains("hitomi-check-pestana")) {
          sincronizarEstadoCheckboxes();
        }
      });

      listaItems.addEventListener("input", ev => {
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

      // Event listener para abrir el selector de tags por cada item
      listaItems.addEventListener("click", ev => {
        const btnTags = ev.target.closest(".hitomi-btn-abrir-tags");
        if (!btnTags) return;

        const pId = btnTags.getAttribute("data-id");
        const pInfo = pestanasInfo.find(item => item.id === pId);
        if (!pInfo) return;

        sincronizarEstadoCheckboxes();

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
      pestanasMarcadasSet.clear();
      await publicarEstadoPestana();
      renderizarContenidoModal();
    });

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
}
