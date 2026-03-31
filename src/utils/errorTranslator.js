import { ERROR_MESSAGES, DEFAULT_ERROR_MESSAGE } from "../constants/errorMessages";

/**
 * Translates backend error codes to error messages in Spanish
 * @param {Object} error - Error object from axios or similar
 * @returns {string} - Translated error message
 */
export const translateError = (error) => {
  try {
    const getDynamicMessage = (code) => {
      if (!code || typeof code !== "string") return null;

      const stockByItemPrefix = "INSUFFICIENT_STOCK_FOR_ITEM_";
      if (code.startsWith(stockByItemPrefix)) {
        const itemSku = code.slice(stockByItemPrefix.length).trim();
        if (itemSku) {
          return `Stock insuficiente para el artículo ${itemSku}`;
        }
        return "Stock insuficiente para completar esta operación de salida";
      }

      return null;
    };

    const findCodeMessage = (code) => {
      if (!code) return null;
      const dynamicMessage = getDynamicMessage(code);
      if (dynamicMessage) return dynamicMessage;
      for (const category of Object.values(ERROR_MESSAGES)) {
        if (category[code]) return category[code];
      }
      return null;
    };

    // Check if it's an error with response from the backend
    if (error.response?.data) {
      const errorData = error.response.data;

      // If the backend returns a code in the 'code' field
      if (errorData.code) {
        const translatedCode = findCodeMessage(errorData.code);
        if (translatedCode) return translatedCode;
      }

      // If the backend returns a detail
      if (typeof errorData.detail === "string") {
        const translatedDetail = findCodeMessage(errorData.detail);
        if (translatedDetail) return translatedDetail;

        // If it doesn't match directly, try to extract code from format "CODE: message"
        const codeMatch = errorData.detail.match(/^([A-Z0-9_-]+):/);
        if (codeMatch) {
          const translatedDetailCode = findCodeMessage(codeMatch[1]);
          if (translatedDetailCode) return translatedDetailCode;
        }

        // If no matching code, return the complete detail
        return errorData.detail;
      }

      // If it has a message field
      if (errorData.message) {
        return errorData.message;
      }
    }

    // Try HTTP status-based mappings if they exist in error messages
    if (error.response?.status) {
      const httpCode = `HTTP_${error.response.status}`;
      const translatedHttpCode = findCodeMessage(httpCode) || findCodeMessage(String(error.response.status));
      if (translatedHttpCode) return translatedHttpCode;
    }

    // If there's no known error structure, return the general message
    if (error.message) {
      return error.message;
    }

    return DEFAULT_ERROR_MESSAGE;
  } catch (e) {
    console.error("Error translating error:", e);
    return DEFAULT_ERROR_MESSAGE;
  }
};
