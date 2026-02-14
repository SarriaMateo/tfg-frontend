import React from 'react';
import { Navbar } from '../components/Navbar';
import { Container, Row, Col, Card } from 'react-bootstrap';

export const InventoryPage = () => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <Container className="py-5 flex-grow-1 d-flex align-items-center justify-content-center">
        <Row className="w-100">
          <Col md={8} lg={6} className="mx-auto">
            <Card className="shadow-sm border-0 text-center">
              <Card.Body className="p-5">
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📦</div>
                <h1 className="display-5 fw-bold text-primary mb-3">Inventario</h1>
                <p className="text-muted fs-5">Esta página será desarrollada próximamente.</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default InventoryPage;
