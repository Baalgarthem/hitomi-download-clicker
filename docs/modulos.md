# Arquitectura y Estructura del Proyecto

Esta guía está diseñada de manera pedagógica para que cualquier persona o agente pueda entender rápidamente cómo está organizado el proyecto, cuál es el propósito de cada pieza y cómo interactúan entre sí.

## Árbol del Proyecto (Tree)

```text
hitomi-download-clicker/
├── media/                     # Recursos estáticos (iconos, imágenes)
├── src/                       # Código fuente modular
│   ├── config/                # ⚙️ Configuración y constantes del sistema
│   │   └── constants.js       # Configuración global, claves GM y constantes
│   ├── core/                  # 🧠 El cerebro y la lógica principal
│   │   ├── author.js          # Extracción de autor y formateo 「xxxx」
│   │   ├── download.js        # Detección multinivel de botón, inyección de título final y ejecutor
│   │   ├── memory.js          # Almacenamiento persistente en GM_storage
│   │   ├── presence.js        # Presencia IPC e intercomunicación entre pestañas (URL, títulos, tags)
│   │   └── tags.js            # 🏷️ Extracción y formateador de Tags con delimitador ┃ + tags
│   ├── ui/                    # 🎨 Interfaz gráfica de usuario
│   │   ├── badge.js           # Insignias visuales de estado (Descargado / Re-descargado)
│   │   ├── modal.js           # Diálogo popup principal y sub-modal selector de tags
│   │   └── pill.js            # Pastilla flotante de control principal
│   ├── utils/                 # 🛠️ Funciones auxiliares y manipulación DOM
│   │   └── dom.js             # Normalización de URLs, visibilidad y retardos
│   └── index.js               # 🚀 Punto de Entrada: orquesta los módulos e inicializa escuchadores
├── docs/                      # 📚 Documentación técnica y registros (Ignorado en Git)
├── dist/                      # 📦 Código construido listo para usarse (Ignorado en Git)
├── build.js                   # 🚀 Deployment Manager (Build, Publish y Auto-Push)
├── package.json               # Configuración de npm (comandos y dependencias)
├── AGENTS.md                  # Reglas irrevocables para los agentes de IA
└── .gitignore                 # Archivos y directorios explícitamente ignorados
```

## Propósito Conceptual de los Módulos

- `src/core/tags.js`: Escanea el contenedor `<ul id="tags" class="tags">`, limpia símbolos de género (`♀`, `♂`) y concatena etiquetas seleccionadas con el símbolo ` ┃ + tags`.
- `src/ui/modal.js`: Renderiza la lista de pestañas detectadas y despliega el menú emergente selector de tags dinámico por cada comic.
- `src/core/download.js`: Inyecta el nombre formateado `「Artista」 Nombre del Comic ┃ tag1 tag2` en el atributo de descarga del botón `#dl-button`.
