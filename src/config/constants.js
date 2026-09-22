// ─────────────────────────────────────────────
// Configuración general y constantes del sistema
// ─────────────────────────────────────────────

export const CONFIGURACION = {
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

export const ESTILOS_SEPARADOR = {
  pipe: { id: "pipe", label: "┃ Pipe", prefijo: " ┃ ", sufijo: "" },
  angle: { id: "angle", label: "⟨⟩ Angular", prefijo: " ⟨", sufijo: "⟩" },
  square: { id: "square", label: "[] Corchete", prefijo: " [", sufijo: "]" },
  paren: { id: "paren", label: "() Paréntesis", prefijo: " (", sufijo: ")" }
};

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

export const ID_PESTANA = generarIdPestana();

export const CLAVES = {
  presencia: id => `hitomi_presencia_${id}`,
  orden: "hitomi_orden_global",
  respuesta: (nonce, id) => `hitomi_respuesta_${nonce}_${id}`,
  memoriaPaginas: "hitomi_paginas_procesadas",
  urlPestana: id => `hitomi_url_${id}`,
  tituloPestana: id => `hitomi_titulo_${id}`,
  autorPestana: id => `hitomi_autor_${id}`,
  tagsPestana: id => `hitomi_tags_${id}`,
  estiloSeparador: "hitomi_estilo_separador_tags",
  usarCbz: "hitomi_usar_extension_cbz",
  cerrarPestana: "hitomi_cerrar_pestana_al_descargar",
  modoForzado: "hitomi_modo_forzado",
  rutaDescarga: "hitomi_ruta_descarga_personalizada"
};


export const ESTADO = {
  bloqueado: false,
  permitirClicForzado: false,
  ordenesEjecutadas: new Set(),
  botonPastilla: null,
  ultimoEstadoPublicado: null,
  tagsSeleccionadosPorPestana: new Map(),
  titulosEditadosPorPestana: new Map(),
  autoresEditadosPorPestana: new Map(),
  ultimoNombreFinal: null
};
