import { useAuth } from './useAuth';
import { checkRole, checkBranch } from '../utils/authorization';

export const useAuthorization = () => {
  const { user } = useAuth();

  const hasRole = (role) => {
    const result = checkRole(user, role);
    console.log(`[Authorization] hasRole('${role}') with user.role='${user?.role}' => ${result}`);
    return result;
  };

  const hasAnyRole = (roles) => {
    return roles.some((role) => checkRole(user, role));
  };

  const hasAllRoles = (roles) => {
    return roles.every((role) => checkRole(user, role));
  };

  const canAccessBranch = (branchId) => {
    return checkBranch(user, branchId);
  };

  const hasPermission = (permission) => {
    // Formato: 'resource:action' o 'resource:action:branch'
    const [resource, action, branch] = permission.split(':');

    // Verificar si el usuario tiene la acción sobre el recurso
    const hasResourcePermission = user?.permissions?.includes(`${resource}:${action}`);

    if (!hasResourcePermission) {
      return false;
    }

    // Si especifica branch, verificar acceso a esa sede
    if (branch) {
      return checkBranch(user, branch);
    }

    return true;
  };

  return {
    hasRole,
    hasAnyRole,
    hasAllRoles,
    canAccessBranch,
    hasPermission,
  };
};
