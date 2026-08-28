const fs = require('fs');

const src = fs.readFileSync('hitomi-download-clicker.user.js', 'utf8');

const parts = src.split(/\/\/ ─────────────────────────────────────────────/);
// parts[0] is metadata and intro
// parts[1] Configuración general del sistema
// parts[2] Identidad única de cada pestaña
// parts[3] Claves compartidas entre pestañas
// parts[4] Estado interno del script
// parts[5] Herramientas generales y Normalización
// parts[6] Ejecución y Verificación Estricta de Clic Real
// parts[7] Detección Multinivel del Botón de Descarga
// parts[8] Memoria Persistente Estructurada
// parts[9] Estado Visual del Botón de Descarga
// parts[10] Publicación del estado de la pestaña
// parts[11] Limpieza de presencia
// parts[12] Observación de cambios dinámicos (Debounced)
// parts[13] Ejecución de órdenes recibidas
// parts[14] Escucha de órdenes entre pestañas
// parts[15] Consulta de pestañas disponibles
// parts[16] Interfaz visual del usuario
// parts[17] Estilos de la interfaz y Popups
// ... there are more parts

fs.mkdirSync('src/config', { recursive: true });
fs.mkdirSync('src/core', { recursive: true });
fs.mkdirSync('src/utils', { recursive: true });
fs.mkdirSync('src/ui', { recursive: true });

// I'll just put everything into one core file for now and export init
const scriptCore = src.replace(/\(\(\) => \{/, 'export function initHitomi() {').replace(/\}\)\(\);/, '}');
fs.writeFileSync('src/core/hitomi.js', scriptCore);

const metadataMatch = src.match(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/);
const metadata = metadataMatch ? metadataMatch[0] : '';

const indexSrc = `${metadata}
import { initHitomi } from './core/hitomi.js';

initHitomi();
`;
fs.writeFileSync('src/index.js', indexSrc);
console.log('done');
