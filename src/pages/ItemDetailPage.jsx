import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Spinner, Table, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { BsDownload, BsFillTrash3Fill, BsInfoCircle, BsPencilSquare, BsUpload } from 'react-icons/bs';
import { Navbar } from '../components/Navbar';
import { ItemModal } from '../components/ItemModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { CategoryBadge } from '../components/CategoryBadge';
import { itemService } from '../services/itemService';
import { branchService } from '../services/branchService';
import { categoryService } from '../services/categoryService';
import { transactionService } from '../services/transactionService';
import { translateError } from '../utils/errorTranslator';
import { useAuthorization } from '../hooks/useAuthorization';
import { useAuth } from '../hooks/useAuth';
import { useBranchSelection } from '../hooks/useBranchSelection';
import { formatDecimal, formatUnit } from '../utils/formatters';
import { handleNavigationClickWithState, handleFileOpenClick } from '../utils/navigationUtils';

const OPERATION_TYPE_LABELS = {
  IN: 'Entrada',
  OUT: 'Salida',
  TRANSFER: 'Traspaso',
  ADJUSTMENT: 'Ajuste',
};

export const ItemDetailPage = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { selectedBranchId } = useBranchSelection();
  const { hasAnyRole, hasRole } = useAuthorization();
  
  const fromTransactionId = location.state?.fromTransactionId;

  const [item, setItem] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageName, setImageName] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(null);
  const [imageActionLoading, setImageActionLoading] = useState(false);
  const [imageRefresh, setImageRefresh] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showConfirmDeleteImage, setShowConfirmDeleteImage] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [success, setSuccess] = useState(false);
  const imageInputRef = useRef(null);
  const dataCardRef = useRef(null);
  const [dataCardHeight, setDataCardHeight] = useState(null);
  const [activeBranches, setActiveBranches] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [recentTransactionsLoading, setRecentTransactionsLoading] = useState(false);
  const [recentTransactionsError, setRecentTransactionsError] = useState(null);

  const canEdit = hasAnyRole(['MANAGER', 'ADMIN']);
  const canDelete = hasRole('ADMIN');
  const canManageImage = hasAnyRole(['MANAGER', 'ADMIN']);

  const parsedItemId = useMemo(() => parseInt(itemId, 10), [itemId]);
  const resolvedBranchId = useMemo(() => {
    if (user?.branch_id) return Number(user.branch_id);
    if (selectedBranchId) return Number(selectedBranchId);

    const storedBranchId = localStorage.getItem('selectedBranchId');
    if (!storedBranchId) return null;

    const parsedStoredBranchId = Number(storedBranchId);
    return Number.isInteger(parsedStoredBranchId) && parsedStoredBranchId > 0 ? parsedStoredBranchId : null;
  }, [selectedBranchId, user?.branch_id]);

  useEffect(() => {
    const fetchItemDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const itemData = await itemService.getItemById(parsedItemId);
        setItem(itemData);

        const itemCategories = await categoryService.getItemCategories(parsedItemId);
        setCategories(itemCategories || []);
      } catch (err) {
        setError(translateError(err));
      } finally {
        setLoading(false);
      }
    };

    if (!Number.isNaN(parsedItemId)) {
      fetchItemDetail();
    } else {
      setError('ID de artículo inválido');
      setLoading(false);
    }
  }, [parsedItemId]);

  useEffect(() => {
    let objectUrl = null;

    const fetchImage = async () => {
      if (!item?.id || !item?.has_image) {
        setImageUrl(null);
        setImageName('');
        setImageError(null);
        return;
      }

      setImageLoading(true);
      setImageError(null);

      try {
        const imageResponse = await itemService.getItemImage(item.id, Date.now());
        objectUrl = URL.createObjectURL(imageResponse.blob);
        setImageUrl(objectUrl);
        setImageName(imageResponse.fileName || 'unknown');
      } catch {
        setImageUrl(null);
        setImageName('');
        setImageError('No se pudo cargar la imagen del artículo.');
      } finally {
        setImageLoading(false);
      }
    };

    fetchImage();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [item?.id, item?.has_image, imageRefresh]);

  useEffect(() => {
    const loadActiveBranches = async () => {
      try {
        const response = await branchService.getBranches({ is_active: true });
        setActiveBranches(Array.isArray(response) ? response : []);
      } catch {
        setActiveBranches(null);
      }
    };

    loadActiveBranches();
  }, []);

  useEffect(() => {
    const fetchRecentTransactions = async () => {
      if (!item?.id || !resolvedBranchId) {
        setRecentTransactions([]);
        setRecentTransactionsError(null);
        setRecentTransactionsLoading(false);
        return;
      }

      setRecentTransactionsLoading(true);
      setRecentTransactionsError(null);

      try {
        const response = await transactionService.listTransactions({
          page: 1,
          page_size: 20,
          branch_id: resolvedBranchId,
          status: 'COMPLETED',
          item_id: item.id,
          order_by: 'last_event_at',
          order_desc: true,
        });

        setRecentTransactions(Array.isArray(response?.data) ? response.data : []);
      } catch (err) {
        setRecentTransactions([]);
        setRecentTransactionsError(translateError(err));
      } finally {
        setRecentTransactionsLoading(false);
      }
    };

    fetchRecentTransactions();
  }, [item?.id, resolvedBranchId]);

  useEffect(() => {
    const element = dataCardRef.current;
    if (!element) return undefined;

    const updateHeight = () => {
      setDataCardHeight(element.offsetHeight);
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [item, categories.length, imageLoading, imageError, success, error]);

  const triggerImagePicker = () => {
    imageInputRef.current?.click();
  };

  const handleImageSelected = async (event) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = '';

    if (!selectedFile || !item?.id) return;

    setImageActionLoading(true);
    setError(null);

    try {
      const updatedItem = await itemService.uploadItemImage(item.id, selectedFile);
      setItem(updatedItem);
      setImageRefresh((current) => current + 1);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(translateError(err));
    } finally {
      setImageActionLoading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!item?.id) return;

    setShowConfirmDeleteImage(false);
    setImageActionLoading(true);
    setError(null);

    try {
      const updatedItem = await itemService.deleteItemImage(item.id);
      setItem(updatedItem);
      setImageRefresh((current) => current + 1);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(translateError(err));
    } finally {
      setImageActionLoading(false);
    }
  };

  const handleDownloadImage = () => {
    if (!imageUrl) return;

    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = imageName || `imagen-articulo-${item?.id}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSave = async (formData, categoryIds) => {
    if (!item) return;

    setLoadingAction(true);
    setError(null);
    try {
      const updatedItem = await itemService.updateItem(item.id, formData);
      setItem(updatedItem);

      if (Array.isArray(categoryIds)) {
        await categoryService.assignCategoriesToItem(item.id, categoryIds);
        const updatedCategories = await categoryService.getItemCategories(item.id);
        setCategories(updatedCategories || []);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(translateError(err));
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDelete = async () => {
    if (!item) return;

    setLoadingAction(true);
    setError(null);
    try {
      await itemService.deleteItem(item.id);
      navigate('/inventory');
    } catch (err) {
      setError(translateError(err));
    } finally {
      setLoadingAction(false);
      setShowConfirm(false);
    }
  };

  const categoryIds = categories.map((cat) => cat.id);

  const getOperationTypeLabel = (operationType) => OPERATION_TYPE_LABELS[operationType] || operationType || '-';

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

  const resolveItemQuantityForTransaction = (transaction) => {
    const lines = Array.isArray(transaction?.lines) ? transaction.lines : [];
    const totalQuantity = lines
      .filter((line) => Number(line?.item_id) === Number(parsedItemId))
      .reduce((sum, line) => sum + Number(line?.quantity || 0), 0);

    if (!Number.isFinite(totalQuantity)) return 0;

    if (transaction?.operation_type === 'ADJUSTMENT') {
      return totalQuantity;
    }

    if (transaction?.operation_type === 'IN') {
      return Math.abs(totalQuantity);
    }

    if (transaction?.operation_type === 'OUT') {
      return -Math.abs(totalQuantity);
    }

    if (transaction?.operation_type === 'TRANSFER') {
      if (resolvedBranchId && Number(transaction?.destination_branch_id) === Number(resolvedBranchId)) {
        return Math.abs(totalQuantity);
      }

      if (resolvedBranchId && Number(transaction?.branch_id) === Number(resolvedBranchId)) {
        return -Math.abs(totalQuantity);
      }

      return -Math.abs(totalQuantity);
    }

    return totalQuantity;
  };

  const formatSignedQuantity = (quantity) => {
    if (quantity > 0) return `+${formatDecimal(quantity)}`;
    if (quantity < 0) return formatDecimal(quantity);
    return formatDecimal(0);
  };

  const getBranchStock = () => {
    if (!resolvedBranchId) return '0';

    const branchStock = item?.stock_by_branch?.find(
      (sb) => Number(sb.branch_id) === Number(resolvedBranchId)
    );
    return branchStock ? formatDecimal(branchStock.stock) : '0';
  };

  const getTotalStock = () => {
    const total = item?.stock_by_branch?.reduce(
      (sum, sb) => sum + parseFloat(sb.stock || 0),
      0,
    ) || 0;
    return formatDecimal(total);
  };

  const getStockByBranchRows = () => {
    const activeBranchIds = activeBranches
      ? new Set(activeBranches.map((branch) => Number(branch.id)))
      : null;

    return (item?.stock_by_branch || []).filter((branch) => {
      if (!activeBranchIds) return true;
      return activeBranchIds.has(Number(branch.branch_id));
    });
  };

  const renderStockTooltip = () => {
    const branches = getStockByBranchRows();

    return (
      <Tooltip id={`stock-tooltip-${item?.id || 'detail'}`}>
        <div className="text-start" style={{ fontSize: '0.95rem', lineHeight: '1.35' }}>
          <div className="fw-semibold mb-1">Stock por sede</div>
          {branches.length > 0 ? (
            branches.map((sb) => (
              <div key={sb.branch_id}>
                <strong>{sb.branch_name}:</strong> {formatDecimal(sb.stock)} {formatUnit(item?.unit)}
              </div>
            ))
          ) : (
            <div>Sin stock en sedes</div>
          )}
        </div>
      </Tooltip>
    );
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <Container className="py-5 flex-grow-1">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="display-5 fw-bold text-primary mb-2">Detalle del artículo</h1>
            <p className="text-muted">Información completa del artículo</p>
          </div>
          <div className="d-flex gap-2 align-items-center">
            {item && canEdit && (
              <Button
                variant="primary"
                className="detail-page-action-btn"
                onClick={() => setShowModal(true)}
                disabled={loadingAction || imageActionLoading}
              >
                <BsPencilSquare className="me-1" />
                Editar
              </Button>
            )}
            {item && canDelete && (
              <Button
                variant="danger"
                className="detail-page-action-btn"
                onClick={() => setShowConfirm(true)}
                disabled={loadingAction || imageActionLoading}
              >
                <BsFillTrash3Fill className="me-1" />
                Eliminar
              </Button>
            )}
            <Button
              variant="outline-secondary"
              className="detail-page-action-btn"
              onClick={(e) => {
                const path = fromTransactionId ? `/transactions/${fromTransactionId}` : '/inventory';
                handleNavigationClickWithState(e, path, {}, navigate);
              }}
              disabled={loadingAction || imageActionLoading}
            >
              Volver
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" onClose={() => setSuccess(false)} dismissible>
            ¡Operación completada correctamente!
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
          </div>
        ) : item ? (
          <>
            <Row className="g-4 align-items-stretch">
              <Col lg={7} className="d-flex">
                <Card ref={dataCardRef} className="shadow-sm border-0 w-100 item-detail-equal-card">
                  <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h3 className="fw-bold mb-1">{item.name}</h3>
                        <p className="text-muted mb-0">SKU: {item.sku}</p>
                      </div>
                      <span className={`badge ${item.is_active ? 'bg-success' : 'bg-secondary'}`}>
                        {item.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>

                    <Row className="mb-3">
                      <Col md={4}>
                        <p className="mb-1 text-muted">Precio</p>
                        <p className="fw-semibold">
                          {item.price !== null && item.price !== undefined ? `${item.price} €` : 'Sin precio'}
                        </p>
                      </Col>
                      <Col md={4}>
                        <p className="mb-1 text-muted">Marca</p>
                        <p className="fw-semibold">{item.brand || 'Sin marca'}</p>
                      </Col>
                      <Col md={4}>
                        <p className="mb-1 text-muted">Fecha de alta</p>
                        <p className="fw-semibold">
                          {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                        </p>
                      </Col>
                    </Row>

                    <Row className="mb-3">
                      <Col md={4}>
                        <p className="mb-1 text-muted">Stock en sede</p>
                        <p className="fw-semibold">{getBranchStock()} {formatUnit(item.unit)}</p>
                      </Col>
                      <Col md={4}>
                        <p className="mb-1 text-muted">Stock total</p>
                        <p className="fw-semibold mb-0">
                          <OverlayTrigger trigger={['hover', 'focus']} placement="top" overlay={renderStockTooltip()}>
                            <span style={{ textDecoration: 'underline dotted', cursor: 'help' }}>
                              {getTotalStock()} {formatUnit(item.unit)}
                            </span>
                          </OverlayTrigger>
                        </p>
                      </Col>
                      <Col md={4}>
                        <p className="mb-1 text-muted">Umbral de stock bajo</p>
                        <p className="fw-semibold">{item.low_stock_threshold ?? '-'}</p>
                      </Col>
                    </Row>

                    <div className="mb-3">
                      <p className="mb-1 text-muted">Descripción</p>
                      <p className="fw-semibold">{item.description || 'Sin descripción'}</p>
                    </div>

                    <div>
                      <p className="mb-2 text-muted">Categorías</p>
                      {categories.length > 0 ? (
                        <div className="d-flex flex-wrap">
                          {categories.map((cat) => (
                            <CategoryBadge key={cat.id} category={cat} />
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted mb-0">Sin categorías asignadas</p>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={5} className="d-flex">
                <Card
                  className="shadow-sm border-0 w-100 item-detail-equal-card item-detail-image-card"
                  style={dataCardHeight ? { height: `${dataCardHeight}px`, maxHeight: `${dataCardHeight}px` } : undefined}
                >
                  <Card.Body className="p-4 d-flex flex-column item-detail-image-body">
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelected}
                      className="d-none"
                    />

                    <div className="d-flex justify-content-between align-items-start mb-3 gap-3">
                      <div>
                        <h4 className="fw-bold mb-1">Imagen del artículo</h4>
                      </div>

                      <div className="d-flex gap-2 justify-content-end align-items-center flex-nowrap">
                        {canManageImage && (
                          <>
                            <Button
                              variant={item.has_image ? 'primary' : 'success'}
                              className="detail-media-icon-btn"
                              onClick={triggerImagePicker}
                              disabled={imageActionLoading || loadingAction}
                              title={item.has_image ? 'Editar imagen' : 'Añadir imagen'}
                            >
                              {item.has_image ? <BsPencilSquare /> : <BsUpload />}
                            </Button>
                            {item.has_image && (
                              <Button
                                variant="danger"
                                className="detail-media-icon-btn"
                                onClick={() => setShowConfirmDeleteImage(true)}
                                disabled={imageActionLoading || loadingAction}
                                title="Eliminar imagen"
                              >
                                <BsFillTrash3Fill />
                              </Button>
                            )}
                          </>
                        )}
                        {item.has_image && imageUrl && (
                          <Button
                            variant="outline-secondary"
                            className="detail-media-icon-btn"
                            onClick={handleDownloadImage}
                            disabled={imageActionLoading || loadingAction}
                            title="Descargar imagen"
                          >
                            <BsDownload />
                          </Button>
                        )}
                      </div>
                    </div>

                    {imageLoading ? (
                      <div className="text-center py-4">
                        <Spinner animation="border" />
                        <div className="text-muted mt-2">Cargando imagen...</div>
                      </div>
                    ) : imageError ? (
                      <Alert variant="warning" className="mb-0">{imageError}</Alert>
                    ) : imageUrl ? (
                      <div 
                        className="item-detail-image-stage text-center"
                        style={{ cursor: 'pointer' }}
                        onClick={(e) => handleFileOpenClick(e, imageUrl, {
                          fileName: imageName || `imagen-articulo-${item?.id}`,
                          contentType: 'image/*',
                        })}
                        role="button"
                        tabIndex={0}
                        title="Abrir"
                      >
                        <img
                          src={imageUrl}
                          alt={item.name}
                          className="item-detail-image"
                          style={{ pointerEvents: 'none' }}
                        />
                      </div>
                    ) : (
                      <div className="item-detail-no-image-state border rounded p-4 bg-light text-center">
                        <p className="text-muted mb-0">No hay imagen asociada a este artículo.</p>
                      </div>
                    )}

                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Card className="shadow-sm border-0 mt-4">
              <Card.Body className="p-4">
                <h5 className="fw-bold mb-3">Operaciones recientes</h5>

                {!resolvedBranchId && (
                  <Alert variant="warning" className="mb-0">
                    No hay una sede seleccionada para cargar las operaciones recientes.
                  </Alert>
                )}

                {resolvedBranchId && recentTransactionsLoading && (
                  <div className="text-center py-4">
                    <Spinner animation="border" />
                  </div>
                )}

                {resolvedBranchId && !recentTransactionsLoading && recentTransactionsError && (
                  <Alert variant="danger" className="mb-0">
                    {recentTransactionsError}
                  </Alert>
                )}

                {resolvedBranchId && !recentTransactionsLoading && !recentTransactionsError && (
                  <div className="table-responsive">
                    <Table hover className="align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Tipo</th>
                          <th>Fecha y hora</th>
                          <th>Descripción</th>
                          <th className="text-end">Cantidad</th>
                          <th className="text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentTransactions.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="text-center text-muted py-4">
                              No hay operaciones recientes para este artículo
                            </td>
                          </tr>
                        ) : (
                          recentTransactions.map((transaction) => {
                            const signedQuantity = resolveItemQuantityForTransaction(transaction);

                            return (
                              <tr key={transaction.id}>
                                <td>{getOperationTypeLabel(transaction.operation_type)}</td>
                                <td>{formatTransactionDateTime(transaction.last_event_at || transaction.created_at)}</td>
                                <td>{transaction.description || '-'}</td>
                                <td className={`text-end fw-semibold ${signedQuantity > 0 ? 'text-success' : (signedQuantity < 0 ? 'text-danger' : '')}`}>
                                  {formatSignedQuantity(signedQuantity)}
                                </td>
                                <td className="text-center">
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    className="list-action-btn"
                                    onClick={(e) => handleNavigationClickWithState(
                                      e,
                                      `/transactions/${transaction.id}`,
                                      { fromItemId: Number(item?.id) || parsedItemId },
                                      navigate,
                                    )}
                                    title="Ver detalles"
                                  >
                                    <BsInfoCircle />
                                  </Button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </>
        ) : (
          <Alert variant="warning">Artículo no encontrado</Alert>
        )}
      </Container>

      <ItemModal
        isOpen={showModal}
        item={item}
        initialCategoryIds={categoryIds}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        loading={loadingAction}
        error={error}
      />

      <ConfirmDialog
        isOpen={showConfirm}
        title="Eliminar Artículo"
        message="¿Estás seguro de que deseas eliminar este artículo? Esta acción no se puede deshacer."
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={showConfirmDeleteImage}
        title="Eliminar Imagen"
        message="¿Seguro que quieres eliminar la imagen de este artículo?"
        onConfirm={handleDeleteImage}
        onCancel={() => setShowConfirmDeleteImage(false)}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};

export default ItemDetailPage;
