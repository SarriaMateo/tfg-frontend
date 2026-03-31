import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Spinner, Dropdown } from 'react-bootstrap';
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
  const [hexInput, setHexInput] = useState(CATEGORY_COLORS[0].hex);
  const [hexError, setHexError] = useState(false);
  const [error, setError] = useState(null);

  // Use external error if available, otherwise internal error
  const displayError = externalError || error;

  useEffect(() => {
    if (category) {
      const color = category.color || CATEGORY_COLORS[0].hex;
      setFormData({
        name: category.name || '',
        color: color,
      });
      setHexInput(color);
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

  const handleColorSelect = (color) => {
    setFormData(prev => ({
      ...prev,
      color: color
    }));
    setHexInput(color);
    setHexError(false);
    // Clear errors
    setError(null);
    if (onErrorChange) {
      onErrorChange(null);
    }
  };

  const handleHexInputChange = (e) => {
    let value = e.target.value.trim();
    
    // Add # if not present
    if (value && !value.startsWith('#')) {
      value = '#' + value;
    }
    
    setHexInput(value);
    
    // Validate HEX format in real-time
    const colorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (colorRegex.test(value)) {
      setFormData(prev => ({
        ...prev,
        color: value.toUpperCase()
      }));
      setHexError(false);
      setError(null);
      if (onErrorChange) {
        onErrorChange(null);
      }
    } else {
      setHexError(true);
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
    // Validate color format
    const colorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!colorRegex.test(formData.color)) {
      setError('El color debe estar en formato hexadecimal válido (#RRGGBB)');
      setHexError(true);
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
        <div className="d-flex gap-2 align-items-start">
          {/* Color Picker Dropdown with 3x3 Grid */}
          <Dropdown>
            <Dropdown.Toggle
              variant="light"
              id="color-picker-dropdown"
              disabled={loading}
              style={{
                width: '200px',
                border: '1px solid #ced4da',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: '38px',
                padding: '0.375rem 0.75rem',
              }}
            >
              <span>Seleccionar color</span>
            </Dropdown.Toggle>

            <Dropdown.Menu style={{ padding: '10px', minWidth: '180px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                }}
              >
                {CATEGORY_COLORS.map((colorOption) => (
                  <div
                    key={colorOption.hex}
                    onClick={() => handleColorSelect(colorOption.hex)}
                    style={{
                      backgroundColor: colorOption.hex,
                      width: '45px',
                      height: '45px',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      border: formData.color === colorOption.hex ? '3px solid #000' : '2px solid #ddd',
                      boxShadow: formData.color === colorOption.hex ? '0 0 5px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
                      transition: 'all 0.2s ease',
                    }}
                    title={colorOption.name}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  />
                ))}
              </div>
            </Dropdown.Menu>
          </Dropdown>

          {/* Manual HEX Input */}
          <div className="flex-grow-1">
            <Form.Control
              type="text"
              value={hexInput}
              onChange={handleHexInputChange}
              placeholder="#RRGGBB"
              maxLength={7}
              disabled={loading}
              isInvalid={hexError}
              style={{ textTransform: 'uppercase', height: '38px' }}
            />
            {hexError && (
              <Form.Text className="text-danger" style={{ fontSize: '0.8rem' }}>
                Formato inválido. Usa #RRGGBB (ej: #FF6B6B)
              </Form.Text>
            )}
          </div>

          {/* Color Preview */}
          <div
            style={{
              backgroundColor: formData.color,
              width: '50px',
              height: '38px',
              borderRadius: '4px',
              border: '2px solid #ddd',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              flexShrink: 0,
            }}
            title={formData.color}
          />
        </div>
      </Form.Group>

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
            isEditMode ? 'Actualizar Categoría' : 'Crear Categoría'
          )}
        </Button>
      </div>
    </Form>
  );
};

export default CategoryForm;
