import React from 'react';
import { Navbar } from '../components/Navbar';
import { Container } from 'react-bootstrap';
import { TransactionManagement } from '../components/TransactionManagement';
import { useTransactions } from '../hooks/useTransactions';
import { useAuth } from '../hooks/useAuth';
import { useBranchSelection } from '../hooks/useBranchSelection';

export const TransactionsPage = () => {
  const { user } = useAuth();
  const { selectedBranchId } = useBranchSelection();
  const {
    transactions,
    loading,
    error,
    pagination,
    currentQuery,
    fetchTransactions,
  } = useTransactions();

  React.useEffect(() => {
    // Use the navbar branch only as the initial fallback when no stored query exists.
    const resolvedBranchId = user?.branch_id || selectedBranchId;

    fetchTransactions({}, { defaultBranchId: resolvedBranchId });
  }, [fetchTransactions, selectedBranchId, user?.branch_id]);

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <Container className="py-5 flex-grow-1">
        <div className="mb-4">
          <h1 className="display-5 fw-bold text-primary mb-2">Operaciones</h1>
          <p className="text-muted">Consulta y seguimiento de operaciones de inventario</p>
        </div>

        <TransactionManagement
          transactions={transactions}
          loading={loading}
          error={error}
          pagination={pagination}
          currentQuery={currentQuery}
          onFetchTransactions={fetchTransactions}
        />
      </Container>
    </div>
  );
};

export default TransactionsPage;
