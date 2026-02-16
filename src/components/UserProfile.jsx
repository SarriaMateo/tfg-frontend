import React, { useState } from 'react';
import { Alert, Card, Button, Row, Col } from 'react-bootstrap';
import { userService } from '../services/userService';
import { translateError } from '../utils/errorTranslator';
import { useAuth } from '../hooks/useAuth';
import { UserProfileForm } from './UserProfileForm';
import { Modal } from './Modal';

export const UserProfile = ({ user, onUserUpdated }) => {
  const { updateUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const getRoleColor = (role) => {
    const colors = {
      ADMIN: 'primary',
      MANAGER: '#20c997',
      EMPLOYEE: 'warning',
    };
    return colors[role] || 'secondary';
  };

  const handleEditProfile = () => {
    setShowModal(true);
  };

  const handleProfileSubmit = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const updatedUser = await userService.updateUser(user.id, formData);
      setSuccess(true);
      setShowModal(false);
      
      // Update auth context
      updateUser(updatedUser);
      
      // Call callback if exists
      if (onUserUpdated) {
        onUserUpdated(updatedUser);
      }
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {success && <Alert variant="success" onClose={() => setSuccess(false)} dismissible>¡Perfil actualizado correctamente!</Alert>}
      
      {!user ? (
        <Alert variant="info">No hay información de perfil disponible.</Alert>
      ) : (
        <Card className="shadow-sm">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="mb-0" style={{ fontWeight: '600' }}>Mi Perfil</h5>
              <Button
                variant="primary"
                size="sm"
                onClick={handleEditProfile}
                style={{ height: '32px', padding: '0.25rem 1rem' }}
              >
                Editar
              </Button>
            </div>

            <Row className="g-3">
              <Col md={6}>
                <div className="mb-3">
                  <label className="text-muted small mb-1" style={{ fontWeight: '500' }}>
                    Nombre
                  </label>
                  <div className="fw-500">{user.name || '-'}</div>
                </div>
              </Col>

              <Col md={6}>
                <div className="mb-3">
                  <label className="text-muted small mb-1" style={{ fontWeight: '500' }}>
                    Usuario
                  </label>
                  <div className="fw-500">{user.username || '-'}</div>
                </div>
              </Col>

              <Col md={6}>
                <div className="mb-3">
                  <label className="text-muted small mb-1" style={{ fontWeight: '500' }}>
                    Rol
                  </label>
                  <div>
                    <span
                      className={`badge ${user.role === 'MANAGER' ? '' : `bg-${getRoleColor(user.role)}`}`}
                      style={user.role === 'MANAGER' ? { backgroundColor: getRoleColor(user.role), color: 'white' } : {}}
                    >
                      {user.role}
                    </span>
                  </div>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Modal for Editing Profile */}
      <Modal 
        isOpen={showModal}
        title="Editar Perfil"
        onClose={() => {
          setShowModal(false);
          setError(null);
        }}
        size="lg"
      >
        <UserProfileForm
          user={user}
          onSubmit={handleProfileSubmit}
          onCancel={() => {
            setShowModal(false);
            setError(null);
          }}
          loading={loading}
          error={error}
          onErrorChange={setError}
        />
      </Modal>
    </>
  );
};

export default UserProfile;
