import { ERROR_MESSAGES, DEFAULT_ERROR_MESSAGE } from "../constants/errorMessages";

/**
 * Translates backend error codes to error messages in Spanish
 * @param {Object} error - Error object from axios or similar
 * @returns {string} - Translated error message
 */
export const translateError = (error) => {
  try {
    // Check if it's an error with response from the backend
    if (error.response?.data) {
      const errorData = error.response.data;

      // If the backend returns a code in the 'code' field
      if (errorData.code) {
        // Search in all error categories
        for (const category of Object.values(ERROR_MESSAGES)) {
          if (category[errorData.code]) {
            return category[errorData.code];
          }
        }
      }

      // If the backend returns a detail
      if (typeof errorData.detail === "string") {
        // First, try to find the complete detail as code in all categories
        for (const category of Object.values(ERROR_MESSAGES)) {
          if (category[errorData.detail]) {
            return category[errorData.detail];
          }
        }

        // If it doesn't match directly, try to extract code from format "CODE: message"
        const codeMatch = errorData.detail.match(/^([A-Z_]+):/);
        if (codeMatch) {
          const code = codeMatch[1];
          // Search in all error categories
          for (const category of Object.values(ERROR_MESSAGES)) {
            if (category[code]) {
              return category[code];
            }
          }
        }

        // If no matching code, return the complete detail
        return errorData.detail;
      }

      // If it has a message field
      if (errorData.message) {
        return errorData.message;
      }
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
