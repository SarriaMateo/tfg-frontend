import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';

export const BranchForm = ({ 
  branch, 
  onSubmit, 
  onCancel,
  loading = false,
  error: externalError = null,
  onErrorChange = null
}) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    is_active: true,
  });
  const [error, setError] = useState(null);

  // Use external error if available, otherwise internal error
  const displayError = externalError || error;

  useEffect(() => {
    if (branch) {
      setFormData({
        name: branch.name || '',
        address: branch.address || '',
        is_active: branch.is_active !== undefined ? branch.is_active : true,
      });
    }
  }, [branch]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear both internal and external errors
    setError(null);
    if (onErrorChange) {
      onErrorChange(null);
    }
  };

  const validateForm = () => {
    if (!formData.name || formData.name.trim().length < 3) {
      setError('El nombre debe tener al menos 3 caracteres');
      return false;
    }
    if (formData.name.trim().length > 100) {
      setError('El nombre no puede exceder 100 caracteres');
      return false;
    }
    if (!formData.address || formData.address.trim().length < 5) {
      setError('La dirección debe tener al menos 5 caracteres');
      return false;
    }
    if (formData.address.trim().length > 250) {
      setError('La dirección no puede exceder 250 caracteres');
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  const isCreating = !branch;

  const handleCloseError = () => {
    setError(null);
    if (onErrorChange) {
      onErrorChange(null);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {displayError && <Alert variant="danger" onClose={handleCloseError} dismissible>{displayError}</Alert>}

      <Form.Group className="mb-3">
        <Form.Label>Nombre <span className="text-danger">*</span></Form.Label>
        <Form.Control
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Nombre de la sede"
          disabled={loading}
          required
          minLength={3}
          maxLength={100}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Dirección <span className="text-danger">*</span></Form.Label>
        <Form.Control
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Dirección completa de la sede"
          disabled={loading}
          required
          minLength={5}
          maxLength={250}
        />
      </Form.Group>

      {!isCreating && (
        <Form.Group className="mb-3">
          <Form.Check
            type="checkbox"
            id="is_active"
            name="is_active"
            label="Sede activa"
            checked={formData.is_active}
            onChange={handleChange}
            disabled={loading}
            className="d-flex align-items-center user-active-check"
            style={{
              marginBottom: 0,
              gap: '6px',
            }}
          />
          <style>{`
            .user-active-check.form-check {
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
      )}

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
            isCreating ? 'Crear Sede' : 'Guardar Cambios'
          )}
        </Button>
      </div>
    </Form>
  );
};
