import { ERROR_MESSAGES, DEFAULT_ERROR_MESSAGE } from "../constants/errorMessages";

/**
 * Traduce los códigos de error del backend a mensajes en español
 * @param {Object} error - Objeto de error de axios o similar
 * @returns {string} - Mensaje de error traducido
 */
export const translateError = (error) => {
  try {
    // Verificar si es un error con response del backend
    if (error.response?.data) {
      const errorData = error.response.data;

      // Si el backend devuelve un código en el campo 'code'
      if (errorData.code) {
        // Buscar en todas las categorías de errores
        for (const category of Object.values(ERROR_MESSAGES)) {
          if (category[errorData.code]) {
            return category[errorData.code];
          }
        }
      }

      // Si el backend devuelve un detail
      if (typeof errorData.detail === "string") {
        // Primero, intentar buscar el detail completo como código en todas las categorías
        for (const category of Object.values(ERROR_MESSAGES)) {
          if (category[errorData.detail]) {
            return category[errorData.detail];
          }
        }

        // Si no coincide directamente, intentar extraer código del formato "CODE: message"
        const codeMatch = errorData.detail.match(/^([A-Z_]+):/);
        if (codeMatch) {
          const code = codeMatch[1];
          // Buscar en todas las categorías de errores
          for (const category of Object.values(ERROR_MESSAGES)) {
            if (category[code]) {
              return category[code];
            }
          }
        }

        // Si no hay código coincidente, devolver el detail completo
        return errorData.detail;
      }

      // Si tiene un campo message
      if (errorData.message) {
        return errorData.message;
      }
    }

    // Si no hay estructura conocida de error, devolver el mensaje general
    if (error.message) {
      return error.message;
    }

    return DEFAULT_ERROR_MESSAGE;
  } catch (e) {
    console.error("Error al traducir el error:", e);
    return DEFAULT_ERROR_MESSAGE;
  }
};
