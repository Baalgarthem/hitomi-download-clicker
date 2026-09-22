# 🚀 Hitomi Clicker & Downloader

**Hitomi Clicker** es un UserScript avanzado y automatizado diseñado para simplificar la descarga y organización de cómics y doujins en [Hitomi.la](https://hitomi.la/).

El script escanea todas tus pestañas abiertas, detecta los enlaces de descarga y renombra los archivos descargados de forma limpia, estructurada y sin duplicados.

---

## ✨ Características Principales

### 🏷️ 1. Nombrado Inteligente en 3 Componentes
Cada archivo descargado se nombra automáticamente siguiendo una estructura limpia y desacoplada:

$$\text{「Autor / Círculo」 } + \text{ Título del Cómic } + \text{ Tags Concatenados}$$

- **Prefijo Autor / Círculo (`「Autor」`)**: Extrae el nombre del artista. Si el autor figura como `N/A`, el script **detecta automáticamente el nombre del grupo publicador** (`td#groups`). Si ni el autor ni el grupo están disponibles, asigna `「Unknown」` para evitar errores de archivo en Windows.
- **Cuerpo Principal (Título)**: Elimina marcas de agua del sitio web (`Hitomi.la`, `Read online at...`) y redundancias (`by autor`) para dejar el título 100% limpio.
- **Sufijo (Tags Concatenados)**: Te permite elegir qué etiquetas añadir al final del nombre con delimitadores configurables (`┃ Pipe`, `⟨⟩ Angular`, `[] Corchete`, `() Paréntesis`).

---

### ✏️ 2. Edición Personalizada por Ítem
Desde el menú modal puedes editar **directamente en vivo**:
- El **Nombre del Autor** (para personalizar el prefijo `「...」`).
- El **Título del Cómic** (para corregir o ajustar la cadena principal).

---

### 📦 3. Opción para Renombrar a `.cbz`
Con solo marcar la casilla **📦 Renombrar a .cbz** en el menú de confirmación, todas tus descargas se guardarán automáticamente con la extensión de cómics `.cbz` (archivados ZIP listos para lectores de cómics).

---

### 📋 4. Intercomunicación entre Pestañas (IPC)
No necesitas ir pestaña por pestaña. Desde cualquier pestaña abierta puedes presionar el botón de la pastilla flotante y enviar la orden de descarga a **todas las demás pestañas abiertas en segundo plano**.

---

### 🧠 5. Memoria Estructurada y Prevención de Duplicados
- El script recuerda qué páginas ya fueron descargadas (incluso si cierras y vuelves a abrir el navegador).
- Si una pestaña ya se procesó, la marca con un distintivo verde **✓ Descargado** y evita descargas duplicadas.
- ¿Quieres volver a descargar? Usa el botón **⚡ Clic Forzado** en el menú modal.

---

## 📖 Guía de Uso Paso a Paso

1. **Abre tus cómics favoritos** en diferentes pestañas de Hitomi.la.
2. **Haz clic en la pastilla flotante** `Hitomi DL` (ubicada en la esquina inferior derecha).
3. **Revisa el menú emergente**:
   - Ajusta o edita el **Autor** o **Título** si lo deseas.
   - Haz clic en `🏷️ Tags` si quieres añadir etiquetas como `┃ girls blonde`.
   - Activa `📦 Renombrar a .cbz` si prefieres ese formato.
4. **Presiona ▶ Iniciar Descarga**: El script recorrerá todas las pestañas seleccionadas descargando los archivos con sus nombres configurados.

> 💡 **Seleccionar / Deseleccionar Todo**: Usa la casilla maestra en la parte superior del menú emergente para alternar instantáneamente la selección de todas las pestañas.
> 💡 **Selección en Rango**: Puedes mantener presionada la tecla **Shift** y hacer clic en dos casillas para seleccionar un rango completo de pestañas a la vez.
> 💡 **Limpieza de Memoria**: Mantén presionado **Shift + Clic** sobre la pastilla flotante para resetear la memoria de descargas.

---

## 🛠️ Instalación

1. Instala una extensión de UserScripts en tu navegador (ej. [Tampermonkey](https://www.tampermonkey.net/) o Violentmonkey).
2. Haz clic en el enlace de instalación del script:
   `https://raw.githubusercontent.com/Baalgarthem/hitomi-download-clicker/principal/dist/hitomi-download-clicker.user.js`
3. Presiona **Instalar** en Tampermonkey y ¡listo!

---

## 📚 Documentación Técnica y Pedagógica

Para desarrolladores, programadores novatos o interesados en la arquitectura del proyecto:
- 🍩 **[Guía Pedagógica: Intercepción y Renombrado de Descargas](docs/guia-intercepcion-descargas.md)**: Explicación didáctica con analogías simples sobre la intercepción en 8 capas, resolución del error de extensión `.cbz`/`.zip` y el flujo estandarizado en 4 pasos.
- 💾 **[Guía Pedagógica: Persistencia de Configuración](docs/guia-persistencia-configuracion.md)**: Explicación de almacenamiento persistente (`GM_getValue`/`GM_setValue`), la analogía de la pizarra vs el cuaderno y wrappers con fallback a `localStorage`.
- 🛠️ **[Documentación de Funciones](docs/funciones.md)**: Desglose por módulos de todas las funciones de `download.js`, `tags.js`, `author.js`, `dom.js` y `presence.js`.
- 🏗️ **[Diario de Desarrollo y Changelog](docs/desarrollo.md)**: Historial completo de versiones y decisiones de diseño.


---

## 📜 Licencia
Este proyecto está bajo la Licencia **MIT**. Creado por **Baalgarthem**.
