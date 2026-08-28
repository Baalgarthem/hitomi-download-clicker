# Guía para agentes

## Descripción del repositorio

Hitomi Clicker es un userscript que recorre pestañas abiertas de Hitomi y pulsa automáticamente el botón de descarga.

## Estructura

- `src/`: Código fuente modular.
- `docs/`: Documentación técnica (requisitos, funciones, bugs, módulos, diario de desarrollo) y archivo base `legacy_hitomi-download-clicker.user.js` como referencia/backup.
- `dist/`: Archivos construidos para distribución (ej. `dist/hitomi-download-clicker.user.js` generado por esbuild).

## Convenciones de trabajo

- Mantén el proyecto compatible con gestores de userscripts (Tampermonkey, Violentmonkey).
- Se utiliza `esbuild` para agrupar módulos ES6. No introduzcas dependencias de NPM que se empaqueten en producción a menos que sea estrictamente necesario.
- Los metadatos de UserScript (bloque `// ==UserScript==`) deben colocarse en el punto de entrada (`src/index.js`).

## Protocolos Obligatorios

1. **Gestión de Errores (Bug Trace):** Todo bug sin excepción se debe revisar, reportar y analizar desde el archivo `docs/bug-trace.md`, siguiendo estrictamente la estructura tabular y las reglas irrevocables definidas en la cabecera de ese archivo.
2. **Registro de Cambios (Diario de Desarrollo):** Todo cambio en el código se debe documentar obligatoriamente en el archivo `docs/desarrollo.md`. El archivo debe estar seccionado por módulos. Si se crea un nuevo módulo, se añade una nueva sección. Si los módulos se relacionan o interactúan, se debe indicar claramente en este documento el porqué, de qué forma y con qué elementos o funciones del otro módulo se vinculan.

## Verificación

- Ejecuta `npx esbuild` según las instrucciones de `requerimientos.md` para verificar que el código transpila sin errores.
- Prueba el script cargando el archivo `dist/hitomi-download-clicker.user.js`.

## Alcance de los cambios

- Solo manipula archivos dentro de `src/` cuando programes características o soluciones.
- Asegúrate de empaquetar si se solicita antes de dar por terminado un trabajo.
