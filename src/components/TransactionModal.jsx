import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { TransactionForm } from './TransactionForm';

export const TransactionModal = ({
  isOpen,
  transaction,
  onClose,
  onSave,
  loading = false,
  error = null,
}) => {
  const [internalError, setInternalError] = useState(error);

  useEffect(() => {
    setInternalError(error);
  }, [error]);

  // Clear error when modal opens/closes
  useEffect(() => {
    if (isOpen) setInternalError(null);
  }, [isOpen]);

  const handleFormSubmit = async (payload) => {
    try {
      await onSave(payload);
      // Only close if onSave succeeds
      onClose();
    } catch (err) {
      setInternalError(err.message || 'Error al guardar la operación');
      // Keep modal open on error
    }
  };

  const title = transaction ? 'Editar operación' : 'Nueva operación';

  return (
    <Modal
      isOpen={isOpen}
      title={title}
      onClose={onClose}
      size="lg"
    >
      <TransactionForm
        transaction={transaction}
        onSubmit={handleFormSubmit}
        onCancel={onClose}
        loading={loading}
        error={internalError}
        onErrorChange={setInternalError}
      />
    </Modal>
  );
};

export default TransactionModal;
