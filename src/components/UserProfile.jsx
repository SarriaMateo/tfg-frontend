import React, { useState } from 'react';
import { Card, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { userService } from '../services/userService';
import { translateError } from '../utils/errorTranslator';
import { useAuth } from '../hooks/useAuth';

export const UserProfile = ({ user, onUserUpdated }) => {
  const { updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const updateData = {
        name: formData.name || null,
        username: formData.username || null,
        password: formData.password || null,
      };

      // Remove null values
      Object.keys(updateData).forEach(
        key => updateData[key] === null && delete updateData[key]
      );

      const updatedUser = await userService.updateUser(user.id, updateData);
      setSuccess(true);
      setIsEditing(false);
      
      // Actualizar el contexto de autenticación con los nuevos datos
      updateUser(updatedUser);
      
      // Llamar al callback si existe
      if (onUserUpdated) {
        onUserUpdated(updatedUser);
      }
      
      // Reset password field
      setFormData(prev => ({
        ...prev,
        password: ''
      }));
    } catch (err) {
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-sm border-0 mb-4">
      <Card.Header className="bg-primary text-white">
        <Card.Title className="mb-0">Mi Perfil</Card.Title>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
        {success && <Alert variant="success" onClose={() => setSuccess(false)} dismissible>¡Perfil actualizado correctamente!</Alert>}

        {!isEditing ? (
          <>
            <div className="mb-3">
              <small className="text-muted">Nombre</small>
              <div className="fs-6">{user?.name}</div>
            </div>
            <div className="mb-3">
              <small className="text-muted">Usuario</small>
              <div className="fs-6">{user?.username}</div>
            </div>
            <div className="mb-3">
              <small className="text-muted">Rol</small>
              <div className="fs-6">
                <span 
                  className={`badge ${user?.role === 'MANAGER' ? '' : user?.role === 'ADMIN' ? 'bg-primary' : 'bg-warning'}`}
                  style={user?.role === 'MANAGER' ? { backgroundColor: '#20c997', color: 'white' } : {}}
                >
                  {user?.role}
                </span>
              </div>
            </div>
            <Button 
              variant="primary"
              onClick={() => setIsEditing(true)}
              className="w-100"
            >
              Editar Perfil
            </Button>
          </>
        ) : (
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Deja vacío para no cambiar"
                disabled={loading}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Usuario</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Deja vacío para no cambiar"
                disabled={loading}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Nueva Contraseña</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Deja vacío para no cambiar"
                disabled={loading}
              />
            </Form.Group>

            <div className="d-flex gap-2">
              <Button 
                variant="secondary"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    name: user?.name || '',
                    username: user?.username || '',
                    password: '',
                  });
                  setError(null);
                }}
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
        )}
      </Card.Body>
    </Card>
  );
};
