# Diario de Desarrollo (Changelog y Arquitectura en Evolución)

Este documento registra los cambios introducidos en el código, documentando la justificación de las decisiones y cómo los módulos interactúan entre sí. Siguiendo las directrices del archivo `AGENTS.md`, cada vez que se modifique o añada un módulo, se debe registrar aquí.

## `build.js` (Deployment Manager)
- Implementación del gestor de despliegue y empaquetado en Node.js.
- Soporte para banderas CLI `--publish` (incremento automático de versión en `package.json` y `src/index.js`, generación de commit) y `--push` (git push automático).
- Integración de plugin para formateo estético de separadores de módulos dentro del bundle distribuible.

## `src/config/constants.js`
- Desacoplamiento de la configuración global, selectores de descarga, selectores de artista (`#artists`), estados e identidades de pestaña.

## `src/utils/dom.js`
- Funciones puras para visibilidad DOM (`elementoVisible`), normalización estricta de URLs (`normalizarUrl`) y formateo de horas.

## `src/core/author.js`
- Nuevo módulo para extracción de nombres de artista desde `<h2 id="artists">` y formateo automático con comillas japonesas `「xxxx」`.
- Integra el autor formateado dentro del título de la pestaña y los metadatos de presencia.

## `src/core/memory.js`
- Gestión de la memoria persistente en `GM_getValue`/`GM_setValue` con retrocompatibilidad para arreglos antiguos y mapas de objetos.

## `src/core/download.js`
- Búsqueda multinivel del botón `#dl-button`, etiquetado con `data-hitomi-autor` y confirmación estricta de clics para evitar falsos positivos en descargas SPA.

## `src/core/presence.js`
- Control de presencia intercomunicada (IPC) entre pestañas de Hitomi. Soporta auto-ejecución directa en la pestaña local y mensajes remotos.

## `src/ui/badge.js`
- Manipulación visual de insignias `✓ Descargado` (verde) y `✓ Re-descargado` (naranja) sobre el botón nativo.

## `src/ui/modal.js`
- Modal interactivo de confirmación con soporte para selección múltiple por rango usando **Shift + Clic** y **Ctrl + Clic**, junto a botón de borrado rápido de memoria.

## `src/ui/pill.js`
- Pastilla de control flotante principal en la esquina inferior derecha.

## Relaciones Inter-Modulares
- `index.js` inicializa los estilos de `ui/modal.js` y `ui/pill.js`, activa los escuchadores IPC de `core/presence.js` y `core/download.js`.
- `core/presence.js` consume `core/author.js` para añadir el autor `「xxxx」` a los títulos que se publican y se despliegan en `ui/modal.js`.
