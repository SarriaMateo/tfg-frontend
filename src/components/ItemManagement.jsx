import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAuthorization } from '../hooks/useAuthorization';
import { itemService } from '../services/itemService';
import { categoryService } from '../services/categoryService';
import { ItemListTable } from './ItemListTable';
import { ItemModal } from './ItemModal';
import { CategoryManagementModal } from './CategoryManagementModal';
import { ConfirmDialog } from './ConfirmDialog';
import { Card, Button, Alert } from 'react-bootstrap';
import { translateError } from '../utils/errorTranslator';
import { BsFillTagsFill, BsBox } from 'react-icons/bs';

export const ItemManagement = ({ items = [], loading: listLoading = false, error: listError = null, pagination = {}, currentQuery = {}, onFetchItems = () => {} }) => {
  const { user } = useAuth();
  const { hasAnyRole, hasRole } = useAuthorization();
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Check permissions: only MANAGER+ can create/edit items, only ADMIN can delete
  const canCreateEdit = hasAnyRole(['MANAGER', 'ADMIN']);
  const canDelete = hasRole('ADMIN');

  const handleCreateItem = () => {
    setSelectedItem(null);
    setShowModal(true);
  };

  const handleEditItem = (itemData) => {
    setSelectedItem(itemData);
    setShowModal(true);
  };

  const handleDeleteItem = (itemId) => {
    setItemToDelete(itemId);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      await itemService.deleteItem(itemToDelete);
      setSuccess(true);
      setShowConfirm(false);
      setItemToDelete(null);
      setRefreshKey(prev => prev + 1);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleItemSubmit = async (formData, categoryIds) => {
    setLoading(true);
    setError(null);
    try {
      let updatedItem;
      if (selectedItem) {
        // Edit item
        updatedItem = await itemService.updateItem(selectedItem.id, formData);
      } else {
        // Create item
        updatedItem = await itemService.createItem(formData);
      }

      // Assign categories to the item (including empty array to clear)
      if (Array.isArray(categoryIds)) {
        await categoryService.assignCategoriesToItem(updatedItem.id, categoryIds);
      }

      setSuccess(true);
      setShowModal(false);
      setSelectedItem(null);
      setRefreshKey(prev => prev + 1);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const errorMessage = translateError(err);
      setError(errorMessage);
      setLoading(false);
      // Re-throw error so ItemModal can handle it
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Items Management Section */}
      <Card className="shadow-sm border-0">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center py-3">
          <Card.Title as="h4" className="mb-0"><BsBox className="me-2" style={{ marginBottom: '2px' }} />Artículos</Card.Title>
          <div className="d-flex gap-2">
            <Button
              variant="info"
              size="sm"
              onClick={() => setShowCategoryModal(true)}
              style={{ height: '36px', padding: '0.25rem 0.75rem', margin: '-0.25rem 0' }}
            >
              <BsFillTagsFill /> Categorías
            </Button>
            {canCreateEdit && (
              <Button
                size="sm"
                onClick={handleCreateItem}
                style={{ height: '36px', padding: '0.25rem 0.75rem', backgroundColor: '#198754', borderColor: '#198754', color: 'white', margin: '-0.25rem 0' }}
              >
                + Nuevo Artículo
              </Button>
            )}
          </div>
        </Card.Header>
        <Card.Body>
          {success && (
            <Alert variant="success" onClose={() => setSuccess(false)} dismissible>
              ¡Operación completada correctamente!
            </Alert>
          )}

          {error && (
            <Alert variant="danger" onClose={() => setError(null)} dismissible>
              {error}
            </Alert>
          )}

          <ItemListTable
            items={items}
            loading={listLoading}
            error={listError}
            pagination={pagination}
            initialQuery={currentQuery}
            onFetchItems={onFetchItems}
          />
        </Card.Body>
      </Card>

      {/* Modal for Creating/Editing Items */}
      <ItemModal
        isOpen={showModal}
        item={selectedItem}
        onClose={() => {
          setShowModal(false);
          setSelectedItem(null);
          setError(null);
        }}
        onSave={handleItemSubmit}
        loading={loading}
        error={error}
      />

      {/* Category Management Modal */}
      <CategoryManagementModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        title="Eliminar Artículo"
        message="¿Estás seguro de que deseas eliminar este artículo? Esta acción no se puede deshacer."
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowConfirm(false);
          setItemToDelete(null);
        }}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};

export default ItemManagement;
