# Diario de Desarrollo (Changelog y Arquitectura en Evolución)

Este documento registra los cambios introducidos en el código, documentando la justificación de las decisiones y cómo los módulos interactúan entre sí. Siguiendo las directrices del archivo `AGENTS.md`, cada vez que se modifique o añada un módulo, se debe registrar aquí.

## `src/core/tags.js` (Nuevo Módulo)
- Implementación de la extracción y formateo de etiquetas desde `<ul id="tags" class="tags">`.
- Limpieza automática de símbolos de género (`♀`, `♂`) y prefijos de categoría (`female:`, `male:`).
- Concatenación de etiquetas elegidas usando el delimitador especificado: ` ┃ tag1 tag2 tag3`.
- Función `obtenerNombreFinalCompleto()` para estructurar el nombre final del archivo:
  `「Artista」 Nombre del Comic ┃ viajes chicas rubia`

## `src/ui/modal.js`
- Adición de un sub-modal emergente interactivo para seleccionar etiquetas de cada comic mediante pills conmutables (botones `🏷️ Tags`).
- Botones de acción rápida: "Seleccionar Todos" y "Limpiar Selección".
- Permite omitir la consulta de tags si la casilla/botón no es activado por el usuario.

## `src/core/download.js`
- Inyección del nombre final concatenado (`「Artista」 Nombre ┃ tags`) en los atributos `download`, `title` y `data-hitomi-nombre-final` del botón de descarga.

## `src/core/presence.js`
- Transmisión IPC de tags disponibles y tags seleccionados en las órdenes distribuidas entre pestañas.
