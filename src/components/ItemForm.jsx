import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { categoryService } from '../services/categoryService';
import { CategoryBadge } from './CategoryBadge';
import { CategoryModal } from './CategoryModal';
import { translateError } from '../utils/errorTranslator';

const UNITS = [
  { value: 'ud', label: 'Unidad' },
  { value: 'kg', label: 'Kilogramo' },
  { value: 'g', label: 'Gramo' },
  { value: 'l', label: 'Litro' },
  { value: 'ml', label: 'Mililitro' },
  { value: 'm', label: 'Metro' },
  { value: 'box', label: 'Caja' },
  { value: 'pack', label: 'Pack' }
];

const getTextColor = (hexColor) => {
  if (!hexColor || typeof hexColor !== 'string') {
    return '#ffffff';
  }

  const normalized = hexColor.replace('#', '');
  if (normalized.length !== 6) {
    return '#ffffff';
  }

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#1b1b1b' : '#ffffff';
};

export const ItemForm = ({ 
  item,
  initialCategoryIds = [],
  onSubmit, 
  onCancel,
  loading = false,
  error: externalError = null,
  onErrorChange = null
}) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    unit: 'ud',
    description: '',
    price: '',
    brand: '',
    image_url_form: '',
    is_active: true,
  });
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState(null);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);

  // Use external error if available, otherwise internal error
  const displayError = externalError || error;

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        sku: item.sku || '',
        unit: item.unit || 'ud',
        description: item.description || '',
        price: item.price || '',
        brand: item.brand || '',
        image_url_form: item.image_url || '',
        is_active: item.is_active !== undefined ? item.is_active : true,
      });
    }
  }, [item]);

  useEffect(() => {
    if (Array.isArray(initialCategoryIds)) {
      const normalizedIds = initialCategoryIds
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id));
      setSelectedCategories(normalizedIds);
    }
  }, [initialCategoryIds]);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const data = await categoryService.getCategories();
        setCategories(data);
      } catch (err) {
        console.error('Error loading categories:', err);
        setError(translateError(err));
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // When a new category is added, fetch updated list
  const handleCategoryAdded = () => {
    setShowCategoryModal(false);
    // Fetch updated categories
    const fetchCategories = async () => {
      try {
        const data = await categoryService.getCategories();
        setCategories(data);
      } catch (err) {
        console.error('Error refreshing categories:', err);
      }
    };
    fetchCategories();
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError(null);
    if (onErrorChange) {
      onErrorChange(null);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
    }
  };

  const handleCategoryToggle = (categoryId) => {
    const normalizedId = Number(categoryId);
    if (!Number.isFinite(normalizedId)) {
      return;
    }
    setSelectedCategories(prev => {
      if (prev.includes(normalizedId)) {
        return prev.filter(id => id !== normalizedId);
      } else {
        return [...prev, normalizedId];
      }
    });
    setError(null);
    if (onErrorChange) {
      onErrorChange(null);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('El nombre del artículo es obligatorio');
      return false;
    }
    if (formData.name.length > 100) {
      setError('El nombre no puede exceder 100 caracteres');
      return false;
    }
    if (!formData.sku.trim()) {
      setError('El SKU es obligatorio');
      return false;
    }
    if (formData.sku.length > 12) {
      setError('El SKU no puede exceder 12 caracteres');
      return false;
    }
    if (!/^[a-zA-Z0-9]+$/.test(formData.sku)) {
      setError('El SKU debe contener solo caracteres alfanuméricos');
      return false;
    }
    if (!formData.unit) {
      setError('La unidad de medida es obligatoria');
      return false;
    }
    if (formData.price && isNaN(parseFloat(formData.price))) {
      setError('El precio debe ser un número válido');
      return false;
    }
    if (formData.price && parseFloat(formData.price) < 0) {
      setError('El precio no puede ser negativo');
      return false;
    }
    if (formData.description && formData.description.length > 500) {
      setError('La descripción no puede exceder 500 caracteres');
      return false;
    }
    if (formData.brand && formData.brand.length > 100) {
      setError('La marca no puede exceder 100 caracteres');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Build FormData for multipart/form-data request
    const data = new FormData();
    data.append('name', formData.name);
    data.append('sku', formData.sku);
    data.append('unit', formData.unit);
    if (formData.description) data.append('description', formData.description);
    if (formData.price) data.append('price', parseFloat(formData.price));
    if (formData.brand) data.append('brand', formData.brand);
    if (formData.image_url_form && !imageFile) data.append('image_url_form', formData.image_url_form);
    if (imageFile) data.append('image', imageFile);
    if (item) data.append('is_active', formData.is_active);

    // Pass the FormData and selected categories to parent
    onSubmit(data, selectedCategories);
  };

  const isEditMode = !!item;
  const selectedCategoryObjects = categories.filter(cat => selectedCategories.includes(Number(cat.id)));

  return (
    <>
      <Form onSubmit={handleSubmit}>
      {displayError && (
        <Alert variant="danger" onClose={() => {
          setError(null);
          if (onErrorChange) onErrorChange(null);
        }} dismissible>
          {displayError}
        </Alert>
      )}

      {/* Basic Info */}
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Nombre <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nombre del artículo"
              maxLength={100}
              disabled={loading}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>SKU <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              placeholder="SKU único"
              maxLength={12}
              disabled={loading}
            />
            <Form.Text className="text-muted">
              Alfanumérico, máx. 12 caracteres. {formData.sku.length}/12
            </Form.Text>
          </Form.Group>
        </Col>
      </Row>

      {/* Unit, Brand, and Active Status */}
      {/* Unit and Brand */}
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Unidad de medida <span className="text-danger">*</span></Form.Label>
            <Form.Select
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              disabled={loading}
            >
              {UNITS.map(unit => (
                <option key={unit.value} value={unit.value}>{unit.label}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Marca</Form.Label>
            <Form.Control
              type="text"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              placeholder="Marca del artículo"
              maxLength={100}
              disabled={loading}
            />
          </Form.Group>
        </Col>
      </Row>

      {/* Price and Image */}
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Precio</Form.Label>
            <Form.Control
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              disabled={loading}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Imagen</Form.Label>
            <Form.Control
              type="file"
              name="image"
              onChange={handleImageChange}
              accept="image/*"
              disabled={loading}
            />
            <Form.Text className="text-muted">
              Formatos: JPG, PNG, WEBP. Tamaño máximo: 5MB
            </Form.Text>
          </Form.Group>
        </Col>
      </Row>

      {/* Active Status (Edit Mode Only) */}
      {isEditMode && (
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="is_active"
                name="is_active"
                label="Artículo activo"
                checked={formData.is_active}
                onChange={handleChange}
                disabled={loading}
                className="d-flex align-items-center item-active-check"
                style={{
                  marginBottom: 0,
                  gap: '6px',
                }}
              />
              <style>{`
                .item-active-check.form-check {
                  padding-left: 0 !important;
                  margin-left: 0 !important;
                }
                #is_active.form-check-input {
                  width: 14px !important;
                  height: 14px !important;
                  margin: 0 !important;
                  cursor: pointer;
                  flex-shrink: 0;
                  margin-top: 0 !important;
                }
                #is_active.form-check-input:disabled {
                  cursor: not-allowed;
                }
              `}</style>
            </Form.Group>
          </Col>
        </Row>
      )}


      {/* Description */}
      <Form.Group className="mb-3">
        <Form.Label>Descripción</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Descripción detallada del artículo..."
          maxLength={500}
          disabled={loading}
        />
      </Form.Group>

      {/* Categories */}
      <Form.Group className="mb-3">
        <Form.Label>Categorías</Form.Label>
        
        {loadingCategories ? (
          <div>
            <Spinner animation="border" size="sm" className="me-2" />
            Cargando categorías...
          </div>
        ) : (
          <>
            {/* Selected Categories Display */}
            <div
              className="mb-3 p-3"
              style={{
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                minHeight: '72px',
                display: 'flex',
                alignItems: selectedCategoryObjects.length > 0 ? 'flex-start' : 'center',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              {selectedCategoryObjects.length > 0 ? (
                selectedCategoryObjects.map(cat => (
                  <CategoryBadge 
                    key={cat.id}
                    category={cat}
                    onRemove={handleCategoryToggle}
                    removable={true}
                  />
                ))
              ) : (
                <p className="text-muted mb-0">Sin categorías asignadas</p>
              )}
            </div>

            {/* Available Categories */}
            <div className="d-flex gap-3 align-items-start">
              <div
                style={{
                  flex: 1,
                  maxHeight: '200px',
                  overflowY: 'auto',
                  border: '1px solid #ddd',
                  padding: '10px',
                  borderRadius: '4px',
                  backgroundColor: '#fff',
                }}
              >
                {categories.filter(cat => !selectedCategories.includes(Number(cat.id))).length > 0 ? (
                  categories
                    .filter(cat => !selectedCategories.includes(Number(cat.id)))
                    .map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategoryToggle(cat.id)}
                        disabled={loading}
                        className="badge"
                        style={{
                          backgroundColor: cat.color,
                          color: getTextColor(cat.color),
                          border: 'none',
                          cursor: 'pointer',
                          marginRight: '8px',
                          marginBottom: '8px',
                          padding: '6px 12px',
                        }}
                      >
                        {cat.name}
                      </button>
                    ))
                ) : (
                  <p className="text-muted mb-0">No hay categorías disponibles</p>
                )}
              </div>

              <div>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setShowCategoryModal(true)}
                  disabled={loading}
                >
                  + Nueva categoría
                </Button>
              </div>
            </div>
          </>
        )}
      </Form.Group>

      {/* Submit Buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
        width: '100%'
      }}>
        <Button 
          variant="secondary" 
          onClick={onCancel}
          disabled={loading}
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden'
          }}
        >
          Cancelar
        </Button>
        <Button 
          variant="primary" 
          type="submit"
          disabled={loading}
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden'
          }}
        >
          {loading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Guardando...
            </>
          ) : (
            isEditMode ? 'Actualizar artículo' : 'Crear artículo'
          )}
        </Button>
      </div>
      </Form>

      {/* Category Modal */}
      <CategoryModal
        isOpen={showCategoryModal}
        category={null}
        onClose={() => setShowCategoryModal(false)}
        onSave={async (categoryData) => {
          setSavingCategory(true);
          try {
            await categoryService.createCategory(categoryData);
            handleCategoryAdded();
          } catch (err) {
            const errorMessage = translateError(err);
            setError(errorMessage);
            setSavingCategory(false);
            // Re-throw error so CategoryModal can handle it
            throw new Error(errorMessage);
          } finally {
            setSavingCategory(false);
          }
        }}
        loading={savingCategory}
        error={error}
      />
    </>
  );
};

export default ItemForm;
