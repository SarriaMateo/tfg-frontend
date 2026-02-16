import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';

export const CompanyForm = ({ 
  company, 
  onSubmit, 
  onCancel,
  loading = false,
  error: externalError = null,
  onErrorChange = null
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    nif: '',
  });
  const [nifChanged, setNifChanged] = useState(false);
  const [error, setError] = useState(null);

  // Use external error if available, otherwise internal error
  const displayError = externalError || error;

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        email: company.email || '',
        nif: company.nif || '',
      });
      setNifChanged(false);
    }
  }, [company]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Track if NIF has been modified
    if (name === 'nif') {
      setNifChanged(true);
    }
    
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
    if (formData.name.trim().length > 50) {
      setError('El nombre no puede exceder 50 caracteres');
      return false;
    }
    
    if (!formData.email || formData.email.trim().length === 0) {
      setError('El email es obligatorio');
      return false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('El email no es válido');
      return false;
    }

    if (formData.email.trim().length > 50) {
      setError('El email no puede exceder 50 caracteres');
      return false;
    }

    // NIF validation (optional field, but if provided must be valid)
    // Spanish NIF format: 1 letter + 8 digits
    if (formData.nif && formData.nif.trim().length > 0) {
      const nifRegex = /^[A-Z][0-9]{8}$/i;
      if (!nifRegex.test(formData.nif.trim())) {
        setError('El NIF debe tener el formato: 1 letra seguida de 8 dígitos (ej: A12345678)');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Prepare data to submit
    const submitData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
    };

    // Only include NIF if it has been changed
    if (nifChanged) {
      submitData.nif = formData.nif.trim() || null;
    }

    onSubmit(submitData);
  };

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
        <Form.Label>Nombre de la Empresa <span className="text-danger">*</span></Form.Label>
        <Form.Control
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Nombre de la empresa"
          disabled={loading}
          required
          minLength={3}
          maxLength={50}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Email <span className="text-danger">*</span></Form.Label>
        <Form.Control
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="email@empresa.com"
          disabled={loading}
          required
          maxLength={50}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>NIF</Form.Label>
        <Form.Control
          type="text"
          name="nif"
          value={formData.nif}
          onChange={handleChange}
          placeholder="A12345678"
          disabled={loading}
          minLength={9}
          maxLength={9}
        />
        <Form.Text className="text-muted">
          Campo opcional. Formato: 1 letra seguida de 8 dígitos. Si se deja vacío, se eliminará el NIF actual.
        </Form.Text>
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
          {loading ? <><Spinner size="sm" className="me-2" />Guardando...</> : 'Guardar Cambios'}
        </Button>
      </div>
    </Form>
  );
};
