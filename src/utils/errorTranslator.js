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
        // Buscar en validation_errors
        if (ERROR_MESSAGES.validation_errors[errorData.code]) {
          return ERROR_MESSAGES.validation_errors[errorData.code];
        }
        // Buscar en business_logic_errors
        if (ERROR_MESSAGES.business_logic_errors[errorData.code]) {
          return ERROR_MESSAGES.business_logic_errors[errorData.code];
        }
      }

      // Si el backend devuelve un detail
      if (typeof errorData.detail === "string") {
        // Primero, intentar buscar el detail completo como código
        if (ERROR_MESSAGES.validation_errors[errorData.detail]) {
          return ERROR_MESSAGES.validation_errors[errorData.detail];
        }
        if (ERROR_MESSAGES.business_logic_errors[errorData.detail]) {
          return ERROR_MESSAGES.business_logic_errors[errorData.detail];
        }

        // Si no coincide directamente, intentar extraer código del formato "CODE: message"
        const codeMatch = errorData.detail.match(/^([A-Z_]+):/);
        if (codeMatch) {
          const code = codeMatch[1];
          // Buscar en validation_errors
          if (ERROR_MESSAGES.validation_errors[code]) {
            return ERROR_MESSAGES.validation_errors[code];
          }
          // Buscar en business_logic_errors
          if (ERROR_MESSAGES.business_logic_errors[code]) {
            return ERROR_MESSAGES.business_logic_errors[code];
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
