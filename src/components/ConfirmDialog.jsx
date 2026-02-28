import React from 'react';
import { Modal, Button } from 'react-bootstrap';

export const ConfirmDialog = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'primary', // 'primary' or 'danger'
  className = '',
  backdropClassName = ''
}) => {
  return (
    <Modal 
      show={isOpen} 
      onHide={onCancel} 
      centered
      className={className}
      backdropClassName={backdropClassName}
    >
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{message}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>
          {cancelText}
        </Button>
        <Button variant={variant} onClick={onConfirm}>
          {confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
