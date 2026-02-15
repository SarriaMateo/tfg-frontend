import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { companyService } from '../services/companyService';
import { Navbar as BSNavbar, Container, Nav, Button, Dropdown, Spinner } from 'react-bootstrap';

export const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [companyName, setCompanyName] = useState(null);
  const [branchName, setBranchName] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(false);

  useEffect(() => {
    const fetchInfo = async () => {
      if (!user) return;
      
      setLoadingInfo(true);
      try {
        if (user.company_id) {
          const company = await companyService.getCompanyInfo(user.company_id);
          setCompanyName(company.name);
        }
        if (user.branch_id) {
          const branch = await companyService.getBranchInfo(user.branch_id);
          setBranchName(branch.name);
        }
      } catch (err) {
        console.error('Error fetching company/branch info:', err);
      } finally {
        setLoadingInfo(false);
      }
    };

    fetchInfo();
  }, [user]);

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
                  <small className="text-muted">
                    {loadingInfo ? (
                      <>
                        <Spinner size="sm" className="me-1" />
                        Cargando...
                      </>
                    ) : (
                      <>Sede: {branchName || `Sede #${user.branch_id}`}</>
                    )}
                  </small>
                </Dropdown.Item>
              )}
              <Dropdown.Item disabled>
                <small className="text-muted">
                  {loadingInfo ? (
                    <>
                      <Spinner size="sm" className="me-1" />
                      Cargando...
                    </>
                  ) : (
                    <>Empresa: {companyName || `Empresa #${user.company_id}`}</>
                  )}
                </small>
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
