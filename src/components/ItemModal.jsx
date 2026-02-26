import React from 'react';
import { Modal } from './Modal';
import { ItemForm } from './ItemForm';

export const ItemModal = ({
  isOpen,
  item,
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
      onClose();
    } catch (err) {
      // Error handling happens in parent component
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
