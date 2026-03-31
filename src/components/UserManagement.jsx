import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { userService } from '../services/userService';
import { UserList } from './UserList';
import { UserForm } from './UserForm';
import { UserProfileForm } from './UserProfileForm';
import { Modal } from './Modal';
import { ConfirmDialog } from './ConfirmDialog';
import { Card, Button, Alert } from 'react-bootstrap';
import { BsPeopleFill } from 'react-icons/bs';
import { translateError } from '../utils/errorTranslator';

export const UserManagement = () => {
  const { user, updateUser } = useAuth();
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingOwnProfile, setEditingOwnProfile] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const isAdmin = user?.role === 'ADMIN';

  const handleCreateUser = () => {
    setSelectedUser(null);
    setEditingOwnProfile(false);
    setShowModal(true);
  };

  const handleEditUserAsAdmin = (selectedUserData) => {
    setSelectedUser(selectedUserData);
    setEditingOwnProfile(false);
    setShowModal(true);
  };

  const handleEditOwnProfile = (selectedUserData) => {
    setSelectedUser(selectedUserData);
    setEditingOwnProfile(true);
    setShowModal(true);
  };

  const handleDeleteUser = (userId) => {
    setUserToDelete(userId);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage('');
    try {
      await userService.deleteUser(userToDelete);
      setShowConfirm(false);
      setUserToDelete(null);
      setRefreshKey(prev => prev + 1);
      setSuccessMessage('Usuario eliminado correctamente.');
    } catch (err) {
      setShowConfirm(false);
      setUserToDelete(null);
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleUserSubmit = async (formData) => {
    setLoading(true);
    setError(null);
    setSuccessMessage('');
    try {
      let updatedUser;
      if (selectedUser) {
        // Edit own profile from the user list using profile-only fields
        if (editingOwnProfile) {
          const updateData = {
            name: formData.name || null,
            username: formData.username || null,
            password: formData.password || null,
          };
          Object.keys(updateData).forEach(
            key => updateData[key] === null && delete updateData[key]
          );
          updatedUser = await userService.updateUser(selectedUser.id, updateData);
        } else if (isAdmin) {
          let updateData;
          updateData = {};

          // Only include fields we actually want to update
          if (formData.name) updateData.name = formData.name;
          if (formData.username) updateData.username = formData.username;
          if (formData.password) updateData.password = formData.password;
          if (formData.role) updateData.role = formData.role;

          // branch_id: only include if it changed
          const newBranchId = formData.branch_id ? parseInt(formData.branch_id) : null;
          const originalBranchId = selectedUser.branch_id || null;
          if (newBranchId !== originalBranchId) {
            updateData.branch_id = newBranchId;
          }

          // is_active: only include if it changed
          if (formData.is_active !== selectedUser.is_active) {
            updateData.is_active = formData.is_active;
          }

          console.log('Datos enviados al backend (admin update):', updateData);
          updatedUser = await userService.updateUserAdmin(selectedUser.id, updateData);
        } else {
          const updateData = {
            name: formData.name || null,
            username: formData.username || null,
            password: formData.password || null,
          };
          Object.keys(updateData).forEach(
            key => updateData[key] === null && delete updateData[key]
          );
          updatedUser = await userService.updateUser(selectedUser.id, updateData);
        }

        // If edited user is the current user, update the context
        if (selectedUser.id === user.id) {
          updateUser(updatedUser);
        }
      } else {
        // Create user
        const createData = {
          name: formData.name,
          username: formData.username,
          password: formData.password,
          role: formData.role,
          branch_id: formData.branch_id ? parseInt(formData.branch_id) : null,
        };
        await userService.createUser(createData);
        setSuccessMessage('Usuario creado correctamente.');
      }

      if (selectedUser) {
        setSuccessMessage('Usuario actualizado correctamente.');
      }

      setShowModal(false);
      setSelectedUser(null);
      setEditingOwnProfile(false);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  };

  const modalTitle = editingOwnProfile
    ? 'Editar Perfil'
    : (selectedUser ? 'Editar Usuario' : 'Nuevo Usuario');

  return (
    <Card className="shadow-sm border-0">
      <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
        <div>
          <Card.Title className="mb-0 d-flex align-items-center gap-2">
            <BsPeopleFill />
            Usuarios
          </Card.Title>
          <small className="text-white-50">Gestión de usuarios y perfiles</small>
        </div>
        {isAdmin && (
          <Button
            size="sm"
            onClick={handleCreateUser}
            style={{
              height: '36px',
              padding: '0.25rem 0.75rem',
              backgroundColor: '#198754',
              borderColor: '#198754',
              color: 'white',
              margin: '-0.25rem 0',
            }}
          >
            + Nuevo Usuario
          </Button>
        )}
      </Card.Header>
      <Card.Body>
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}
        {successMessage && (
          <Alert variant="success" onClose={() => setSuccessMessage('')} dismissible>
            {successMessage}
          </Alert>
        )}

        <UserList
          key={refreshKey}
          currentUserId={user.id}
          onEditOwnProfile={handleEditOwnProfile}
          onEditUserAsAdmin={handleEditUserAsAdmin}
          onDeleteUser={handleDeleteUser}
          isAdmin={isAdmin}
        />
      </Card.Body>

      {/* Modal for Creating/Editing Users */}
      <Modal
        isOpen={showModal}
        title={modalTitle}
        onClose={() => {
          setShowModal(false);
          setSelectedUser(null);
          setEditingOwnProfile(false);
          setError(null);
        }}
        size="lg"
      >
        {editingOwnProfile ? (
          <UserProfileForm
            user={selectedUser}
            onSubmit={handleUserSubmit}
            onCancel={() => {
              setShowModal(false);
              setSelectedUser(null);
              setEditingOwnProfile(false);
              setError(null);
            }}
            loading={loading}
            error={error}
            onErrorChange={setError}
          />
        ) : (
          <UserForm
            user={selectedUser}
            isAdmin={isAdmin}
            onSubmit={handleUserSubmit}
            onCancel={() => {
              setShowModal(false);
              setSelectedUser(null);
              setEditingOwnProfile(false);
              setError(null);
            }}
            loading={loading}
            error={error}
            onErrorChange={setError}
          />
        )}
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
    </Card>
  );
};
