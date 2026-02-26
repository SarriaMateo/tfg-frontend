import React from 'react';
import { Modal } from './Modal';
import { ItemForm } from './ItemForm';

export const ItemModal = ({
  isOpen,
  item,
  initialCategoryIds = [],
  onClose,
  onSave,
  loading = false,
  error = null,
}) => {
  const [internalError, setInternalError] = React.useState(error);

  React.useEffect(() => {
    setInternalError(error);
  }, [error]);

  const handleFormSubmit = async (formData, categoryIds) => {
    try {
      await onSave(formData, categoryIds);
      // Only close if onSave succeeds
      onClose();
    } catch (err) {
      // Update internal error directly from the caught error
      // This ensures the error is displayed immediately without waiting for prop update
      setInternalError(err.message || 'Error al guardar el artículo');
      // Keep modal open on error
    }
  };

  const title = item ? 'Editar artículo' : 'Nuevo artículo';

  return (
    <Modal
      isOpen={isOpen}
      title={title}
      onClose={onClose}
      size="lg"
    >
      <ItemForm
        item={item}
        initialCategoryIds={initialCategoryIds}
        onSubmit={handleFormSubmit}
        onCancel={onClose}
        loading={loading}
        error={internalError}
        onErrorChange={setInternalError}
      />
    </Modal>
  );
};

export default ItemModal;
