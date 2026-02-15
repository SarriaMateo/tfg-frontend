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
  });
  const [error, setError] = useState(null);

  // Use external error if available, otherwise internal error
  const displayError = externalError || error;

  useEffect(() => {
    if (branch) {
      setFormData({
        name: branch.name || '',
        address: branch.address || '',
      });
    }
  }, [branch]);

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

      <div className="d-flex gap-2">
        <Button 
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
          className="flex-grow-1"
        >
          Cancelar
        </Button>
        <Button 
          variant="primary"
          type="submit"
          disabled={loading}
          className="flex-grow-1"
        >
          {loading ? <><Spinner size="sm" className="me-2" />Guardando...</> : (isCreating ? 'Crear Sede' : 'Guardar Cambios')}
        </Button>
      </div>
    </Form>
  );
};
