import { useMemo } from 'react';
import { useAuth } from './useAuth';

/**
 * Función pura que determina los permisos basada en el permission_spec del backend.
 * Puede usarse tanto en hooks como en funciones puras.
 */
export const getTransactionPermissions = (user, transaction) => {
  if (!transaction || !user) {
    return {
      canComplete: false,
      canCancel: false,
      canEdit: false,
      canUploadDocument: false,
      canDeleteDocument: false,
      canDownloadDocument: false,
    };
  }

  const userRole = String(user.role || '').toUpperCase();
  const userBranchId = user.branch_id ? Number(user.branch_id) : null;
  const isCentralUser = userBranchId === null;

  const transactionStatus = transaction.status;
  const operationType = transaction.operation_type;
  const originBranchId = Number(transaction.branch_id);
  const destinationBranchId = Number(transaction.destination_branch_id);

  const events = Array.isArray(transaction.events) ? transaction.events : [];
  const hasCurrentUserEvent = (allowedActionTypes) => {
    const allowedSet = new Set(allowedActionTypes);

    return events.some((event) => {
      const actionType = String(event?.action_type || '').toUpperCase();
      const performedBy = Number(event?.performed_by);
      return allowedSet.has(actionType) && performedBy > 0 && performedBy === Number(user.id);
    });
  };

  // Helper: verificar si el usuario pertenece a una rama para esta transacción
  const belongsToOriginBranch = userBranchId === originBranchId;
  const belongsToDestinationBranch = operationType === 'TRANSFER' && userBranchId === destinationBranchId;

  // ========== COMPLETE ACTION ==========
  const canComplete = (() => {
    // Solo en PENDING o TRANSIT
    if (transactionStatus !== 'PENDING' && transactionStatus !== 'TRANSIT') {
      return false;
    }

    // TRANSFER en PENDING: solo sede origen o central
    if (operationType === 'TRANSFER' && transactionStatus === 'PENDING') {
      return isCentralUser || belongsToOriginBranch;
    }

    // TRANSFER en TRANSIT: solo sede destino o central
    if (operationType === 'TRANSFER' && transactionStatus === 'TRANSIT') {
      return isCentralUser || belongsToDestinationBranch;
    }

    // No-TRANSFER: solo sede origen o central
    return isCentralUser || belongsToOriginBranch;
  })();

  // ========== CANCEL ACTION ==========
  const canCancel = (() => {
    // Solo en PENDING o TRANSIT
    if (transactionStatus !== 'PENDING' && transactionStatus !== 'TRANSIT') {
      return false;
    }

    // TRANSFER en PENDING: solo sede origen o central
    if (operationType === 'TRANSFER' && transactionStatus === 'PENDING') {
      return isCentralUser || belongsToOriginBranch;
    }

    // TRANSFER en TRANSIT: solo sede destino o central
    if (operationType === 'TRANSFER' && transactionStatus === 'TRANSIT') {
      return isCentralUser || belongsToDestinationBranch;
    }

    // No-TRANSFER (tanto PENDING como TRANSIT): solo sede origen o central
    return isCentralUser || belongsToOriginBranch;
  })();

  // ========== EDIT ACTION ==========
  const canEdit = (() => {
    if (transactionStatus !== 'PENDING') {
      return false;
    }

    // Branch rules: cualquier rol, sede origen o central
    return isCentralUser || belongsToOriginBranch;
  })();

  // ========== DOCUMENT ACTIONS ==========
  const canUploadDocument = (() => {
    // PENDING: sede origen o central
    if (transactionStatus === 'PENDING') {
      return isCentralUser || belongsToOriginBranch;
    }

    // TRANSIT: sede origen, destino o central
    if (transactionStatus === 'TRANSIT') {
      return isCentralUser || belongsToOriginBranch || belongsToDestinationBranch;
    }

    // COMPLETED/CANCELLED: reglas especiales por rol
    if (transactionStatus === 'COMPLETED' || transactionStatus === 'CANCELLED') {
      // ADMIN: solo si es central
      if (userRole === 'ADMIN') {
        return isCentralUser;
      }

      // MANAGER: si es central O si pertenece a sede origen/destino
      if (userRole === 'MANAGER') {
        return isCentralUser || belongsToOriginBranch || belongsToDestinationBranch;
      }

      // EMPLOYEE:
      // - sede origen: debe estar asociado a CREATED/SENT/COMPLETED/CANCELLED
      // - sede destino: debe estar asociado a COMPLETED/CANCELLED
      if (userRole === 'EMPLOYEE') {
        if (belongsToOriginBranch) {
          return hasCurrentUserEvent(['CREATED', 'SENT', 'COMPLETED', 'CANCELLED']);
        }

        if (belongsToDestinationBranch) {
          return hasCurrentUserEvent(['COMPLETED', 'CANCELLED']);
        }

        return false;
      }
    }

    return false;
  })();

  const canDeleteDocument = canUploadDocument; // Mismas reglas que upload

  const canDownloadDocument = (() => {
    // GET /transactions/{transaction_id}/document - sin restricción por estado
    // Branch rules: sede origen, destino (si TRANSFER), o central
    return isCentralUser || belongsToOriginBranch || belongsToDestinationBranch;
  })();

  return {
    canComplete,
    canCancel,
    canEdit,
    canUploadDocument,
    canDeleteDocument,
    canDownloadDocument,
  };
};

/**
 * Hook para determinar permisos de transacciones basado en el permission_spec
 * del backend.
 *
 * Retorna funciones para validar cada tipo de acción según:
 * - Rol del usuario (ADMIN, MANAGER, EMPLOYEE)
 * - Rama del usuario (null = central, number = branch_user)
 * - Estado de la transacción (PENDING, TRANSIT, COMPLETED, CANCELLED)
 * - Tipo de operación (IN, OUT, TRANSFER, ADJUSTMENT)
 * - Rama origen/destino
 * - Eventos de la transacción (para determinar quién creó)
 */
export const useTransactionPermissions = (transaction) => {
  const { user } = useAuth();

  const permissions = useMemo(
    () => getTransactionPermissions(user, transaction),
    [user, transaction],
  );

  return permissions;
};
