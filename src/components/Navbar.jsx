import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Navbar as BSNavbar, Container, Nav, Button, Dropdown } from 'react-bootstrap';

export const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [expanded, setExpanded] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navigateTo = (path) => {
    navigate(path);
    setExpanded(false);
  };

  return (
    <BSNavbar bg="primary" expand="lg" sticky="top" className="shadow-sm">
      <Container>
        <BSNavbar.Brand 
          onClick={() => navigateTo('/dashboard')}
          style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '2.2rem' }}
          className="app-brand"
        >
          Itematic
        </BSNavbar.Brand>
        
        <BSNavbar.Toggle aria-controls="basic-navbar-nav" />
        
        <BSNavbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link 
              className="me-2 fw-600"
              onClick={() => navigateTo('/dashboard')}
            >
              Dashboard
            </Nav.Link>
            <Nav.Link 
              className="me-2 fw-600"
              onClick={() => navigateTo('/inventory')}
            >
              Inventario
            </Nav.Link>
            <Nav.Link 
              className="me-2 fw-600"
              onClick={() => navigateTo('/operations')}
            >
              Operaciones
            </Nav.Link>
            <Nav.Link 
              className="me-3 fw-600"
              onClick={() => navigateTo('/settings')}
            >
              Ajustes
            </Nav.Link>
          </Nav>

          <Dropdown className="ms-auto">
            <Dropdown.Toggle 
              variant="light" 
              id="user-dropdown"
              className="d-flex align-items-center gap-2"
            >
              <span className="text-truncate">{user?.username}</span>
            </Dropdown.Toggle>

            <Dropdown.Menu align="end">
              <Dropdown.Item disabled>
                <small className="text-muted">Usuario: {user?.username}</small>
              </Dropdown.Item>
              {user?.branch_id && (
                <Dropdown.Item disabled>
                  <small className="text-muted">Sede ID: {user?.branch_id}</small>
                </Dropdown.Item>
              )}
              <Dropdown.Item disabled>
                <small className="text-muted">Empresa: {user?.company_id}</small>
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item onClick={handleLogout}>
                Cerrar Sesión
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
};

export default Navbar;
