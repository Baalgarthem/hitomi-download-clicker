# Registro de Rastreo de Errores y Diagnóstico (Bug Trace Log)

## 📌 Resumen del Incidente

- **Fecha de Detección**: 6 de Agosto de 2026
- **Componente Afectado**: Encabezado de Metadatos del Userscript (`UserScript Metadata Header`)
- **Gestor de Scripts Afectado**: Violentmonkey / Tampermonkey / Greasemonkey
- **Síntoma**: Al intentar actualizar el script manualmente o mediante la verificación automática de Violentmonkey, el gestor mostraba el error: *"No se puede obtener información del script"*.

---

## 🔍 Análisis de Causa Raíz (Root Cause Analysis)

### 1. Contexto de Configuración
En los scripts de usuario (Userscripts), el bloque `@UserScript` define metadatos de directivas. Entre ellos, las etiquetas `@downloadURL` y `@updateURL` indican al motor de extensiones la ubicación remota exacta desde la cual consultar y descargar las actualizaciones del script.

### 2. Discrepancia de Nombres (Naming Mismatch)
El repositorio de GitHub y el sistema de archivos del proyecto definen el archivo principal como:
> **Nombre correcto del archivo**: `hitomi-download-clicker.user.js`

Sin embargo, en la cabecera de metadatos del script se tenían configuradas las siguientes direcciones:
```javascript
// @downloadURL  https://raw.githubusercontent.com/Baalgarthem/hitomi-download-clicker/principal/hitomi-clicker.user.js
// @updateURL    https://raw.githubusercontent.com/Baalgarthem/hitomi-download-clicker/principal/hitomi-clicker.user.js
```

### 3. Impacto Técnico
La URL apuntaba hacia `hitomi-clicker.user.js` (omitiendo la palabra `-download-`). Al realizar la solicitud HTTP `GET` a la infraestructura de GitHub Raw:
- **Respuesta del Servidor**: `HTTP/1.1 404 Not Found`
- **Resultado en Violentmonkey**: Al recibir un código 404, la extensión no podía obtener el contenido del script ni analizar la versión actualizada (`@version`), emitiendo el mensaje de error reportado por el usuario.

---

## 🛠️ Modificación y Corrección Aplicada

Se corrigieron las etiquetas `@downloadURL` y `@updateURL` en el archivo `hitomi-download-clicker.user.js` para hacerlas coincidir con el nombre real del archivo en la rama `principal`:

```diff
-// @downloadURL  https://raw.githubusercontent.com/Baalgarthem/hitomi-download-clicker/principal/hitomi-clicker.user.js
-// @updateURL    https://raw.githubusercontent.com/Baalgarthem/hitomi-download-clicker/principal/hitomi-clicker.user.js
+// @downloadURL  https://raw.githubusercontent.com/Baalgarthem/hitomi-download-clicker/principal/hitomi-download-clicker.user.js
+// @updateURL    https://raw.githubusercontent.com/Baalgarthem/hitomi-download-clicker/principal/hitomi-download-clicker.user.js
```

---

## 🎓 Lección Propodeútica y Buenas Prácticas

1. **Consistencia de Nombres**: Los identificadores de rutas y archivos en metadatos remotos deben sincronizarse estrictamente con la estructura física del repositorio tras cualquier renombrado.
2. **Validación de Enlaces de Lanzamiento**: Antes de publicar una nueva versión, se recomienda verificar mediante peticiones HTTP la accesibilidad pública de las URLs especificadas en `@downloadURL` y `@updateURL`.
