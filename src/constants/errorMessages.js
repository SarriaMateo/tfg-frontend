export const ERROR_MESSAGES = {
  validation_errors: {
    NAME_TOO_SHORT: "El nombre debe tener al menos 3 caracteres",
    NAME_TOO_LONG: "El nombre no puede exceder 50 caracteres",
    INVALID_NIF_FORMAT: "El NIF tiene un formato inválido",
    EMAIL_TOO_LONG: "El email no puede exceder 50 caracteres",
    INVALID_EMAIL_FORMAT: "El email tiene un formato inválido",
    USERNAME_TOO_SHORT: "El nombre de usuario debe tener al menos 3 caracteres",
    USERNAME_TOO_LONG: "El nombre de usuario no puede exceder 50 caracteres",
    USERNAME_CONTAINS_SPACES: "El nombre de usuario no puede contener espacios",
    USERNAME_INVALID_CHARACTERS: "El nombre de usuario solo puede contener letras, números, puntos, guiones e guiones bajos",
    INVALID_USERNAME_FORMAT: "El nombre de usuario tiene un formato inválido",
    PASSWORD_TOO_SHORT: "La contraseña debe tener al menos 8 caracteres",
    PASSWORD_TOO_LONG: "La contraseña no puede exceder 72 caracteres",
    INVALID_PASSWORD_FORMAT: "La contraseña debe tener entre 8 y 72 caracteres",
  },
  business_logic_errors: {
    COMPANY_EMAIL_ALREADY_EXISTS: "El email de la empresa ya está en uso",
    COMPANY_NIF_ALREADY_EXISTS: "El NIF ya está registrado",
    USERNAME_ALREADY_EXISTS: "El nombre de usuario ya está en uso",
  },
  auth_errors: {
    INVALID_CREDENTIALS: "Credenciales inválidas",
  },
  authorization_errors: {
    INSUFFICIENT_ROLE: "Rol insuficiente",
    BRANCH_ACCESS_DENIED: "Acceso a la sede denegado",
    COMPANY_ACCESS_DENIED: "Acceso a la empresa denegado",
  },
  resource_not_found_errors: {
    COMPANY_NOT_FOUND: "Empresa no encontrada",
    BRANCH_NOT_FOUND: "Sede no encontrada",
  },
};

export const DEFAULT_ERROR_MESSAGE = "Ha ocurrido un error inesperado. Por favor, intenta de nuevo.";
