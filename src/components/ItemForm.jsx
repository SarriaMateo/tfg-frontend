import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { categoryService } from '../services/categoryService';
import { CategoryBadge } from './CategoryBadge';
import { CategoryModal } from './CategoryModal';
import { translateError } from '../utils/errorTranslator';

const UNITS = ['ud', 'kg', 'g', 'l', 'ml', 'm', 'box', 'pack'];

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
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState(null);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

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
      if (item.image_url) {
        setImagePreview(item.image_url);
      }
    }
  }, [item]);

  useEffect(() => {
    if (Array.isArray(initialCategoryIds)) {
      setSelectedCategories(initialCategoryIds);
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
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCategoryToggle = (categoryId) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
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
  const selectedCategoryObjects = categories.filter(cat => selectedCategories.includes(cat.id));

  return (
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
            <Form.Label>Nombre del artículo <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej: Laptop Dell XPS 13"
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
              placeholder="Ej: XPS13ABC123"
              maxLength={12}
              disabled={loading}
            />
            <Form.Text className="text-muted">
              Alfanumérico, máx. 12 caracteres. {formData.sku.length}/12
            </Form.Text>
          </Form.Group>
        </Col>
      </Row>

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
                <option key={unit} value={unit}>{unit}</option>
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
              placeholder="Ej: Dell"
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
              Formatos: JPG, PNG, WEBP. Tamaño máximo: 5MB.
            </Form.Text>
          </Form.Group>
        </Col>
      </Row>

      {/* Image Preview */}
      {imagePreview && (
        <Form.Group className="mb-3">
          <Form.Label>Vista previa de imagen</Form.Label>
          <div>
            <img 
              src={imagePreview} 
              alt="Preview"
              style={{
                maxWidth: '150px',
                maxHeight: '150px',
                borderRadius: '4px',
                border: '1px solid #ddd',
              }}
            />
          </div>
        </Form.Group>
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
        <Form.Label>Categorías <span className="text-danger">*</span></Form.Label>
        
        {loadingCategories ? (
          <div>
            <Spinner animation="border" size="sm" className="me-2" />
            Cargando categorías...
          </div>
        ) : (
          <>
            {/* Selected Categories Display */}
            {selectedCategoryObjects.length > 0 && (
              <div className="mb-3 p-3" style={{ backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                {selectedCategoryObjects.map(cat => (
                  <CategoryBadge 
                    key={cat.id}
                    category={cat}
                    onRemove={handleCategoryToggle}
                    removable={true}
                  />
                ))}
              </div>
            )}

            {/* Category Checkboxes */}
            {categories.length > 0 ? (
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px', borderRadius: '4px' }}>
                {categories.map(cat => (
                  <Form.Check
                    key={cat.id}
                    type="checkbox"
                    id={`category-${cat.id}`}
                    label={
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            width: '16px',
                            height: '16px',
                            backgroundColor: cat.color,
                            borderRadius: '3px',
                            border: '1px solid #ddd',
                          }}
                        />
                        {cat.name}
                      </div>
                    }
                    checked={selectedCategories.includes(cat.id)}
                    onChange={() => handleCategoryToggle(cat.id)}
                    disabled={loading}
                    className="mb-2"
                  />
                ))}
              </div>
            ) : (
              <p className="text-muted">No hay categorías disponibles</p>
            )}

            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => setShowCategoryModal(true)}
              disabled={loading}
              className="mt-2"
            >
              + Añadir nueva categoría
            </Button>
          </>
        )}
      </Form.Group>

      {/* Active Status (Edit Mode Only) */}
      {isEditMode && (
        <Form.Group className="mb-3">
          <Form.Check
            type="checkbox"
            id="is_active"
            name="is_active"
            label="Artículo activo"
            checked={formData.is_active}
            onChange={handleChange}
            disabled={loading}
          />
        </Form.Group>
      )}

      {/* Submit Buttons */}
      <div className="d-flex gap-2">
        <Button 
          variant="primary" 
          type="submit"
          disabled={loading}
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
        <Button 
          variant="secondary" 
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
      </div>

      {/* Category Modal */}
      <CategoryModal
        isOpen={showCategoryModal}
        category={null}
        onClose={() => setShowCategoryModal(false)}
        onSave={async (categoryData) => {
          try {
            await categoryService.createCategory(categoryData);
            handleCategoryAdded();
          } catch (err) {
            setError(translateError(err));
          }
        }}
        loading={loading}
      />
    </Form>
  );
};

export default ItemForm;
