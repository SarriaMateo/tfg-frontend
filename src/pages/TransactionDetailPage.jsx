import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Container } from 'react-bootstrap';
import { Navbar } from '../components/Navbar';

export const TransactionDetailPage = () => {
  const navigate = useNavigate();
  const { transactionId } = useParams();

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <Container className="py-5 flex-grow-1">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="display-5 fw-bold text-primary mb-2">Detalle de la operación</h1>
            <p className="text-muted mb-0">Página en preparación para la operación #{transactionId}</p>
          </div>
          <Button variant="outline-secondary" onClick={() => navigate('/transactions')}>
            Volver
          </Button>
        </div>

        <Alert variant="info" className="mb-0">
          Esta vista se completará en la siguiente etapa.
        </Alert>
      </Container>
    </div>
  );
};

export default TransactionDetailPage;
