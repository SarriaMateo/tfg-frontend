import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
import AccessDeniedPage from '../pages/AccessDeniedPage';

export const PrivateRoute = ({ children, requiredRoles = null }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <Container className="d-flex align-items-center justify-content-center min-vh-100">
        <Row>
          <Col className="text-center">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Cargando...</span>
            </Spinner>
          </Col>
        </Row>
      </Container>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Verificar roles si se requieren
  if (requiredRoles) {
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    const hasRequiredRole = roles.includes(user?.role);

    if (!hasRequiredRole) {
      return <AccessDeniedPage />;
    }
  }

  return children;
};
