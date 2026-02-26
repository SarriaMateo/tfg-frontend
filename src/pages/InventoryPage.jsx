import React from 'react';
import { Navbar } from '../components/Navbar';
import { Container } from 'react-bootstrap';
import { ItemManagement } from '../components/ItemManagement';

export const InventoryPage = () => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <Container className="py-5 flex-grow-1">
        <div className="mb-4">
          <h1 className="display-5 fw-bold text-primary mb-2">Inventario</h1>
          <p className="text-muted">Gestión de artículos y categorías</p>
        </div>

        <ItemManagement />
      </Container>
    </div>
  );
};

export default InventoryPage;
