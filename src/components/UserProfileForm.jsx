import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';

export const UserProfileForm = ({ 
  user, 
  onSubmit, 
  onCancel,
  loading = false,
  error: externalError = null,
  onErrorChange = null
}) => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
  });
  const [error, setError] = useState(null);

  // Use external error if available, otherwise internal error
  const displayError = externalError || error;

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        username: user.username || '',
        password: '',
      });
    }
  }, [user]);

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
    if (formData.name && formData.name.trim().length < 3) {
      setError('El nombre debe tener al menos 3 caracteres');
      return false;
    }
    if (formData.name && formData.name.trim().length > 50) {
      setError('El nombre no puede exceder 50 caracteres');
      return false;
    }

    if (formData.username && formData.username.trim().length < 3) {
      setError('El usuario debe tener al menos 3 caracteres');
      return false;
    }
    if (formData.username && formData.username.trim().length > 50) {
      setError('El usuario no puede exceder 50 caracteres');
      return false;
    }

    if (formData.password && formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return false;
    }
    if (formData.password && formData.password.length > 72) {
      setError('La contraseña no puede exceder 72 caracteres');
      return false;
    }

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Prepare data to submit - only send fields that have values
    const submitData = {};
    if (formData.name && formData.name.trim()) {
      submitData.name = formData.name.trim();
    }
    if (formData.username && formData.username.trim()) {
      submitData.username = formData.username.trim();
    }
    if (formData.password) {
      submitData.password = formData.password;
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
        <Form.Label>Nombre</Form.Label>
        <Form.Control
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Tu nombre"
          disabled={loading}
          minLength={3}
          maxLength={50}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Usuario</Form.Label>
        <Form.Control
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="Tu nombre de usuario"
          disabled={loading}
          minLength={3}
          maxLength={50}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Nueva Contraseña</Form.Label>
        <Form.Control
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Tu nueva contraseña"
          disabled={loading}
          minLength={8}
          maxLength={72}
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
          {loading ? <><Spinner size="sm" className="me-2" />Guardando...</> : 'Guardar Cambios'}
        </Button>
      </div>
    </Form>
  );
};
