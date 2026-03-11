import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { userService } from '../services/userService';
import { companyService } from '../services/companyService';
import { translateError } from '../utils/errorTranslator';

export const UserForm = ({ 
  user, 
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
    is_active: true,
  });
  const [error, setError] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const selectControlStyle = { minHeight: '49px' };

  // Use external error if available, otherwise internal error
  const displayError = externalError || error;

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        username: user.username || '',
        password: '',
        role: user.role || 'EMPLOYEE',
        branch_id: user.branch_id || '',
        is_active: user.is_active !== undefined ? user.is_active : true,
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchBranches = async () => {
      if (isAdmin) {
        setLoadingBranches(true);
        try {
          const data = await companyService.getCompanyBranches();
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
  }, [isAdmin]);

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

      <Row>
        <Col md={6}>
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
        </Col>

        <Col md={6}>
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
        </Col>
      </Row>

      {isAdmin && (
        <>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Rol <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  disabled={loading}
                  required
                  style={selectControlStyle}
                >
                  <option value="EMPLOYEE">EMPLOYEE</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="ADMIN">ADMIN</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Sede</Form.Label>
                <Form.Select
                  name="branch_id"
                  value={formData.branch_id}
                  onChange={handleChange}
                  disabled={loading || loadingBranches}
                  style={selectControlStyle}
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
            </Col>
          </Row>

          {!isCreating && (
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="is_active"
                name="is_active"
                label="Usuario activo"
                checked={formData.is_active}
                onChange={handleChange}
                disabled={loading}
              />
            </Form.Group>
          )}
        </>
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
            isCreating ? 'Crear Usuario' : 'Guardar Cambios'
          )}
        </Button>
      </div>
    </Form>
  );
};
