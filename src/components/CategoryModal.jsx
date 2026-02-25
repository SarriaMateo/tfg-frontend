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
      onClose();
    } catch (err) {
      // Error handling happens in parent component
    }
  };

  const title = category ? 'Editar categoría' : 'Nueva categoría';

  return (
    <Modal
      isOpen={isOpen}
      title={title}
      onClose={onClose}
      size="md"
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
