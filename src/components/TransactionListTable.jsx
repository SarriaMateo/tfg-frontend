import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../hooks/useAuth';
import { useBranchSelection } from '../hooks/useBranchSelection';
import { branchService } from '../services/branchService';
import { userService } from '../services/userService';
import { itemService } from '../services/itemService';

const normalizeArrayResponse = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const normalizeFiltersFromQuery = (query = {}, fallbackBranchId = '') => ({
  search: query.search || '',
  branch_id: query.branch_id === undefined ? fallbackBranchId : String(query.branch_id),
  performed_by: query.performed_by === undefined ? '' : String(query.performed_by),
  item_id: query.item_id === undefined ? '' : String(query.item_id),
  operation_type: query.operation_type || '',
  status: query.status || '',
  start_date: query.start_date || '',
  end_date: query.end_date || '',
  order_by: query.order_by || 'created_at',
  order_desc: String(query.order_desc ?? true),
});

export const TransactionListTable = ({
  transactions = [],
  loading,
  error,
  pagination = {},
  initialQuery = {},
}) => {
  const { user } = useAuth();
  const { selectedBranchId } = useBranchSelection();
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(false);
  const [catalogError, setCatalogError] = useState(null);

  const resolvedBranchId = useMemo(() => {
    if (user?.branch_id) return String(user.branch_id);
    if (selectedBranchId) return String(selectedBranchId);
    return '';
  }, [selectedBranchId, user?.branch_id]);

  const [filters, setFilters] = useState(() => normalizeFiltersFromQuery(initialQuery, resolvedBranchId));

  useEffect(() => {
    setFilters(normalizeFiltersFromQuery(initialQuery, resolvedBranchId));
  }, [initialQuery, resolvedBranchId]);

  useEffect(() => {
    const loadFilterCatalogs = async () => {
      setLoadingCatalogs(true);
      setCatalogError(null);

      try {
        const [branchesResponse, usersResponse, itemsResponse] = await Promise.all([
          branchService.getBranches({ is_active: true }),
          userService.getUsersByCompany({ is_active: true }),
          itemService.listItems({ is_active: true, page_size: 100 }),
        ]);

        setBranches(normalizeArrayResponse(branchesResponse));
        setUsers(normalizeArrayResponse(usersResponse));
        setItems(normalizeArrayResponse(itemsResponse));
      } catch {
        setBranches([]);
        setUsers([]);
        setItems([]);
        setCatalogError('No se pudieron cargar los catálogos de filtros.');
      } finally {
        setLoadingCatalogs(false);
      }
    };

    loadFilterCatalogs();
  }, []);

  if (loading || loadingCatalogs) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
        <div className="text-muted mt-3">Preparando operaciones y catálogos de filtros...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        {error}
      </Alert>
    );
  }

  return (
    <div className="mb-3">
      {catalogError && (
        <Alert variant="warning" className="mb-3">
          {catalogError}
        </Alert>
      )}

      <Alert variant="secondary" className="mb-0">
        <div className="fw-semibold mb-2">Base del módulo de operaciones preparada</div>
        <div className="small">
          <div>Operaciones cargadas: {transactions.length} de {pagination.total || 0}</div>
          <div>Filtro de sede resuelto: {filters.branch_id || 'sin sede seleccionada'}</div>
          <div>Catálogos activos: {branches.length} sedes, {users.length} usuarios y {items.length} artículos</div>
          <div className="mt-2">En la siguiente etapa se añadirá la barra de filtros y ordenación.</div>
        </div>
      </Alert>
    </div>
  );
};

export default TransactionListTable;
