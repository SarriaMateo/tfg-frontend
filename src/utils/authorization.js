/**
 * Valida si un usuario tiene un rol específico
 * @param {Object} user - Objeto del usuario
 * @param {string} role - Rol a verificar (ADMIN, MANAGER, EMPLOYEE)
 * @returns {boolean}
 */
export const checkRole = (user, role) => {
  if (!user || !user.role) return false;
  // Normalizar ambos a mayúsculas para la comparación
  const userRole = typeof user.role === 'string' ? user.role.toUpperCase() : user.role;
  const targetRole = typeof role === 'string' ? role.toUpperCase() : role;
  return userRole === targetRole;
};

/**
 * Valida si un usuario tiene acceso a una sede específica
 * Si el usuario no tiene branch_id asociado, tiene acceso a todas las sedes
 * @param {Object} user - Objeto del usuario
 * @param {number|string} branchId - ID de la sede a verificar
 * @returns {boolean}
 */
export const checkBranch = (user, branchId) => {
  if (!user) return false;

  // Si no tiene branch_id, tiene acceso a todas las sedes
  if (!user.branch_id) return true;

  // Si tiene branch_id, solo puede acceder a su sede
  return user.branch_id === parseInt(branchId);
};

/**
 * Valida si un usuario tiene acceso a un recurso basado en su rol
 * @param {Object} user - Objeto del usuario
 * @param {string} action - Acción a realizar (create, read, update, delete)
 * @param {number|string} branchId - ID de la sede (opcional)
 * @returns {boolean}
 */
export const canPerformAction = (user, action, branchId = null) => {
  if (!user) return false;

  // Admin puede hacer cualquier cosa en cualquier sede
  if (user.role === 'ADMIN') return true;

  // Manager puede hacer acciones en su sede o en todas si no tiene sede asignada
  if (user.role === 'MANAGER') {
    if (branchId) {
      return checkBranch(user, branchId);
    }
    return true;
  }

  // Employee tiene permisos limitados
  if (user.role === 'EMPLOYEE') {
    // Solo puede acceder a acciones en su sede
    if (branchId) {
      return checkBranch(user, branchId);
    }
    // Si no especifica sede, solo puede hacer read
    return action === 'read';
  }

  return false;
};

/**
 * Obtiene el nivel de acceso de un usuario (0 = sin acceso, 1 = lectura, 2 = escritura, 3 = admin)
 * @param {Object} user - Objeto del usuario
 * @returns {number}
 */
export const getAccessLevel = (user) => {
  if (!user) return 0;
  switch (user.role) {
    case 'ADMIN':
      return 3;
    case 'MANAGER':
      return 2;
    case 'EMPLOYEE':
      return 1;
    default:
      return 0;
  }
};

/**
 * Valida si el usuario es administrador
 * @param {Object} user - Objeto del usuario
 * @returns {boolean}
 */
export const isAdmin = (user) => checkRole(user, 'ADMIN');

/**
 * Valida si el usuario es manager
 * @param {Object} user - Objeto del usuario
 * @returns {boolean}
 */
export const isManager = (user) => checkRole(user, 'MANAGER');

/**
 * Valida si el usuario es employee
 * @param {Object} user - Objeto del usuario
 * @returns {boolean}
 */
export const isEmployee = (user) => checkRole(user, 'EMPLOYEE');
