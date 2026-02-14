import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { userService } from '../services/userService';
import { companyService } from '../services/companyService';
import { translateError } from '../utils/errorTranslator';

export const UserForm = ({ 
  user, 
  companyId, 
  isAdmin, 
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
    role: 'EMPLOYEE',
    branch_id: '',
  });
  const [error, setError] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  // Usar el error externo si está disponible, sino el error interno
  const displayError = externalError || error;

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        username: user.username || '',
        password: '',
        role: user.role || 'EMPLOYEE',
        branch_id: user.branch_id || '',
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchBranches = async () => {
      if (isAdmin && companyId) {
        setLoadingBranches(true);
        try {
          const data = await companyService.getCompanyBranches(companyId);
          setBranches(data);
        } catch (err) {
          console.error('Error al cargar sedes:', err);
          setError(translateError(err));
        } finally {
          setLoadingBranches(false);
        }
      }
    };

    fetchBranches();
  }, [isAdmin, companyId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar tanto el error interno como el externo
    setError(null);
    if (onErrorChange) {
      onErrorChange(null);
    }
  };

  const validateForm = () => {
    if (!user && !formData.password) {
      setError('La contraseña es obligatoria para usuarios nuevos');
      return false;
    }
    if (!formData.name) {
      setError('El nombre es obligatorio');
      return false;
    }
    if (!formData.username) {
      setError('El usuario es obligatorio');
      return false;
    }
    if (isAdmin && !formData.role) {
      setError('El rol es obligatorio');
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

  const isCreating = !user;

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
          placeholder="Nombre del usuario"
          disabled={loading}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Usuario <span className="text-danger">*</span></Form.Label>
        <Form.Control
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="Nombre de usuario único"
          disabled={loading}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>
          Contraseña {isCreating && <span className="text-danger">*</span>}
        </Form.Label>
        <Form.Control
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder={isCreating ? "Contraseña" : "Dejar vacío para mantener la actual"}
          disabled={loading}
          required={isCreating}
        />
      </Form.Group>

      {isAdmin && (
        <>
          <Form.Group className="mb-3">
            <Form.Label>Rol <span className="text-danger">*</span></Form.Label>
            <Form.Select
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
              required
            >
              <option value="EMPLOYEE">EMPLOYEE</option>
              <option value="MANAGER">MANAGER</option>
              <option value="ADMIN">ADMIN</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Sede</Form.Label>
            <Form.Select
              name="branch_id"
              value={formData.branch_id}
              onChange={handleChange}
              disabled={loading || loadingBranches}
            >
              <option value="">Sin sede asignada</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </Form.Select>
            {loadingBranches && (
              <Form.Text className="text-muted">
                <Spinner size="sm" className="me-1" />
                Cargando sedes...
              </Form.Text>
            )}
          </Form.Group>
        </>
      )}

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
          {loading ? <><Spinner size="sm" className="me-2" />Guardando...</> : (isCreating ? 'Crear Usuario' : 'Guardar Cambios')}
        </Button>
      </div>
    </Form>
  );
};
