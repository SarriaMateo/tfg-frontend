import React from 'react';
import { Card } from 'react-bootstrap';
import { TransactionListTable } from './TransactionListTable';

export const TransactionManagement = ({
  transactions = [],
  loading: listLoading = false,
  error: listError = null,
  pagination = {},
  currentQuery = {},
  onFetchTransactions = () => {},
}) => {
  return (
    <Card className="shadow-sm border-0">
      <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center py-3">
        <Card.Title as="h4" className="mb-0">Historial de Operaciones</Card.Title>
      </Card.Header>
      <Card.Body>
        <TransactionListTable
          transactions={transactions}
          loading={listLoading}
          error={listError}
          pagination={pagination}
          initialQuery={currentQuery}
          onFetchTransactions={onFetchTransactions}
        />
      </Card.Body>
    </Card>
  );
};

export default TransactionManagement;
