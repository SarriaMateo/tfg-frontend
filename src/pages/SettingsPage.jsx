import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { UserManagement } from '../components/UserManagement';
import { BranchManagement } from '../components/BranchManagement';
import { CompanyManagement } from '../components/CompanyManagement';
import { Container, Row, Col, Nav } from 'react-bootstrap';
import { BsBuildingFill, BsBuildingsFill, BsPeopleFill } from 'react-icons/bs';

export const SettingsPage = () => {
  const [activeSection, setActiveSection] = useState('empresa');

  const sections = [
    { id: 'empresa', label: 'Empresa', icon: <BsBuildingsFill /> },
    { id: 'sedes', label: 'Sedes', icon: <BsBuildingFill /> },
    { id: 'usuarios', label: 'Usuarios', icon: <BsPeopleFill /> },
  ];

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <Container fluid className="py-4 flex-grow-1 mx-auto" style={{ maxWidth: "1500px" }}>
        <Row className="mb-4">
          <Col>
            <h1 className="display-5 fw-bold text-primary mb-2">Ajustes</h1>
            <p className="text-muted">Gestiona la configuración de tu cuenta y empresa</p>
          </Col>
        </Row>

        <Row className="g-4">
          {/* Sidebar */}
          <Col lg={3}>
            <div className="sticky-top" style={{ top: '80px' }}>
              <Nav className="flex-column gap-2">
                {sections.map(section => (
                  <Nav.Link
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`settings-sidebar-link ${activeSection === section.id ? 'active' : ''}`}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '0.375rem',
                      backgroundColor: activeSection === section.id ? '#e7f1ff' : 'transparent',
                      color: activeSection === section.id ? '#0c63e4' : '#495057',
                      cursor: 'pointer',
                      fontWeight: activeSection === section.id ? '600' : '500',
                      borderLeft: activeSection === section.id ? '3px solid #0c63e4' : '3px solid transparent',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span className="me-2">{section.icon}</span>
                    {section.label}
                  </Nav.Link>
                ))}
              </Nav>
            </div>
          </Col>

          {/* Content */}
          <Col lg={9}>
            {/* Empresa Section */}
            {activeSection === 'empresa' && (
              <CompanyManagement />
            )}

            {/* Sedes Section */}
            {activeSection === 'sedes' && (
              <BranchManagement />
            )}

            {/* Usuarios Section */}
            {activeSection === 'usuarios' && (
              <UserManagement />
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default SettingsPage;
