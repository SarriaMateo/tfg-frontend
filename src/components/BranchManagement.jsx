import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { branchService } from '../services/branchService';
import { BranchList } from './BranchList';
import { BranchForm } from './BranchForm';
import { Modal } from './Modal';
import { ConfirmDialog } from './ConfirmDialog';
import { Card, Button, Alert } from 'react-bootstrap';
import { translateError } from '../utils/errorTranslator';

export const BranchManagement = () => {
  const { user } = useAuth();
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const isAdmin = user?.role === 'ADMIN';

  const handleCreateBranch = () => {
    setSelectedBranch(null);
    setShowModal(true);
  };

  const handleEditBranch = (branchData) => {
    setSelectedBranch(branchData);
    setShowModal(true);
  };

  const handleDeleteBranch = (branchId) => {
    setBranchToDelete(branchId);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      await branchService.deleteBranch(branchToDelete);
      setSuccess(true);
      setShowConfirm(false);
      setBranchToDelete(null);
      setRefreshKey(prev => prev + 1);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleBranchSubmit = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      if (selectedBranch) {
        // Edit branch
        const updateData = {
          name: formData.name,
          address: formData.address,
        };
        await branchService.updateBranch(selectedBranch.id, updateData);
      } else {
        // Create branch
        const createData = {
          name: formData.name,
          address: formData.address,
        };
        await branchService.createBranch(createData);
      }

      setSuccess(true);
      setShowModal(false);
      setSelectedBranch(null);
      setRefreshKey(prev => prev + 1);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-sm border-0">
      <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
        <Card.Title className="mb-0">Gestión de Sedes</Card.Title>
        {isAdmin && (
          <Button 
            size="sm"
            onClick={handleCreateBranch}
            style={{ height: '32px', padding: '0.25rem 0.75rem', backgroundColor: '#198754', borderColor: '#198754', color: 'white' }}
          >
            + Nueva Sede
          </Button>
        )}
      </Card.Header>
      <Card.Body>
        {success && <Alert variant="success" onClose={() => setSuccess(false)} dismissible>¡Operación completada correctamente!</Alert>}
        {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

        <BranchList 
          key={refreshKey}
          onEditBranch={handleEditBranch}
          onDeleteBranch={handleDeleteBranch}
          canModify={isAdmin}
        />
      </Card.Body>

      {/* Modal for Creating/Editing Branches */}
      <Modal 
        isOpen={showModal}
        title={selectedBranch ? 'Editar Sede' : 'Crear Nueva Sede'}
        onClose={() => {
          setShowModal(false);
          setSelectedBranch(null);
          setError(null);
        }}
        size="lg"
      >
        <BranchForm
          branch={selectedBranch}
          onSubmit={handleBranchSubmit}
          onCancel={() => {
            setShowModal(false);
            setSelectedBranch(null);
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
        title="Eliminar Sede"
        message="¿Estás seguro de que deseas eliminar esta sede? Esta acción no se puede deshacer."
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowConfirm(false);
          setBranchToDelete(null);
        }}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </Card>
  );
};
