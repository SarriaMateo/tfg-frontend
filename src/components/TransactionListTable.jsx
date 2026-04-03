import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Spinner, Button, Form, Row, Col, Pagination, Modal } from 'react-bootstrap';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { BsArrowLeftRight, BsCheckSquare, BsDownload, BsFiletypeCsv, BsFiletypePdf, BsFillTrash3Fill, BsGear, BsInfoCircle, BsUpload, BsSortUp, BsSortDown } from 'react-icons/bs';
import { handleNavigationClick } from '../utils/navigationUtils';
import { ConfirmDialog } from './ConfirmDialog';
import { useAuth } from '../hooks/useAuth';
import { useBranchSelection } from '../hooks/useBranchSelection';
import { getTransactionPermissions } from '../hooks/useTransactionPermissions';
import { branchService } from '../services/branchService';
import { userService } from '../services/userService';
import { itemService } from '../services/itemService';
import { transactionService } from '../services/transactionService';
import { translateError } from '../utils/errorTranslator';
import { formatDecimal, formatUnit } from '../utils/formatters';

const DEFAULT_ORDER_BY = 'last_event_at';

const normalizeOrderBy = (orderByValue) => {
  if (orderByValue === 'total_items') return 'total_items';
  if (orderByValue === 'created_at') return DEFAULT_ORDER_BY;
  if (orderByValue === DEFAULT_ORDER_BY) return DEFAULT_ORDER_BY;
  return DEFAULT_ORDER_BY;
};

const DEFAULT_FILTERS = {
  search: '',
  branch_id: '',
  performed_by: '',
  item_id: '',
  operation_type: '',
  status: '',
  start_date: '',
  end_date: '',
  order_by: DEFAULT_ORDER_BY,
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
  order_by: normalizeOrderBy(query.order_by),
  order_desc: String(query.order_desc ?? true),
});

const OPERATION_TYPE_LABELS = {
  IN: 'Entrada',
  OUT: 'Salida',
  TRANSFER: 'Traspaso',
  ADJUSTMENT: 'Ajuste',
};

const STATUS_LABELS = {
  PENDING: 'Pendiente',
  TRANSIT: 'En tránsito',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
};

const STATUS_BADGE_CLASSES = {
  PENDING: 'bg-warning text-dark',
  TRANSIT: 'bg-info text-dark',
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
  onCompleteTransaction = null,
  onCancelTransaction = null,
  actionLoading = false,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedBranchId } = useBranchSelection();
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(false);
  const [catalogError, setCatalogError] = useState(null);
  const [pageSize, setPageSize] = useState(() => Number(initialQuery?.pageSize) || 20);

  // Action confirmation dialogs
  const [confirmComplete, setConfirmComplete] = useState(null); // transaction object
  const [confirmCancel, setConfirmCancel] = useState(null);     // transaction object
  const [cancelReason, setCancelReason] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportCount, setExportCount] = useState(0);
  const [loadingExportCount, setLoadingExportCount] = useState(false);
  const [exportModalError, setExportModalError] = useState(null);
  const [exportingFormat, setExportingFormat] = useState(null);

  const canExportTransactions = ['ADMIN', 'MANAGER'].includes(String(user?.role || '').toUpperCase());
  const isExporting = exportingFormat !== null;
  const canSubmitExport = !loadingExportCount && !isExporting && exportCount > 0;

  const handleOpenComplete = (transaction) => setConfirmComplete(transaction);
  const handleConfirmComplete = () => {
    if (onCompleteTransaction) onCompleteTransaction(confirmComplete.id);
    setConfirmComplete(null);
  };

  const handleOpenCancel = (transaction) => {
    setCancelReason('');
    setConfirmCancel(transaction);
  };

  const buildListRequestParams = (sourcePayload = {}) => {
    const { pageSize, ...rest } = sourcePayload;
    return {
      ...rest,
      page_size: Number(pageSize) || 1,
    };
  };

  const buildExportPayload = (format) => {
    const fetchPayload = buildFetchPayload({
      page: 1,
      nextPageSize: 1,
    });

    const filtersPayload = { ...fetchPayload };
    delete filtersPayload.page;
    delete filtersPayload.pageSize;

    return {
      ...filtersPayload,
      format,
    };
  };

  const handleExportClick = async () => {
    if (loadingExportCount || isExporting) return;

    setShowExportModal(true);
    setExportModalError(null);
    setLoadingExportCount(true);

    try {
      const countPayload = buildFetchPayload({
        page: 1,
        nextPageSize: 1,
      });

      const response = await transactionService.listTransactions(buildListRequestParams(countPayload));
      const resolvedCount = Number(response?.total ?? 0);
      setExportCount(Number.isNaN(resolvedCount) ? 0 : resolvedCount);
    } catch (err) {
      setExportCount(0);
      setExportModalError(translateError(err));
    } finally {
      setLoadingExportCount(false);
    }
  };

  const handleExportByFormat = async (format) => {
    if (!canSubmitExport) return;

    setExportModalError(null);
    setExportingFormat(format);

    try {
      await transactionService.downloadTransactionsExport(buildExportPayload(format));
      setShowExportModal(false);
    } catch (err) {
      setExportModalError(translateError(err));
    } finally {
      setExportingFormat(null);
    }
  };

  const handleCloseExportModal = () => {
    if (isExporting) return;
    setShowExportModal(false);
    setExportModalError(null);
  };

  const handleConfirmCancel = () => {
    if (onCancelTransaction) onCancelTransaction(confirmCancel.id, cancelReason || undefined);
    setConfirmCancel(null);
    setCancelReason('');
  };

  const inputControlStyle = { minHeight: '38px' };
  const dateControlStyle = { height: '46px' };
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

  const shouldUseInitialBranchFallback = !initialQuery || Object.keys(initialQuery).length === 0;

  const [filters, setFilters] = useState(() => normalizeFiltersFromQuery(initialQuery, shouldUseInitialBranchFallback ? resolvedBranchId : ''));

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
    setFilters(normalizeFiltersFromQuery(initialQuery, shouldUseInitialBranchFallback ? resolvedBranchId : ''));
  }, [initialQuery, resolvedBranchId, shouldUseInitialBranchFallback]);

  useEffect(() => {
    if (pagination?.pageSize && pagination.pageSize !== pageSize) {
      setPageSize(pagination.pageSize);
    }
  }, [pagination?.pageSize, pageSize]);

  useEffect(() => {
    if (!initialQuery || Object.keys(initialQuery).length === 0) return;
    setPageSize(Number(initialQuery.pageSize) || 20);
  }, [initialQuery]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const buildFetchPayload = ({ page = 1, nextPageSize = pageSize, sourceFilters = filters } = {}) => {
    const payload = {
      page,
      pageSize: nextPageSize,
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
    setPageSize(20);
    onFetchTransactions({
      page: 1,
      pageSize: 20,
      order_by: DEFAULT_ORDER_BY,
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

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > (pagination?.totalPages || 1)) return;
    onFetchTransactions(buildFetchPayload({ page: nextPage }));
  };

  const handlePageSizeChange = (event) => {
    const nextSize = Number(event.target.value);
    setPageSize(nextSize);
    onFetchTransactions(buildFetchPayload({ page: 1, nextPageSize: nextSize }));
  };

  const getVisiblePages = () => {
    const totalPages = pagination?.totalPages || 1;
    const currentPage = pagination?.page || 1;
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = startPage + maxVisible - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = endPage - maxVisible + 1;
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
  };

  const todayDate = useMemo(() => new Date().toISOString().split('T')[0], []);

  const startDateMax = filters.end_date ? (filters.end_date < todayDate ? filters.end_date : todayDate) : todayDate;
  const endDateMin = filters.start_date || undefined;

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

  const getOperationTypeIcon = (operationType) => {
    switch (operationType) {
      case 'IN':
        return <BsDownload title="Entrada" />;
      case 'OUT':
        return <BsUpload title="Salida" />;
      case 'TRANSFER':
        return <BsArrowLeftRight title="Traspaso" />;
      case 'ADJUSTMENT':
        return <BsGear title="Ajuste" />;
      default:
        return <BsInfoCircle title={operationType || 'Operación'} />;
    }
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

  const getTransactionBranchDisplay = (transaction) => {
    if (transaction?.operation_type !== 'TRANSFER') {
      return getBranchName(transaction);
    }

    const originBranchName = getBranchName(transaction);
    const destinationBranchId = Number(transaction?.destination_branch_id);

    if (!destinationBranchId) {
      return `${originBranchName} → -`;
    }

    const destinationBranchName = branchesById.get(destinationBranchId) || `Sede #${destinationBranchId}`;
    return `${originBranchName} → ${destinationBranchName}`;
  };

  const getCompleteActionConfig = (transaction) => {
    const isTransfer = transaction?.operation_type === 'TRANSFER';

    if (isTransfer && transaction?.status === 'PENDING') {
      return {
        title: 'Enviar',
        icon: <BsUpload />,
      };
    }

    if (isTransfer && transaction?.status === 'TRANSIT') {
      return {
        title: 'Recibir',
        icon: <BsDownload />,
      };
    }

    return {
      title: 'Completar',
      icon: <BsCheckSquare />,
    };
  };

  const getCompleteDialogConfig = (transaction) => {
    const completeAction = getCompleteActionConfig(transaction);

    if (transaction?.operation_type === 'TRANSFER' && transaction?.status === 'PENDING') {
      return {
        title: 'Enviar Traspaso',
        message: `¿Seguro que quieres enviar el traspaso #${transaction?.id}? Esta acción no se puede deshacer.`,
        confirmText: completeAction.title,
      };
    }

    if (transaction?.operation_type === 'TRANSFER' && transaction?.status === 'TRANSIT') {
      return {
        title: 'Recibir Traspaso',
        message: `¿Seguro que quieres recibir el traspaso #${transaction?.id}? Esta acción no se puede deshacer.`,
        confirmText: completeAction.title,
      };
    }

    return {
      title: 'Completar Operación',
      message: `¿Seguro que quieres completar la operación #${transaction?.id}? Esta acción no se puede deshacer.`,
      confirmText: completeAction.title,
    };
  };

  const handleDetailsClick = (event, transactionId) => {
    handleNavigationClick(event, `/transactions/${transactionId}`, navigate);
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

  const completeDialogConfig = getCompleteDialogConfig(confirmComplete);

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
    <div className="mb-5">
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
                    {Number(currentUser.id) === Number(user?.id) ? ' (tú)' : ''}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={3}>
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
                <option value="TRANSFER">Traspaso</option>
                <option value="ADJUSTMENT">Ajuste</option>
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={2}>
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
                <option value="TRANSIT">En tránsito</option>
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
                className="transaction-date-input"
                name="start_date"
                value={filters.start_date}
                onChange={handleFilterChange}
                max={startDateMax}
                style={dateControlStyle}
              />
            </Form.Group>
          </Col>

          <Col md={2}>
            <Form.Group>
              <Form.Label>Fecha fin</Form.Label>
              <Form.Control
                type="date"
                className="transaction-date-input"
                name="end_date"
                value={filters.end_date}
                onChange={handleFilterChange}
                min={endDateMin}
                max={todayDate}
                style={dateControlStyle}
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
                <option value="last_event_at">Último evento</option>
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
                {filters.order_desc === 'true' ? <BsSortDown /> : <BsSortUp />}
              </Button>
            </Form.Group>
          </Col>

          <Col md={3} className="d-flex gap-2 align-items-end">
            <Button variant="primary" onClick={handleApplyFilters} style={filterButtonStyle}>
              Aplicar
            </Button>
            {canExportTransactions && (
              <Button
                variant="warning"
                onClick={handleExportClick}
                style={filterButtonStyle}
                disabled={loadingExportCount || isExporting}
              >
                Exportar
              </Button>
            )}
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
                const { canComplete, canCancel } = getTransactionPermissions(user, transaction);
                const completeAction = getCompleteActionConfig(transaction);

                return (
                  <tr key={transaction.id}>
                    <td>
                      <span className="d-inline-flex align-items-center gap-2">
                        {getOperationTypeIcon(transaction.operation_type)}
                        <span>{getOperationTypeLabel(transaction.operation_type)}</span>
                      </span>
                    </td>
                    <td>{getTransactionBranchDisplay(transaction)}</td>
                    <td>{formatTransactionDateTime(transaction.last_event_at || transaction.created_at)}</td>
                    <td>
                      <span title={transaction.description || ''}>
                        {cropDescription(transaction.description)}
                      </span>
                    </td>
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
                    <td className="text-center">
                      <div className="d-flex gap-2 justify-content-center">
                        <Button
                          variant="primary"
                          size="sm"
                          className="list-action-btn"
                          onClick={(e) => handleDetailsClick(e, transaction.id)}
                          title="Ver detalles"
                        >
                          <BsInfoCircle />
                        </Button>
                        {onCompleteTransaction && canComplete && (
                          <Button
                            variant="success"
                            size="sm"
                            className="list-action-btn"
                            onClick={() => handleOpenComplete(transaction)}
                            disabled={actionLoading}
                            title={completeAction.title}
                          >
                            {completeAction.icon}
                          </Button>
                        )}
                        {onCancelTransaction && canCancel && (
                          <Button
                            variant="danger"
                            size="sm"
                            className="list-action-btn"
                            onClick={() => handleOpenCancel(transaction)}
                            disabled={actionLoading}
                            title="Cancelar"
                          >
                            <BsFillTrash3Fill />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="d-flex flex-wrap align-items-center gap-2 mt-3">
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted">Elementos por página</span>
          <Form.Select
            value={pageSize}
            onChange={handlePageSizeChange}
            style={{ width: '92px', height: '38px' }}
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </Form.Select>
        </div>

        <div className="w-100 d-flex justify-content-center">
          <Pagination className="item-list-pagination mb-0">
            <Pagination.First
              onClick={() => handlePageChange(1)}
              disabled={(pagination?.page || 1) <= 1 || loading}
            />

            <Pagination.Prev
              onClick={() => handlePageChange((pagination?.page || 1) - 1)}
              disabled={(pagination?.page || 1) <= 1 || loading}
            />

            {getVisiblePages().map((pageNumber) => (
              <Pagination.Item
                key={pageNumber}
                active={pageNumber === (pagination?.page || 1)}
                onClick={() => handlePageChange(pageNumber)}
                disabled={loading}
              >
                {pageNumber}
              </Pagination.Item>
            ))}

            <Pagination.Next
              onClick={() => handlePageChange((pagination?.page || 1) + 1)}
              disabled={(pagination?.page || 1) >= (pagination?.totalPages || 1) || loading}
            />

            <Pagination.Last
              onClick={() => handlePageChange(pagination?.totalPages || 1)}
              disabled={(pagination?.page || 1) >= (pagination?.totalPages || 1) || loading}
            />
          </Pagination>
        </div>
      </div>

      {/* Confirm complete dialog */}
      <ConfirmDialog
        isOpen={!!confirmComplete}
        title={completeDialogConfig.title}
        message={completeDialogConfig.message}
        confirmText={completeDialogConfig.confirmText}
        cancelText="Cancelar"
        variant="success"
        onConfirm={handleConfirmComplete}
        onCancel={() => setConfirmComplete(null)}
      />

      {/* Confirm cancel dialog with optional reason */}
      <Modal show={!!confirmCancel} onHide={() => setConfirmCancel(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Cancelar Operación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>¿Seguro que quieres cancelar la operación <strong>#{confirmCancel?.id}</strong>? Esta acción no se puede deshacer.</p>
          <Form.Group>
            <Form.Label>Motivo de cancelación <span className="text-muted">(opcional)</span></Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Indica el motivo de la cancelación..."
              maxLength={500}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setConfirmCancel(null)}>Volver</Button>
          <Button variant="danger" onClick={handleConfirmCancel}>Cancelar Operación</Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showExportModal}
        onHide={handleCloseExportModal}
        centered
        size="md"
      >
        <Modal.Header closeButton={!isExporting}>
          <Modal.Title>Confirmar exportación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingExportCount ? (
            <div className="d-flex align-items-center gap-2">
              <Spinner animation="border" size="sm" role="status" />
              <span>Calculando operaciones a exportar...</span>
            </div>
          ) : (
            <p className="mb-0">¿Quieres exportar <strong>{exportCount}</strong> operaciones?</p>
          )}

          {exportModalError && (
            <Alert variant="danger" className="mt-3 mb-0">
              {exportModalError}
            </Alert>
          )}

          {!loadingExportCount && !exportModalError && exportCount === 0 && (
            <Alert variant="warning" className="mt-3 mb-0">
              No hay operaciones que coincidan con el filtrado actual para exportar.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer 
          className="d-flex flex-column"
          style={{
            padding: '1rem',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              width: '100%',
              height: '50px',
            }}
          >
            <Button
              variant="secondary"
              onClick={handleCloseExportModal}
              disabled={isExporting}
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="info"
              onClick={() => handleExportByFormat('csv')}
              disabled={!canSubmitExport}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
              }}
            >
              <BsFiletypeCsv />
              {exportingFormat === 'csv' ? 'Exportando...' : 'Exportar CSV'}
            </Button>
            <Button
              variant="danger"
              onClick={() => handleExportByFormat('pdf')}
              disabled={!canSubmitExport}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
              }}
            >
              <BsFiletypePdf />
              {exportingFormat === 'pdf' ? 'Exportando...' : 'Exportar PDF'}
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TransactionListTable;
