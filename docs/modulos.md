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
│   │   ├── download.js        # Detección multinivel de botón y ejecutor de clics
│   │   ├── memory.js          # Almacenamiento persistente en GM_storage
│   │   └── presence.js        # Presencia IPC e intercomunicación entre pestañas
│   ├── ui/                    # 🎨 Interfaz gráfica de usuario
│   │   ├── badge.js           # Insignias visuales de estado (Descargado / Re-descargado)
│   │   ├── modal.js           # Diálogo popup interactivo con selección múltiple (Shift/Ctrl)
│   │   └── pill.js            # Pastilla flotante de control principal
│   ├── utils/                 # 🛠️ Funciones auxiliares y manipulación DOM
│   │   └── dom.js             # Normalización de URLs, visibilidad y retardos
│   └── index.js               # 🚀 Punto de Entrada: orquesta los módulos
├── docs/                      # 📚 Documentación técnica y registros (Ignorado en Git)
├── dist/                      # 📦 Código construido listo para usarse (Ignorado en Git)
├── build.js                   # 🚀 Deployment Manager (Build, Publish y Auto-Push)
├── package.json               # Configuración de npm (comandos y dependencias)
├── AGENTS.md                  # Reglas irrevocables para los agentes de IA
└── .gitignore                 # Archivos y directorios explícitamente ignorados
```

## Propósito Conceptual de los Módulos

- `build.js`: Deployment Manager automatizado que gestiona compilaciones con esbuild, bump de versiones en publicados y sincronización automática mediante `git push`.
- `src/config/constants.js`: Almacena selectores, identificadores y claves compartidas.
- `src/core/author.js`: Detecta `<h2 id="artists">` y formateadores de autores envolviéndolos entre comillas japonesas `「xxxx」`.
- `src/core/download.js`: Ejecuta la detección en cascada y confirma la emisión real del clic.
- `src/core/memory.js`: Mantiene el mapa persistente de páginas descargadas y re-descargadas.
- `src/core/presence.js`: Publica estados y procesa órdenes IPC entre pestañas abiertas.
- `src/ui/`: Módulos visuales independientes para badges, diálogos modales y la pastilla flotante.
