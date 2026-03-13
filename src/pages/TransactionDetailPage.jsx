import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Card, Col, Container, Form, Modal, Row, Spinner, Table } from 'react-bootstrap';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { BsCheckSquare, BsFillTrash3Fill, BsPencilSquare } from 'react-icons/bs';
import { Navbar } from '../components/Navbar';
import { TransactionModal } from '../components/TransactionModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { transactionService } from '../services/transactionService';
import { branchService } from '../services/branchService';
import { userService } from '../services/userService';
import { itemService } from '../services/itemService';
import { translateError } from '../utils/errorTranslator';
import { useAuthorization } from '../hooks/useAuthorization';
import { formatDecimal, formatUnit } from '../utils/formatters';

const OPERATION_TYPE_LABELS = {
  IN: 'Entrada',
  OUT: 'Salida',
  TRANSFER: 'Traspaso',
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

const EVENT_ACTION_LABELS = {
  CREATED: 'Creación',
  EDITED: 'Edición',
  CANCELLED: 'Cancelación',
  COMPLETED: 'Completado',
};

const normalizeArrayResponse = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

export const TransactionDetailPage = () => {
  const navigate = useNavigate();
  const { transactionId } = useParams();
  const { hasAnyRole } = useAuthorization();
  const canCreateEdit = hasAnyRole(['MANAGER', 'ADMIN']);

  const [transaction, setTransaction] = useState(null);
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Action state
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Complete confirm state
  const [showConfirmComplete, setShowConfirmComplete] = useState(false);

  // Cancel confirm state
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const parsedTransactionId = useMemo(() => parseInt(transactionId, 10), [transactionId]);

  const branchesById = useMemo(() => {
    const lookup = new Map();
    branches.forEach((branch) => {
      lookup.set(Number(branch.id), branch.name);
    });
    return lookup;
  }, [branches]);

  const usersById = useMemo(() => {
    const lookup = new Map();
    users.forEach((user) => {
      lookup.set(Number(user.id), user.name || user.username || `Usuario #${user.id}`);
    });
    return lookup;
  }, [users]);

  const itemsById = useMemo(() => {
    const lookup = new Map();
    items.forEach((item) => {
      lookup.set(Number(item.id), item);
    });
    return lookup;
  }, [items]);

  useEffect(() => {
    const fetchTransactionDetail = async () => {
      setLoading(true);
      setError(null);

      try {
        const [transactionData, branchesResponse, usersResponse] = await Promise.all([
          transactionService.getTransactionById(parsedTransactionId),
          branchService.getBranches(),
          userService.getUsersByCompany({ is_active: true }),
        ]);

        const itemIdsFromCurrentLines = (Array.isArray(transactionData?.lines) ? transactionData.lines : [])
          .map((line) => Number(line?.item_id));

        const itemIdsFromEditedEvents = (Array.isArray(transactionData?.events) ? transactionData.events : [])
          .flatMap((event) => {
            const metadata = event?.event_metadata;
            if (!metadata || typeof metadata !== 'object') return [];

            const previousLines = Array.isArray(metadata?.lines?.previous) ? metadata.lines.previous : [];
            const newLines = Array.isArray(metadata?.lines?.new) ? metadata.lines.new : [];

            return [...previousLines, ...newLines].map((line) => Number(line?.item_id));
          });

        const itemIds = Array.from(new Set(
          [...itemIdsFromCurrentLines, ...itemIdsFromEditedEvents]
            .filter((itemId) => Number.isInteger(itemId) && itemId > 0),
        ));

        const itemResults = await Promise.allSettled(
          itemIds.map((itemId) => itemService.getItemById(itemId)),
        );

        const resolvedItems = itemResults
          .filter((result) => result.status === 'fulfilled')
          .map((result) => result.value);

        setTransaction(transactionData);
        setBranches(normalizeArrayResponse(branchesResponse));
        setUsers(normalizeArrayResponse(usersResponse));
        setItems(normalizeArrayResponse(resolvedItems));
      } catch (err) {
        setError(translateError(err));
      } finally {
        setLoading(false);
      }
    };

    if (!Number.isNaN(parsedTransactionId)) {
      fetchTransactionDetail();
    } else {
      setError('ID de operación inválido');
      setLoading(false);
    }
  }, [parsedTransactionId]);

  const showSuccessMessage = (message) => {
    setActionSuccess(message);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const reloadTransaction = () => {
    setLoading(true);
    transactionService.getTransactionById(parsedTransactionId)
      .then((data) => setTransaction(data))
      .catch((err) => setError(translateError(err)))
      .finally(() => setLoading(false));
  };

  const handleEditSubmit = async (payload) => {
    setModalLoading(true);
    setModalError(null);
    try {
      await transactionService.updateTransaction(transaction.id, payload);
      setShowEditModal(false);
      setModalError(null);
      reloadTransaction();
      showSuccessMessage('Operación actualizada correctamente');
    } catch (err) {
      const message = translateError(err);
      setModalError(message);
      throw new Error(message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmComplete = async () => {
    setShowConfirmComplete(false);
    setActionLoading(true);
    setActionError(null);
    try {
      await transactionService.completeTransaction(transaction.id);
      reloadTransaction();
      showSuccessMessage('Operación completada correctamente');
    } catch (err) {
      setActionError(translateError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    setShowConfirmCancel(false);
    setActionLoading(true);
    setActionError(null);
    try {
      await transactionService.cancelTransaction(transaction.id, cancelReason || undefined);
      setCancelReason('');
      reloadTransaction();
      showSuccessMessage('Operación cancelada correctamente');
    } catch (err) {
      setActionError(translateError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const formatTransactionDateTime = (value) => {
    if (!value) return 'No disponible';

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return 'No disponible';

    return parsedDate.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getOperationTypeLabel = (operationType) => OPERATION_TYPE_LABELS[operationType] || operationType || 'No disponible';

  const getStatusLabel = (status) => STATUS_LABELS[status] || status || 'No disponible';

  const getStatusBadgeClassName = (status) => STATUS_BADGE_CLASSES[status] || 'bg-secondary';

  const getBranchName = (branchId) => {
    const numericBranchId = Number(branchId);
    if (!numericBranchId) return 'No disponible';
    return branchesById.get(numericBranchId) || `Sede desconocida (#${numericBranchId})`;
  };

  const getItemName = (itemId) => {
    const numericItemId = Number(itemId);
    if (!numericItemId) return 'Artículo desconocido';
    return itemsById.get(numericItemId)?.name || `Artículo desconocido (#${numericItemId})`;
  };

  const getItemUnit = (itemId) => {
    const numericItemId = Number(itemId);
    if (!numericItemId) return '';
    return formatUnit(itemsById.get(numericItemId)?.unit || '') || '';
  };

  const getUserName = (userId) => {
    const numericUserId = Number(userId);
    if (!numericUserId) return 'Usuario desconocido';
    return usersById.get(numericUserId) || `Usuario desconocido (#${numericUserId})`;
  };

  const getEventActionLabel = (actionType) => EVENT_ACTION_LABELS[actionType] || actionType || 'No disponible';

  const getCancelReason = (eventMetadata) => {
    if (!eventMetadata || typeof eventMetadata !== 'object') return 'Sin motivo';

    const reason = eventMetadata.cancel_reason || eventMetadata.cancelReason || eventMetadata.reason;
    return typeof reason === 'string' && reason.trim() ? reason.trim() : 'Sin motivo';
  };

  const getEditedLines = (eventMetadata) => {
    if (!eventMetadata || typeof eventMetadata !== 'object') {
      return { previous: [], next: [] };
    }

    const previous = Array.isArray(eventMetadata?.lines?.previous) ? eventMetadata.lines.previous : [];
    const next = Array.isArray(eventMetadata?.lines?.new) ? eventMetadata.lines.new : [];

    return { previous, next };
  };

  const formatEditedLine = (line) => {
    const itemName = getItemName(line?.item_id);
    const quantity = formatDecimal(line?.quantity);
    const unit = getItemUnit(line?.item_id);
    return `${itemName}: ${quantity}${unit ? ` ${unit}` : ''}`;
  };

  const getEditedDescription = (eventMetadata) => {
    if (!eventMetadata || typeof eventMetadata !== 'object' || !eventMetadata.description) {
      return { previous: null, next: null };
    }

    return {
      previous: eventMetadata.description.previous ?? null,
      next: eventMetadata.description.new ?? null,
    };
  };

  const formatDescriptionValue = (value) => {
    if (value === null || value === undefined || value === '') return 'vacío';
    return String(value);
  };

  const getEditedChangesCount = (eventMetadata) => {
    const { previous, next } = getEditedLines(eventMetadata);
    const description = getEditedDescription(eventMetadata);

    let count = 0;
    if (previous.length > 0 || next.length > 0) count += 1;
    if (description.previous !== null || description.next !== null) count += 1;

    return count;
  };

  const renderEditMetadata = (event) => {
    const metadata = event?.event_metadata;
    const { previous, next } = getEditedLines(metadata);
    const description = getEditedDescription(metadata);
    const changesCount = getEditedChangesCount(metadata);

    if (changesCount === 0) {
      return 'Número de cambios: 0';
    }

    return (
      <OverlayTrigger
        trigger={['hover', 'focus']}
        placement="top"
        overlay={(
          <Tooltip id={`transaction-event-metadata-tooltip-${event.id}`}>
            <div className="text-start" style={{ fontSize: '0.95rem', lineHeight: '1.35' }}>
              <div className="fw-semibold mb-1">Detalles de cambios</div>

              {(previous.length > 0 || next.length > 0) && (
                <div className="mb-2">
                  <div className="fw-semibold">Líneas</div>
                  {previous.length > 0 && (
                    <>
                      <div className="text-white-50">Antes</div>
                      {previous.map((line, index) => (
                        <div key={`prev-${line.item_id}-${index}`}>{formatEditedLine(line)}</div>
                      ))}
                    </>
                  )}
                  {next.length > 0 && (
                    <>
                      <div className="text-white-50 mt-1">Después</div>
                      {next.map((line, index) => (
                        <div key={`new-${line.item_id}-${index}`}>{formatEditedLine(line)}</div>
                      ))}
                    </>
                  )}
                </div>
              )}

              {(description.previous !== null || description.next !== null) && (
                <div>
                  <strong>Descripción:</strong>{' '}
                  {formatDescriptionValue(description.previous)} → {formatDescriptionValue(description.next)}
                </div>
              )}
            </div>
          </Tooltip>
        )}
      >
        <span style={{ textDecoration: 'underline dotted' }}>
          Número de cambios: {changesCount}
        </span>
      </OverlayTrigger>
    );
  };

  const renderEventMetadata = (event) => {
    if (event?.action_type === 'CANCELLED') {
      return getCancelReason(event?.event_metadata);
    }

    if (event?.action_type === 'EDITED') {
      return renderEditMetadata(event);
    }

    return '-';
  };

  const linesCount = Array.isArray(transaction?.lines) ? transaction.lines.length : 0;
  const eventsCount = Array.isArray(transaction?.events) ? transaction.events.length : 0;

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <Container className="py-5 flex-grow-1">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="display-5 fw-bold text-primary mb-2">Detalle de la operación</h1>
            <p className="text-muted mb-0">Información completa de la operación #{transactionId}</p>
          </div>
          <div className="d-flex gap-2 align-items-center">
            {transaction?.status === 'PENDING' && (
              <>
                {canCreateEdit && (
                  <Button
                    variant="primary"
                    onClick={() => { setModalError(null); setShowEditModal(true); }}
                    disabled={actionLoading}
                  >
                    <BsPencilSquare className="me-1" />
                    Editar
                  </Button>
                )}
                <Button
                  variant="success"
                  onClick={() => setShowConfirmComplete(true)}
                  disabled={actionLoading}
                >
                  <BsCheckSquare className="me-1" />
                  Completar
                </Button>
                <Button
                  variant="danger"
                  onClick={() => { setCancelReason(''); setShowConfirmCancel(true); }}
                  disabled={actionLoading}
                >
                  <BsFillTrash3Fill className="me-1" />
                  Cancelar
                </Button>
              </>
            )}
            <Button variant="outline-secondary" onClick={() => navigate('/transactions')} disabled={actionLoading}>
              Volver
            </Button>
          </div>
        </div>

        {actionSuccess && (
          <Alert variant="success" onClose={() => setActionSuccess(null)} dismissible className="mb-3">
            {actionSuccess}
          </Alert>
        )}

        {actionError && (
          <Alert variant="danger" onClose={() => setActionError(null)} dismissible className="mb-3">
            {actionError}
          </Alert>
        )}

        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
          </div>
        ) : transaction ? (
          <>
            <Row className="g-4">
              <Col lg={8}>
              <Card className="shadow-sm border-0 h-100">
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-start mb-4">
                    <div>
                      <h3 className="fw-bold mb-1">Operación #{transaction.id}</h3>
                      <p className="text-muted mb-0">Creada el {formatTransactionDateTime(transaction.created_at)}</p>
                    </div>
                    <span className={`badge ${getStatusBadgeClassName(transaction.status)}`}>
                      {getStatusLabel(transaction.status)}
                    </span>
                  </div>

                  <Row className="mb-3">
                    <Col md={6}>
                      <p className="mb-1 text-muted">Tipo de operación</p>
                      <p className="fw-semibold mb-0">{getOperationTypeLabel(transaction.operation_type)}</p>
                    </Col>
                    <Col md={6}>
                      <p className="mb-1 text-muted">Documento adjunto</p>
                      <p className="fw-semibold mb-0">{transaction.document_url ? 'Disponible' : 'Sin documento'}</p>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={6}>
                      <p className="mb-1 text-muted">Sede de origen</p>
                      <p className="fw-semibold mb-0">{getBranchName(transaction.branch_id)}</p>
                    </Col>
                    <Col md={6}>
                      <p className="mb-1 text-muted">Sede de destino</p>
                      <p className="fw-semibold mb-0">
                        {transaction.destination_branch_id ? getBranchName(transaction.destination_branch_id) : 'No aplica'}
                      </p>
                    </Col>
                  </Row>

                  <div>
                    <p className="mb-1 text-muted">Descripción</p>
                    <p className="fw-semibold mb-0">{transaction.description || 'Sin descripción'}</p>
                  </div>
                </Card.Body>
              </Card>
              </Col>

              <Col lg={4}>
              <Card className="shadow-sm border-0 mb-4">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-3">Resumen</h5>
                  <div className="mb-3">
                    <p className="mb-1 text-muted">Número de líneas</p>
                    <p className="fw-semibold mb-0">{linesCount}</p>
                  </div>
                  <div className="mb-3">
                    <p className="mb-1 text-muted">Número de eventos</p>
                    <p className="fw-semibold mb-0">{eventsCount}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-muted">Estado actual</p>
                    <p className="fw-semibold mb-0">{getStatusLabel(transaction.status)}</p>
                  </div>
                </Card.Body>
              </Card>
              </Col>
            </Row>

            <Card className="shadow-sm border-0 mt-4">
              <Card.Body className="p-4">
                <h5 className="fw-bold mb-3">Líneas de la operación</h5>
                <div className="table-responsive">
                  <Table hover className="align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Artículo</th>
                        <th className="text-end">Cantidad</th>
                        <th>Unidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linesCount === 0 ? (
                        <tr>
                          <td colSpan={3} className="text-center text-muted py-4">
                            Sin líneas registradas
                          </td>
                        </tr>
                      ) : (
                        transaction.lines.map((line) => (
                          <tr key={line.id}>
                            <td>{getItemName(line.item_id)}</td>
                            <td className="text-end">{formatDecimal(line.quantity)}</td>
                            <td>{getItemUnit(line.item_id) || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>

            <Card className="shadow-sm border-0 mt-4">
              <Card.Body className="p-4">
                <h5 className="fw-bold mb-3">Eventos de la operación</h5>
                <div className="table-responsive">
                  <Table hover className="align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Acción</th>
                        <th>Metadata</th>
                        <th>Usuario</th>
                        <th>Fecha y hora</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventsCount === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center text-muted py-4">
                            Sin eventos registrados
                          </td>
                        </tr>
                      ) : (
                        transaction.events.map((event) => (
                          <tr key={event.id}>
                            <td>{getEventActionLabel(event.action_type)}</td>
                            <td>{renderEventMetadata(event)}</td>
                            <td>{getUserName(event.performed_by)}</td>
                            <td>{formatTransactionDateTime(event.timestamp)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </>
        ) : (
          <Alert variant="warning">Operación no encontrada</Alert>
        )}
      </Container>

      {/* Edit modal */}
      <TransactionModal
        isOpen={showEditModal}
        transaction={transaction}
        onClose={() => setShowEditModal(false)}
        onSave={handleEditSubmit}
        loading={modalLoading}
        error={modalError}
      />

      {/* Complete confirm dialog */}
      <ConfirmDialog
        isOpen={showConfirmComplete}
        title="Completar operación"
        message={`¿Seguro que quieres completar la operación #${transaction?.id}? Esta acción no se puede deshacer.`}
        confirmText="Completar"
        cancelText="Cancelar"
        variant="success"
        onConfirm={handleConfirmComplete}
        onCancel={() => setShowConfirmComplete(false)}
      />

      {/* Cancel confirm dialog with optional reason */}
      <Modal show={showConfirmCancel} onHide={() => setShowConfirmCancel(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Cancelar operación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            ¿Seguro que quieres cancelar la operación <strong>#{transaction?.id}</strong>?
            {' '}Esta acción no se puede deshacer.
          </p>
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
          <Button variant="secondary" onClick={() => setShowConfirmCancel(false)}>Volver</Button>
          <Button variant="danger" onClick={handleConfirmCancel}>Cancelar operación</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TransactionDetailPage;
