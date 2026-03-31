import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { BsBoxArrowUpRight, BsDownload, BsFillTrash3Fill, BsPencilSquare, BsUpload } from 'react-icons/bs';
import { Navbar } from '../components/Navbar';
import { ItemModal } from '../components/ItemModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { CategoryBadge } from '../components/CategoryBadge';
import { itemService } from '../services/itemService';
import { categoryService } from '../services/categoryService';
import { translateError } from '../utils/errorTranslator';
import { useAuthorization } from '../hooks/useAuthorization';
import { formatUnitExtended } from '../utils/formatters';

export const ItemDetailPage = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
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

  const canEdit = hasAnyRole(['MANAGER', 'ADMIN']);
  const canDelete = hasRole('ADMIN');
  const canManageImage = hasAnyRole(['MANAGER', 'ADMIN']);

  const parsedItemId = useMemo(() => parseInt(itemId, 10), [itemId]);

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

  const handleOpenImage = () => {
    if (!imageUrl) return;
    window.open(imageUrl, '_blank', 'noopener,noreferrer');
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
              onClick={() => {
                if (fromTransactionId) {
                  navigate(`/transactions/${fromTransactionId}`);
                } else {
                  navigate('/inventory');
                }
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
                    <Col md={6}>
                      <p className="mb-1 text-muted">Unidad</p>
                      <p className="fw-semibold">{formatUnitExtended(item.unit)}</p>
                    </Col>
                    <Col md={6}>
                      <p className="mb-1 text-muted">Precio</p>
                      <p className="fw-semibold">
                        {item.price !== null && item.price !== undefined ? `${item.price} €` : 'Sin precio'}
                      </p>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={6}>
                      <p className="mb-1 text-muted">Marca</p>
                      <p className="fw-semibold">{item.brand || 'Sin marca'}</p>
                    </Col>
                    <Col md={6}>
                      <p className="mb-1 text-muted">Fecha de alta</p>
                      <p className="fw-semibold">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                      </p>
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
                      <h5 className="fw-bold mb-1">Imagen del artículo</h5>
                    </div>

                    {canManageImage && (
                      <div className="d-flex gap-2 flex-wrap justify-content-end">
                        <Button
                          variant={item.has_image ? 'primary' : 'success'}
                          className="detail-page-action-btn"
                          onClick={triggerImagePicker}
                          disabled={imageActionLoading || loadingAction}
                        >
                          {item.has_image ? <BsPencilSquare className="me-1" /> : <BsUpload className="me-1" />}
                          {item.has_image ? 'Editar' : 'Añadir'}
                        </Button>
                        {item.has_image && (
                          <Button
                            variant="danger"
                            className="detail-page-action-btn"
                            onClick={() => setShowConfirmDeleteImage(true)}
                            disabled={imageActionLoading || loadingAction}
                          >
                            <BsFillTrash3Fill className="me-1" />
                            Eliminar
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {imageLoading ? (
                    <div className="text-center py-4">
                      <Spinner animation="border" />
                      <div className="text-muted mt-2">Cargando imagen...</div>
                    </div>
                  ) : imageError ? (
                    <Alert variant="warning" className="mb-0">{imageError}</Alert>
                  ) : imageUrl ? (
                    <div className="item-detail-image-stage text-center">
                      <img
                        src={imageUrl}
                        alt={item.name}
                        className="item-detail-image"
                      />
                    </div>
                  ) : (
                    <div className="item-detail-no-image-state border rounded p-4 bg-light text-center">
                      <p className="text-muted mb-0">No hay imagen asociada a este artículo.</p>
                    </div>
                  )}

                  {item.has_image && imageUrl && (
                    <div className="d-flex gap-2 flex-wrap mt-3">
                      <Button
                        variant="outline-primary"
                        className="detail-page-action-btn"
                        onClick={handleOpenImage}
                        disabled={imageActionLoading || loadingAction}
                      >
                        <BsBoxArrowUpRight className="me-1" />
                        Abrir
                      </Button>
                      <Button
                        variant="outline-secondary"
                        className="detail-page-action-btn"
                        onClick={handleDownloadImage}
                        disabled={imageActionLoading || loadingAction}
                      >
                        <BsDownload className="me-1" />
                        Descargar
                      </Button>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
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
