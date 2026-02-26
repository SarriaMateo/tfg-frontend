import React from 'react';
import { Modal as BSModal } from 'react-bootstrap';

export const Modal = ({
  isOpen,
  title,
  children,
  onClose,
  size = 'md',
  className,
  backdropClassName,
  backdrop = true,
}) => {
  return (
    <BSModal
      show={isOpen}
      onHide={onClose}
      size={size}
      centered
      className={className}
      backdropClassName={backdropClassName}
      backdrop={backdrop}
    >
      <BSModal.Header closeButton>
        <BSModal.Title>{title}</BSModal.Title>
      </BSModal.Header>
      <BSModal.Body>
        {children}
      </BSModal.Body>
    </BSModal>
  );
};

export default Modal;
