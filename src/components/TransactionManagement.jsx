import React, { useState } from 'react';
import { Card, Button, Alert } from 'react-bootstrap';
import { TransactionListTable } from './TransactionListTable';
import { TransactionModal } from './TransactionModal';
import { transactionService } from '../services/transactionService';
import { useAuthorization } from '../hooks/useAuthorization';
import { translateError } from '../utils/errorTranslator';

export const TransactionManagement = ({
  transactions = [],
  loading: listLoading = false,
  error: listError = null,
  pagination = {},
  currentQuery = {},
  onFetchTransactions = () => {},
}) => {
  const { hasAnyRole } = useAuthorization();
  const canCreateEdit = hasAnyRole(['MANAGER', 'ADMIN']);

  const [showModal, setShowModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const showSuccess = (message) => {
    setActionSuccess(message);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  // ── Modal handlers ──────────────────────────────────────────────────────────

  const handleCreateTransaction = () => {
    setSelectedTransaction(null);
    setModalError(null);
    setShowModal(true);
  };

  const handleEditTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setModalError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTransaction(null);
    setModalError(null);
  };

  const handleSubmitTransaction = async (payload) => {
    setModalLoading(true);
    setModalError(null);
    try {
      if (selectedTransaction) {
        await transactionService.updateTransaction(selectedTransaction.id, payload);
      } else {
        await transactionService.createTransaction(payload);
      }
      handleCloseModal();
      onFetchTransactions(currentQuery);
      showSuccess(selectedTransaction ? 'Operación actualizada correctamente' : 'Operación creada correctamente');
    } catch (err) {
      const message = translateError(err);
      setModalError(message);
      throw new Error(message);
    } finally {
      setModalLoading(false);
    }
  };

  // ── Row action handlers (called from TransactionListTable) ─────────────────

  const handleCompleteTransaction = async (transactionId) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await transactionService.completeTransaction(transactionId);
      onFetchTransactions(currentQuery);
      showSuccess('Operación completada correctamente');
    } catch (err) {
      setActionError(translateError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelTransaction = async (transactionId, cancelReason) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await transactionService.cancelTransaction(transactionId, cancelReason);
      onFetchTransactions(currentQuery);
      showSuccess('Operación cancelada correctamente');
    } catch (err) {
      setActionError(translateError(err));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <Card className="shadow-sm border-0">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center py-3">
          <Card.Title as="h4" className="mb-0">Historial de Operaciones</Card.Title>
          {canCreateEdit && (
            <Button
              size="sm"
              onClick={handleCreateTransaction}
              style={{
                height: '36px',
                padding: '0.25rem 0.75rem',
                backgroundColor: '#198754',
                borderColor: '#198754',
                color: 'white',
                margin: '-0.25rem 0',
              }}
            >
              + Nueva Operación
            </Button>
          )}
        </Card.Header>
        <Card.Body>
          {actionSuccess && (
            <Alert variant="success" onClose={() => setActionSuccess(null)} dismissible className="mb-3">
              {actionSuccess}
            </Alert>
          )}
          {actionError && (
            <Alert variant="danger" onClose={() => setActionError(null)} dismissible className="mb-3">
              {actionError}
            </Alert>
          )}
          <TransactionListTable
            transactions={transactions}
            loading={listLoading}
            error={listError}
            pagination={pagination}
            initialQuery={currentQuery}
            onFetchTransactions={onFetchTransactions}
            onEditTransaction={canCreateEdit ? handleEditTransaction : null}
            onCompleteTransaction={handleCompleteTransaction}
            onCancelTransaction={handleCancelTransaction}
            actionLoading={actionLoading}
          />
        </Card.Body>
      </Card>

      <TransactionModal
        isOpen={showModal}
        transaction={selectedTransaction}
        onClose={handleCloseModal}
        onSave={handleSubmitTransaction}
        loading={modalLoading}
        error={modalError}
      />
    </>
  );
};

export default TransactionManagement;
