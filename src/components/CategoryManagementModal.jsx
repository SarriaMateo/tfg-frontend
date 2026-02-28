import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { CategoryList } from './CategoryList';
import { CategoryModal } from './CategoryModal';
import { ConfirmDialog } from './ConfirmDialog';
import { Button, Alert } from 'react-bootstrap';
import { useAuthorization } from '../hooks/useAuthorization';
import { categoryService } from '../services/categoryService';
import { translateError } from '../utils/errorTranslator';

export const CategoryManagementModal = ({ isOpen, onClose }) => {
  const { hasAnyRole, hasRole } = useAuthorization();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // State for create/edit category modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryModalLoading, setCategoryModalLoading] = useState(false);
  const [categoryModalError, setCategoryModalError] = useState(null);
  
  // State for delete confirmation
  const [showConfirm, setShowConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  // Check permissions
  const canCreateEdit = hasAnyRole(['MANAGER', 'ADMIN']);
  const canDelete = hasRole('ADMIN');

  // Fetch categories when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (err) {
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = () => {
    setSelectedCategory(null);
    setCategoryModalError(null);
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setCategoryModalError(null);
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = (categoryId) => {
    setCategoryToDelete(categoryId);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      await categoryService.deleteCategory(categoryToDelete);
      setSuccess(true);
      setShowConfirm(false);
      setCategoryToDelete(null);
      await fetchCategories();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySubmit = async (formData) => {
    setCategoryModalLoading(true);
    setCategoryModalError(null);
    setError(null);
    try {
      if (selectedCategory) {
        // Update existing category
        await categoryService.updateCategory(selectedCategory.id, formData);
      } else {
        // Create new category
        await categoryService.createCategory(formData);
      }
      setSuccess(true);
      setShowCategoryModal(false);
      setSelectedCategory(null);
      await fetchCategories();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const errorMessage = translateError(err);
      setCategoryModalError(errorMessage);
      setCategoryModalLoading(false);
      // Re-throw error so CategoryModal can handle it
      throw new Error(errorMessage);
    } finally {
      setCategoryModalLoading(false);
    }
  };

  const handleCloseMainModal = () => {
    // Reset all states when closing main modal
    setShowCategoryModal(false);
    setShowConfirm(false);
    setSelectedCategory(null);
    setCategoryToDelete(null);
    setError(null);
    setSuccess(false);
    setCategoryModalError(null);
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        title="Gestión de Categorías"
        onClose={handleCloseMainModal}
        size="lg"
        className="category-management-modal"
      >
        <div className="mb-3 d-flex justify-content-end">
          {canCreateEdit && (
            <Button
              size="sm"
              onClick={handleCreateCategory}
              style={{ height: '36px', padding: '0.25rem 0.75rem', backgroundColor: '#198754', borderColor: '#198754', color: 'white' }}
            >
              + Nueva Categoría
            </Button>
          )}
        </div>

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

        <CategoryList
          categories={categories}
          loading={loading}
          error={null}
          onEditCategory={handleEditCategory}
          onDeleteCategory={handleDeleteCategory}
        />
      </Modal>

      {/* Modal for Creating/Editing Categories */}
      <CategoryModal
        isOpen={showCategoryModal}
        category={selectedCategory}
        onClose={() => {
          setShowCategoryModal(false);
          setSelectedCategory(null);
          setCategoryModalError(null);
        }}
        onSave={handleCategorySubmit}
        loading={categoryModalLoading}
        error={categoryModalError}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        title="Eliminar Categoría"
        message="¿Estás seguro de que deseas eliminar esta categoría? Esta acción no se puede deshacer."
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowConfirm(false);
          setCategoryToDelete(null);
        }}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </>
  );
};

export default CategoryManagementModal;
