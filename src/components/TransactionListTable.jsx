import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Spinner, Button, Form, Row, Col } from 'react-bootstrap';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useAuth } from '../hooks/useAuth';
import { useBranchSelection } from '../hooks/useBranchSelection';
import { branchService } from '../services/branchService';
import { userService } from '../services/userService';
import { itemService } from '../services/itemService';
import { formatDecimal, formatUnit } from '../utils/formatters';

const DEFAULT_FILTERS = {
  search: '',
  branch_id: '',
  performed_by: '',
  item_id: '',
  operation_type: '',
  status: '',
  start_date: '',
  end_date: '',
  order_by: 'created_at',
  order_desc: 'true',
};

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

const OPERATION_TYPE_LABELS = {
  IN: 'Entrada',
  OUT: 'Salida',
  TRANSFER: 'Transferencia',
  ADJUSTMENT: 'Ajuste',
};

const STATUS_LABELS = {
  PENDING: 'Pendiente',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
};

const STATUS_BADGE_CLASSES = {
  PENDING: 'bg-warning text-dark',
  COMPLETED: 'bg-success',
  CANCELLED: 'bg-secondary',
};

export const TransactionListTable = ({
  transactions = [],
  loading,
  error,
  pagination = {},
  initialQuery = {},
  onFetchTransactions = () => {},
}) => {
  const { user } = useAuth();
  const { selectedBranchId } = useBranchSelection();
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(false);
  const [catalogError, setCatalogError] = useState(null);
  const inputControlStyle = { minHeight: '38px' };
  const selectControlStyle = { height: '46px' };
  const filterButtonStyle = { height: '46px', padding: '0 1rem' };
  const sortDirectionButtonStyle = {
    width: '46px',
    height: '46px',
    padding: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '10px',
    fontSize: '1.1rem',
    lineHeight: 1,
  };

  const resolvedBranchId = useMemo(() => {
    if (user?.branch_id) return String(user.branch_id);
    if (selectedBranchId) return String(selectedBranchId);
    return '';
  }, [selectedBranchId, user?.branch_id]);

  const [filters, setFilters] = useState(() => normalizeFiltersFromQuery(initialQuery, resolvedBranchId));

  const itemsById = useMemo(() => {
    const lookup = new Map();
    items.forEach((item) => {
      lookup.set(Number(item.id), item);
    });
    return lookup;
  }, [items]);

  const branchesById = useMemo(() => {
    const lookup = new Map();
    branches.forEach((branch) => {
      lookup.set(Number(branch.id), branch.name);
    });
    return lookup;
  }, [branches]);

  const defaultFilters = useMemo(() => ({
    ...DEFAULT_FILTERS,
    branch_id: user?.branch_id ? String(user.branch_id) : (selectedBranchId ? String(selectedBranchId) : ''),
  }), [selectedBranchId, user?.branch_id]);

  useEffect(() => {
    setFilters(normalizeFiltersFromQuery(initialQuery, resolvedBranchId));
  }, [initialQuery, resolvedBranchId]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const buildFetchPayload = ({ page = 1, sourceFilters = filters } = {}) => {
    const payload = {
      page,
      pageSize: Number(initialQuery?.pageSize) || Number(pagination?.pageSize) || 20,
      order_by: sourceFilters.order_by,
      order_desc: sourceFilters.order_desc === 'true',
    };

    if (sourceFilters.search.trim()) payload.search = sourceFilters.search.trim();
    if (sourceFilters.branch_id !== '') payload.branch_id = Number(sourceFilters.branch_id);
    if (sourceFilters.performed_by !== '') payload.performed_by = Number(sourceFilters.performed_by);
    if (sourceFilters.item_id !== '') payload.item_id = Number(sourceFilters.item_id);
    if (sourceFilters.operation_type) payload.operation_type = sourceFilters.operation_type;
    if (sourceFilters.status) payload.status = sourceFilters.status;
    if (sourceFilters.start_date) payload.start_date = sourceFilters.start_date;
    if (sourceFilters.end_date) payload.end_date = sourceFilters.end_date;

    return payload;
  };

  const handleApplyFilters = () => {
    onFetchTransactions(buildFetchPayload({ page: 1 }));
  };

  const handleResetFilters = () => {
    setFilters(defaultFilters);
    onFetchTransactions({
      page: 1,
      pageSize: Number(initialQuery?.pageSize) || Number(pagination?.pageSize) || 20,
      order_by: 'created_at',
      order_desc: true,
      ...(defaultFilters.branch_id ? { branch_id: Number(defaultFilters.branch_id) } : {}),
    });
  };

  const handleToggleOrderDirection = () => {
    const nextOrderDesc = filters.order_desc === 'true' ? 'false' : 'true';
    const nextFilters = {
      ...filters,
      order_desc: nextOrderDesc,
    };

    setFilters(nextFilters);
    onFetchTransactions(buildFetchPayload({
      page: pagination?.page || 1,
      sourceFilters: nextFilters,
    }));
  };

  const formatTransactionDateTime = (value) => {
    if (!value) return '-';
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return '-';

    return parsedDate.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const cropDescription = (description) => {
    if (!description) return '-';
    const maxLength = 80;
    if (description.length <= maxLength) return description;
    return `${description.slice(0, maxLength)}…`;
  };

  const getOperationTypeLabel = (operationType) => {
    return OPERATION_TYPE_LABELS[operationType] || operationType || '-';
  };

  const getStatusLabel = (status) => {
    return STATUS_LABELS[status] || status || '-';
  };

  const getStatusBadgeClassName = (status) => {
    return STATUS_BADGE_CLASSES[status] || 'bg-secondary';
  };

  const getBranchName = (transaction) => {
    const branchId = Number(transaction?.branch_id);
    if (!branchId) return '-';
    return branchesById.get(branchId) || `Sede #${branchId}`;
  };

  const renderLinesTooltip = (transaction) => {
    const lines = Array.isArray(transaction?.lines) ? transaction.lines : [];

    return (
      <Tooltip id={`transaction-lines-tooltip-${transaction.id}`}>
        <div className="text-start" style={{ fontSize: '0.95rem', lineHeight: '1.35' }}>
          <div className="fw-semibold mb-1">Detalle de líneas</div>
          {lines.length > 0 ? (
            lines.map((line) => {
              const item = itemsById.get(Number(line.item_id));
              const itemName = item?.name || `Artículo #${line.item_id}`;
              const formattedQuantity = formatDecimal(line.quantity);
              const formattedUnit = item?.unit ? formatUnit(item.unit) : '-';

              return (
                <div key={line.id || `${transaction.id}-${line.item_id}`}>
                  <strong>{itemName}:</strong> {formattedQuantity} {formattedUnit}
                </div>
              );
            })
          ) : (
            <div>Sin líneas</div>
          )}
        </div>
      </Tooltip>
    );
  };

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

      <div className="border rounded p-3 mb-3 bg-light">
        <Row className="g-3 align-items-end">
          <Col md={3}>
            <Form.Group>
              <Form.Label>Buscar</Form.Label>
              <Form.Control
                type="text"
                name="search"
                placeholder="Nombre o SKU de artículo"
                value={filters.search}
                onChange={handleFilterChange}
                style={inputControlStyle}
              />
            </Form.Group>
          </Col>

          {!user?.branch_id && (
            <Col md={2}>
              <Form.Group>
                <Form.Label>Sede</Form.Label>
                <Form.Select
                  name="branch_id"
                  value={filters.branch_id}
                  onChange={handleFilterChange}
                  style={selectControlStyle}
                >
                  <option value="">Todas</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          )}

          <Col md={2}>
            <Form.Group>
              <Form.Label>Usuario</Form.Label>
              <Form.Select
                name="performed_by"
                value={filters.performed_by}
                onChange={handleFilterChange}
                style={selectControlStyle}
              >
                <option value="">Todos</option>
                {users.map((currentUser) => (
                  <option key={currentUser.id} value={currentUser.id}>
                    {currentUser.name || currentUser.username}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={2}>
            <Form.Group>
              <Form.Label>Artículo</Form.Label>
              <Form.Select
                name="item_id"
                value={filters.item_id}
                onChange={handleFilterChange}
                style={selectControlStyle}
              >
                <option value="">Todos</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.sku})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={2}>
            <Form.Group>
              <Form.Label>Tipo</Form.Label>
              <Form.Select
                name="operation_type"
                value={filters.operation_type}
                onChange={handleFilterChange}
                style={selectControlStyle}
              >
                <option value="">Todos</option>
                <option value="IN">Entrada</option>
                <option value="OUT">Salida</option>
                <option value="TRANSFER">Transferencia</option>
                <option value="ADJUSTMENT">Ajuste</option>
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={1}>
            <Form.Group>
              <Form.Label>Estado</Form.Label>
              <Form.Select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                style={selectControlStyle}
              >
                <option value="">Todos</option>
                <option value="PENDING">Pendiente</option>
                <option value="COMPLETED">Completada</option>
                <option value="CANCELLED">Cancelada</option>
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={2}>
            <Form.Group>
              <Form.Label>Fecha inicio</Form.Label>
              <Form.Control
                type="date"
                name="start_date"
                value={filters.start_date}
                onChange={handleFilterChange}
                style={inputControlStyle}
              />
            </Form.Group>
          </Col>

          <Col md={2}>
            <Form.Group>
              <Form.Label>Fecha fin</Form.Label>
              <Form.Control
                type="date"
                name="end_date"
                value={filters.end_date}
                onChange={handleFilterChange}
                style={inputControlStyle}
              />
            </Form.Group>
          </Col>

          <Col md={2}>
            <Form.Group>
              <Form.Label>Ordenar por</Form.Label>
              <Form.Select
                name="order_by"
                value={filters.order_by}
                onChange={handleFilterChange}
                style={selectControlStyle}
              >
                <option value="created_at">Fecha creación</option>
                <option value="total_items">Número de líneas</option>
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={1} className="d-flex justify-content-start">
            <Form.Group>
              <Button
                variant="outline-secondary"
                onClick={handleToggleOrderDirection}
                style={sortDirectionButtonStyle}
                title={filters.order_desc === 'true' ? 'Descendente' : 'Ascendente'}
              >
                {filters.order_desc === 'true' ? '↓' : '↑'}
              </Button>
            </Form.Group>
          </Col>

          <Col md={3} className="d-flex gap-2 align-items-end">
            <Button variant="primary" onClick={handleApplyFilters} style={filterButtonStyle}>
              Aplicar
            </Button>
            <Button variant="outline-secondary" onClick={handleResetFilters} style={filterButtonStyle}>
              Limpiar
            </Button>
          </Col>
        </Row>
      </div>

      <p className="text-muted">
        Mostrando {transactions.length} de {pagination.total || 0} operaciones
      </p>

      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Sede</th>
              <th>Fecha y hora</th>
              <th>Descripción</th>
              <th className="text-center">Nº líneas</th>
              <th className="text-center">Estado</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center text-muted py-4">
                  No hay operaciones disponibles
                </td>
              </tr>
            ) : (
              transactions.map((transaction) => {
                const linesCount = Array.isArray(transaction.lines) ? transaction.lines.length : 0;

                return (
                  <tr key={transaction.id}>
                    <td>{getOperationTypeLabel(transaction.operation_type)}</td>
                    <td>{getBranchName(transaction)}</td>
                    <td>{formatTransactionDateTime(transaction.created_at)}</td>
                    <td>{cropDescription(transaction.description)}</td>
                    <td className="text-center">
                      <OverlayTrigger trigger={['hover', 'focus']} placement="top" overlay={renderLinesTooltip(transaction)}>
                        <span style={{ textDecoration: 'underline dotted' }}>
                          {linesCount}
                        </span>
                      </OverlayTrigger>
                    </td>
                    <td className="text-center">
                      <span className={`badge ${getStatusBadgeClassName(transaction.status)}`}>
                        {getStatusLabel(transaction.status)}
                      </span>
                    </td>
                    <td className="text-center">-</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionListTable;
