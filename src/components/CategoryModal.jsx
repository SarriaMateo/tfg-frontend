import React from 'react';
import { Modal } from './Modal';
import { CategoryForm } from './CategoryForm';

export const CategoryModal = ({
  isOpen,
  category,
  onClose,
  onSave,
  loading = false,
  error = null,
}) => {
  const [internalError, setInternalError] = React.useState(error);

  React.useEffect(() => {
    setInternalError(error);
  }, [error]);

  const handleFormSubmit = async (formData) => {
    try {
      await onSave(formData);
      // Only close if onSave succeeds
      onClose();
    } catch (err) {
      // Update internal error directly from the caught error
      // This ensures the error is displayed immediately without waiting for prop update
      setInternalError(err.message || 'Error al guardar la categoría');
      // Keep modal open on error
    }
  };

  const title = category ? 'Editar categoría' : 'Nueva categoría';

  return (
    <Modal
      isOpen={isOpen}
      title={title}
      onClose={onClose}
      size="md"
      className="category-modal"
      backdropClassName="category-modal-backdrop"
    >
      <CategoryForm
        category={category}
        onSubmit={handleFormSubmit}
        onCancel={onClose}
        loading={loading}
        error={internalError}
        onErrorChange={setInternalError}
      />
    </Modal>
  );
};

export default CategoryModal;
