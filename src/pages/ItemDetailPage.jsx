import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { Navbar } from '../components/Navbar';
import { ItemModal } from '../components/ItemModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { CategoryBadge } from '../components/CategoryBadge';
import { itemService } from '../services/itemService';
import { categoryService } from '../services/categoryService';
import { translateError } from '../utils/errorTranslator';
import { useAuthorization } from '../hooks/useAuthorization';

export const ItemDetailPage = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { hasAnyRole, hasRole } = useAuthorization();

  const [item, setItem] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageRefresh, setImageRefresh] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [success, setSuccess] = useState(false);

  const canEdit = hasAnyRole(['MANAGER', 'ADMIN']);
  const canDelete = hasRole('ADMIN');

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
      if (!item?.id || !item?.image_url) return;
      try {
        const blob = await itemService.getItemImage(item.id, Date.now());
        objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
      } catch (err) {
        // Ignore missing images and other fetch errors
      }
    };

    fetchImage();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [item?.id, item?.image_url, imageRefresh]);

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

      setImageRefresh(r => r + 1);
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
          <Button variant="outline-secondary" onClick={() => navigate('/inventory')}>
            Volver
          </Button>
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
          <Row className="g-4">
            <Col lg={7}>
              <Card className="shadow-sm border-0">
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
                      <p className="fw-semibold">{item.unit}</p>
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

            {item?.image_url && (
              <Col lg={5}>
                <Card className="shadow-sm border-0">
                  <Card.Body className="p-4">
                    <h5 className="fw-bold mb-3">Imagen del artículo</h5>
                    {imageUrl ? (
                      <div className="text-center">
                        <img
                          src={imageUrl}
                          alt={item.name}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '280px',
                            borderRadius: '6px',
                            border: '1px solid #e6e6e6',
                          }}
                        />
                      </div>
                    ) : (
                      <p className="text-muted mb-0">Cargando imagen...</p>
                    )}
                  </Card.Body>
                </Card>

                {(canEdit || canDelete) && (
                  <Card className="shadow-sm border-0 mt-4">
                    <Card.Body className="p-4">
                      <h5 className="fw-bold mb-3">Acciones</h5>
                      <div className="d-flex gap-2">
                        {canEdit && (
                          <Button
                            variant="primary"
                            onClick={() => setShowModal(true)}
                            disabled={loadingAction}
                          >
                            Editar
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="danger"
                            onClick={() => setShowConfirm(true)}
                            disabled={loadingAction}
                          >
                            Eliminar
                          </Button>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                )}
              </Col>
            )}
            {!item?.image_url && (canEdit || canDelete) && (
              <Col lg={5}>
                <Card className="shadow-sm border-0">
                  <Card.Body className="p-4">
                    <h5 className="fw-bold mb-3">Acciones</h5>
                    <div className="d-flex gap-2">
                      {canEdit && (
                        <Button
                          variant="primary"
                          onClick={() => setShowModal(true)}
                          disabled={loadingAction}
                        >
                          Editar
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="danger"
                          onClick={() => setShowConfirm(true)}
                          disabled={loadingAction}
                        >
                          Eliminar
                        </Button>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            )}
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
    </div>
  );
};

export default ItemDetailPage;
