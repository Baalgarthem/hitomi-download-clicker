// ─────────────────────────────────────────────
// Servicios de Almacenamiento (Inyección de Dependencias)
// ─────────────────────────────────────────────

/**
 * Interfaz / Contrato del Servicio de Almacenamiento.
 * Permite desacoplar las operaciones de lectura/escritura de APIs concretas (GM_*, localStorage, etc.)
 */
export class StorageService {
  /**
   * Obtiene un valor almacenado.
   * @param {string} clave - Clave de almacenamiento.
   * @param {any} valorDefecto - Valor predeterminado si no existe.
   * @returns {any}
   */
  get(clave, valorDefecto = null) {
    throw new Error("Método 'get' no implementado");
  }

  /**
   * Guarda un valor en el almacenamiento.
   * @param {string} clave - Clave de almacenamiento.
   * @param {any} valor - Valor a almacenar.
   */
  set(clave, valor) {
    throw new Error("Método 'set' no implementado");
  }

  /**
   * Elimina un valor del almacenamiento.
   * @param {string} clave - Clave a eliminar.
   */
  delete(clave) {
    throw new Error("Método 'delete' no implementado");
  }

  /**
   * Retorna una lista con todas las claves disponibles.
   * @returns {string[]}
   */
  listKeys() {
    throw new Error("Método 'listKeys' no implementado");
  }
}

/**
 * Implementación de StorageService para entornos Userscript (Tampermonkey / Violentmonkey)
 * con fallback transparente a LocalStorage.
 */
export class GMStorageService extends StorageService {
  get(clave, valorDefecto = null) {
    try {
      if (typeof GM_getValue !== "undefined") {
        const valor = GM_getValue(clave, valorDefecto);
        if (valor !== undefined && valor !== null) return valor;
      }
      if (typeof localStorage !== "undefined") {
        const item = localStorage.getItem(clave);
        if (item !== null) {
          try {
            return JSON.parse(item);
          } catch {
            return item;
          }
        }
      }
    } catch (e) {
      console.error(`[GMStorageService] Error al leer clave ${clave}:`, e);
    }
    return valorDefecto;
  }

  set(clave, valor) {
    try {
      if (typeof GM_setValue !== "undefined") {
        GM_setValue(clave, valor);
      }
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(clave, typeof valor === "string" ? valor : JSON.stringify(valor));
      }
    } catch (e) {
      console.error(`[GMStorageService] Error al guardar clave ${clave}:`, e);
    }
  }

  delete(clave) {
    try {
      if (typeof GM_deleteValue !== "undefined") {
        GM_deleteValue(clave);
      }
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(clave);
      }
    } catch (e) {
      console.error(`[GMStorageService] Error al eliminar clave ${clave}:`, e);
    }
  }

  listKeys() {
    try {
      if (typeof GM_listValues !== "undefined") {
        return GM_listValues();
      }
      if (typeof localStorage !== "undefined") {
        return Object.keys(localStorage);
      }
    } catch (e) {
      console.error("[GMStorageService] Error al listar claves:", e);
    }
    return [];
  }
}

/**
 * Implementación de StorageService en memoria RAM (ideal para tests unitarios).
 */
export class InMemoryStorageService extends StorageService {
  constructor(initialData = {}) {
    super();
    this.map = new Map(Object.entries(initialData));
  }

  get(clave, valorDefecto = null) {
    return this.map.has(clave) ? this.map.get(clave) : valorDefecto;
  }

  set(clave, valor) {
    this.map.set(clave, valor);
  }

  delete(clave) {
    this.map.delete(clave);
  }

  listKeys() {
    return Array.from(this.map.keys());
  }
}

// Instancia por defecto inyectable
export const defaultStorage = new GMStorageService();
