/**
 * Valida si un usuario tiene un rol específico
 * @param {Object} user - Objeto del usuario
 * @param {string} role - Rol a verificar (ADMIN, MANAGER, EMPLOYEE)
 * @returns {boolean}
 */
export const checkRole = (user, role) => {
  if (!user || !user.role) return false;
  // Normalize both to uppercase for comparison
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

  // If user has no branch_id, they have access to all branches
  if (!user.branch_id) return true;

  // If user has branch_id, they can only access their branch
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

  // Admin can do anything on any branch
  if (user.role === 'ADMIN') return true;

  // Manager can perform actions on their branch or all branches if none assigned
  if (user.role === 'MANAGER') {
    if (branchId) {
      return checkBranch(user, branchId);
    }
    return true;
  }

  // Employee has limited permissions
  if (user.role === 'EMPLOYEE') {
    // Can only access actions on their branch
    if (branchId) {
      return checkBranch(user, branchId);
    }
    // If no branch is specified, can only read
    return action === 'read';
  }

  return false;
};

/**
 * Gets the access level of a user (0 = no access, 1 = read, 2 = write, 3 = admin)
 * @param {Object} user - User object
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
