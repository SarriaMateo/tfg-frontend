import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { CATEGORY_COLORS } from '../constants/colors';
import { translateError } from '../utils/errorTranslator';

export const CategoryForm = ({ 
  category,
  onSubmit, 
  onCancel,
  loading = false,
  error: externalError = null,
  onErrorChange = null
}) => {
  const [formData, setFormData] = useState({
    name: '',
    color: CATEGORY_COLORS[0].hex,
  });
  const [error, setError] = useState(null);

  // Use external error if available, otherwise internal error
  const displayError = externalError || error;

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        color: category.color || CATEGORY_COLORS[0].hex,
      });
    }
  }, [category]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear both internal and external errors
    setError(null);
    if (onErrorChange) {
      onErrorChange(null);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('El nombre de la categoría es obligatorio');
      return false;
    }
    if (formData.name.length < 1) {
      setError('El nombre debe tener al menos 1 carácter');
      return false;
    }
    if (formData.name.length > 50) {
      setError('El nombre no puede exceder 50 caracteres');
      return false;
    }
    // Validate color format (should already be in correct format from dropdown)
    const colorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!colorRegex.test(formData.color)) {
      setError('El color debe estar en formato hexadecimal válido');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    onSubmit(formData);
  };

  const isEditMode = !!category;

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

      <Form.Group className="mb-3">
        <Form.Label>Nombre</Form.Label>
        <Form.Control
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Nombre de la categoría"
          maxLength={50}
          disabled={loading}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Color</Form.Label>
        <div className="d-flex gap-2 align-items-center">
          <Form.Select
            name="color"
            value={formData.color}
            onChange={handleChange}
            disabled={loading}
          >
            {CATEGORY_COLORS.map((colorOption) => (
              <option key={colorOption.hex} value={colorOption.hex}>
                {colorOption.name}
              </option>
            ))}
          </Form.Select>
          <div
            style={{
              backgroundColor: formData.color,
              width: '40px',
              height: '40px',
              borderRadius: '4px',
              border: '1px solid #ddd',
            }}
            title={formData.color}
          />
        </div>
      </Form.Group>

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
            isEditMode ? 'Actualizar categoría' : 'Crear categoría'
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
    </Form>
  );
};

export default CategoryForm;
