import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Card, Col, Container, Row, Spinner } from 'react-bootstrap';
import { Navbar } from '../components/Navbar';
import { transactionService } from '../services/transactionService';
import { branchService } from '../services/branchService';
import { translateError } from '../utils/errorTranslator';

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

const normalizeArrayResponse = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

export const TransactionDetailPage = () => {
  const navigate = useNavigate();
  const { transactionId } = useParams();
  const [transaction, setTransaction] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const parsedTransactionId = useMemo(() => parseInt(transactionId, 10), [transactionId]);

  const branchesById = useMemo(() => {
    const lookup = new Map();
    branches.forEach((branch) => {
      lookup.set(Number(branch.id), branch.name);
    });
    return lookup;
  }, [branches]);

  useEffect(() => {
    const fetchTransactionDetail = async () => {
      setLoading(true);
      setError(null);

      try {
        const [transactionData, branchesResponse] = await Promise.all([
          transactionService.getTransactionById(parsedTransactionId),
          branchService.getBranches(),
        ]);

        setTransaction(transactionData);
        setBranches(normalizeArrayResponse(branchesResponse));
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
          <Button variant="outline-secondary" onClick={() => navigate('/transactions')}>
            Volver
          </Button>
        </div>

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

              <Card className="shadow-sm border-0">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-3">Próximos bloques</h5>
                  <p className="text-muted mb-2">En la siguiente etapa se añadirán:</p>
                  <ul className="mb-0 ps-3 text-muted">
                    <li>Tabla de líneas</li>
                    <li>Tabla de eventos</li>
                    <li>Resolución de nombres relacionados</li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        ) : (
          <Alert variant="warning">Operación no encontrada</Alert>
        )}
      </Container>
    </div>
  );
};

export default TransactionDetailPage;
