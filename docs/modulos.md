# Arquitectura y Estructura del Proyecto

Esta guía está diseñada de manera pedagógica para que cualquier persona o agente pueda entender rápidamente cómo está organizado el proyecto, cuál es el propósito de cada pieza y cómo interactúan entre sí.

## Árbol del Proyecto (Tree)

```text
hitomi-download-clicker/
├── media/                     # Recursos estáticos
├── src/                       # Código fuente modular (donde programamos)
│   ├── core/                  # 🧠 El cerebro y la lógica principal
│   │   └── hitomi.js          # Lógica central del clicker
│   └── index.js               # 🚀 Punto de Entrada: orquesta todo e inicia el flujo
├── docs/                      # 📚 Documentación técnica y registros (Ignorado en Git)
├── dist/                      # 📦 Código construido listo para usarse (Ignorado en Git)
├── package.json               # Configuración de npm (comandos y dependencias como esbuild)
├── AGENTS.md                  # Reglas irrevocables para los agentes de IA
└── .gitignore                 # Archivos y directorios explícitamente ignorados
```

## Propósito Conceptual de los Módulos y Carpetas

- `src/core/`: Toda la carga computacional central sobre el clicker.
- `dist/`: El archivo final y unificado compilado por esbuild.
- `docs/`: Almacenamiento local para bitácoras y documentación técnica.
