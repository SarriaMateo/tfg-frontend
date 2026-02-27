import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { userService } from '../services/userService';
import { UserProfile } from './UserProfile';
import { UserList } from './UserList';
import { UserForm } from './UserForm';
import { Modal } from './Modal';
import { ConfirmDialog } from './ConfirmDialog';
import { Card, Button, Alert } from 'react-bootstrap';
import { translateError } from '../utils/errorTranslator';

export const UserManagement = () => {
  const { user, updateUser } = useAuth();
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const isAdmin = user?.role === 'ADMIN';

  const handleCreateUser = () => {
    setSelectedUser(null);
    setShowModal(true);
  };

  const handleEditUser = (selectedUserData) => {
    setSelectedUser(selectedUserData);
    setShowModal(true);
  };

  const handleDeleteUser = (userId, onSuccessCallback) => {
    setUserToDelete(userId);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      await userService.deleteUser(userToDelete);
      setSuccess(true);
      setShowConfirm(false);
      setUserToDelete(null);
      setRefreshKey(prev => prev + 1);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleUserSubmit = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      let updatedUser;
      if (selectedUser) {
        // Editar usuario
        let updateData;
        if (isAdmin) {
          updateData = {};

          // Solo incluir campos que realmente queremos actualizar
          if (formData.name) updateData.name = formData.name;
          if (formData.username) updateData.username = formData.username;
          if (formData.password) updateData.password = formData.password;
          if (formData.role) updateData.role = formData.role;

          // branch_id: solo incluir si ha cambiado
          const newBranchId = formData.branch_id ? parseInt(formData.branch_id) : null;
          const originalBranchId = selectedUser.branch_id || null;
          if (newBranchId !== originalBranchId) {
            updateData.branch_id = newBranchId;
          }

          // is_active: solo incluir si ha cambiado
          if (formData.is_active !== selectedUser.is_active) {
            updateData.is_active = formData.is_active;
          }

          console.log('Datos enviados al backend (admin update):', updateData);
          updatedUser = await userService.updateUserAdmin(selectedUser.id, updateData);
        } else {
          updateData = {
            name: formData.name || null,
            username: formData.username || null,
            password: formData.password || null,
          };
          Object.keys(updateData).forEach(
            key => updateData[key] === null && delete updateData[key]
          );
          updatedUser = await userService.updateUser(selectedUser.id, updateData);
        }

        // Si el usuario editado es el usuario actual, actualizar el contexto
        if (selectedUser.id === user.id) {
          updateUser(updatedUser);
        }
      } else {
        // Crear usuario
        const createData = {
          name: formData.name,
          username: formData.username,
          password: formData.password,
          role: formData.role,
          branch_id: formData.branch_id ? parseInt(formData.branch_id) : null,
        };
        await userService.createUser(createData);
      }

      setSuccess(true);
      setShowModal(false);
      setSelectedUser(null);
      setRefreshKey(prev => prev + 1);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Mi Perfil Section */}
      <UserProfile user={user} onUserUpdated={() => setRefreshKey(prev => prev + 1)} />

      {/* Gestión de Usuarios Section (only for ADMINs) */}
      {isAdmin && (
        <div className="mt-3">
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
              <Card.Title className="mb-0">Gestión de Usuarios</Card.Title>
              <Button
                size="sm"
                onClick={handleCreateUser}
                style={{ height: '32px', padding: '0.25rem 0.75rem', backgroundColor: '#198754', borderColor: '#198754', color: 'white' }}
              >
                + Nuevo Usuario
              </Button>
            </Card.Header>
            <Card.Body>
              {success && <Alert variant="success" onClose={() => setSuccess(false)} dismissible>¡Operación completada correctamente!</Alert>}

              <UserList
                key={refreshKey}
                currentUserId={user.id}
                onEditUser={handleEditUser}
                onDeleteUser={handleDeleteUser}
              />
            </Card.Body>
          </Card>
        </div>
      )}

      {/* Modal for Creating/Editing Users */}
      <Modal
        isOpen={showModal}
        title={selectedUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
        onClose={() => {
          setShowModal(false);
          setSelectedUser(null);
          setError(null);
        }}
        size="lg"
      >
        <UserForm
          user={selectedUser}
          isAdmin={isAdmin}
          onSubmit={handleUserSubmit}
          onCancel={() => {
            setShowModal(false);
            setSelectedUser(null);
            setError(null);
          }}
          loading={loading}
          error={error}
          onErrorChange={setError}
        />
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        title="Eliminar Usuario"
        message="¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer."
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowConfirm(false);
          setUserToDelete(null);
        }}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};
