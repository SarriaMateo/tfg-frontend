import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useBranchSelection } from '../hooks/useBranchSelection';
import { companyService } from '../services/companyService';
import { branchService } from '../services/branchService';
import { Navbar as BSNavbar, Container, Nav, Button, Dropdown, Spinner } from 'react-bootstrap';

export const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { selectedBranchId, selectBranch, clearBranchSelection } = useBranchSelection();
  const [expanded, setExpanded] = useState(false);
  const [companyName, setCompanyName] = useState(null);
  const [branchName, setBranchName] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [branches, setBranches] = useState([]);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const previousUserIdRef = useRef(null);

  // Clear branch selection when user changes
  useEffect(() => {
    if (previousUserIdRef.current && previousUserIdRef.current !== user?.id) {
      clearBranchSelection();
      setBranches([]);
    }
    previousUserIdRef.current = user?.id;
  }, [user?.id, clearBranchSelection]);

  useEffect(() => {
    const fetchInfo = async () => {
      if (!user) return;
      
      setLoadingInfo(true);
      try {
        if (user.company_id) {
          const company = await companyService.getCompanyInfo();
          setCompanyName(company.name);
        }
        if (user.branch_id) {
          const branch = await companyService.getBranchInfo(user.branch_id);
          setBranchName(branch.name);
        } else {
          // Load available branches for users without branch_id
          const branchesData = await branchService.getBranches();
          setBranches(branchesData);
          // Select first branch by default only if no branch is already selected
          if (branchesData && branchesData.length > 0 && !selectedBranchId) {
            selectBranch(branchesData[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching company/branch info:', err);
      } finally {
        setLoadingInfo(false);
      }
    };

    fetchInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleLogout = () => {
    clearBranchSelection();
    previousUserIdRef.current = null;
    logout();
    navigate('/');
  };

  const handleBranchChange = (branchId) => {
    selectBranch(branchId);
    setShowBranchDropdown(false);
  };

  const navigateTo = (path) => {
    navigate(path);
    setExpanded(false);
  };

  const getSelectedBranchName = () => {
    if (!selectedBranchId) return 'Seleccionar sede';
    const branch = branches.find(b => b.id === selectedBranchId);
    return branch?.name || 'Sede desconocida';
  };

  return (
    <BSNavbar bg="primary" expand="lg" sticky="top" className="shadow-sm">
      <Container className="navbar-container">
        <BSNavbar.Brand 
          onClick={() => navigateTo('/dashboard')}
          style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '2.2rem' }}
          className="app-brand"
        >
          Itematic
        </BSNavbar.Brand>
        
        <BSNavbar.Toggle aria-controls="basic-navbar-nav" />
        
        <BSNavbar.Collapse id="basic-navbar-nav" className="navbar-collapse">
          <Nav className="nav-links">
            <Nav.Link 
              className="fw-600"
              onClick={() => navigateTo('/dashboard')}
            >
              Dashboard
            </Nav.Link>
            <Nav.Link 
              className="fw-600"
              onClick={() => navigateTo('/inventory')}
            >
              Inventario
            </Nav.Link>
            <Nav.Link 
              className="fw-600"
              onClick={() => navigateTo('/operations')}
            >
              Operaciones
            </Nav.Link>
            <Nav.Link 
              className="fw-600"
              onClick={() => navigateTo('/settings')}
            >
              Ajustes
            </Nav.Link>
          </Nav>

          <div className="navbar-actions">
            {/* Branch Selection for users without branch_id */}
            {!user?.branch_id && branches.length > 0 && (
              <Dropdown show={showBranchDropdown} onToggle={setShowBranchDropdown}>
                <Dropdown.Toggle 
                  variant="light" 
                  id="branch-dropdown"
                  className="d-flex align-items-center gap-2"
                >
                  <span className="text-truncate">{getSelectedBranchName()}</span>
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  {branches.map(branch => (
                    <Dropdown.Item 
                      key={branch.id}
                      onClick={() => handleBranchChange(branch.id)}
                      active={selectedBranchId === branch.id}
                    >
                      {branch.name}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            )}

            <Dropdown>
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
          </div>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
};

export default Navbar;
