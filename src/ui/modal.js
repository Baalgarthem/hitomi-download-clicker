// ─────────────────────────────────────────────
// Interfaz Visual: Modal de Confirmación y Selección
// ─────────────────────────────────────────────

import { CONFIGURACION } from '../config/constants.js';
import { obtenerInformacionPestanas, publicarEstadoPestana, recorrerPestanasDescarga } from '../core/presence.js';
import { limpiarMemoriaProcesadas } from '../core/memory.js';
import { resetearEstadoBotonDescarga } from './badge.js';

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

export function aplicarEstilosModal() {
  GM_addStyle(`
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
      }
    }

    ultimoCheckClickeado = checkbox;
  });
}

export function mostrarPopupConfirmacion(pastilla, modoForzadoInicial = false) {
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
                ? `Se re-ejecutarán descargas. Las marcadas como <strong>[⚠️ Re-descargada]</strong> o <strong>[⚠️ Ya descargada]</strong> volverán a ser clickeadas (${forzadasCount} en total).<br><small style="color:#8b949e">Usa <strong>Shift + Clic</strong> para seleccionar un rango de casillas.</small>`
                : 'Selecciona las pestañas a las que deseas enviar la orden de descarga:<br><small style="color:#8b949e">Usa <strong>Shift + Clic</strong> para seleccionar un rango de casillas.</small>'
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
                           ? `<span class="hitomi-item-tag hitomi-tag-forzada">${p.esForzada ? '⚠️ Re-descargada (Forzada)' : '⚠️ Ya descargada (Forzada)'}</span>`
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
            <button class="hitomi-btn hitomi-btn-peligro" id="hitomi-btn-limpiar-memoria" title="Borrar historial y olvidar todas las páginas procesadas">
              🗑️ Limpiar Memoria
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

    const listaItems = backdrop.querySelector("#hitomi-modal-lista-items");
    if (listaItems) {
      vincularSeleccionMultipleCheckboxes(listaItems);
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
