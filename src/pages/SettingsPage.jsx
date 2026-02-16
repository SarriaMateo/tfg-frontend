import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navbar } from '../components/Navbar';
import { UserManagement } from '../components/UserManagement';
import { BranchManagement } from '../components/BranchManagement';
import { CompanyManagement } from '../components/CompanyManagement';
import { Container, Row, Col, Card, Nav } from 'react-bootstrap';

export const SettingsPage = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('usuarios');

  const sections = [
    { id: 'empresa', label: 'Empresa', icon: '🏢' },
    { id: 'sedes', label: 'Sedes', icon: '🏗️' },
    { id: 'usuarios', label: 'Usuarios', icon: '👥' },
  ];

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <Container fluid className="py-4 flex-grow-1">
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
              <Card className="shadow-sm border-0">
                <Card.Header className="bg-primary text-white">
                  <Card.Title className="mb-0">🏗️ Sedes</Card.Title>
                  <small className="text-white-50">Gestión de sedes de la empresa</small>
                </Card.Header>
                <Card.Body>
                  <BranchManagement />
                </Card.Body>
              </Card>
            )}

            {/* Usuarios Section */}
            {activeSection === 'usuarios' && (
              <Card className="shadow-sm border-0">
                <Card.Header className="bg-primary text-white">
                  <Card.Title className="mb-0">👥 Usuarios</Card.Title>
                  <small className="text-white-50">Gestión de usuarios y perfiles</small>
                </Card.Header>
                <Card.Body>
                  <UserManagement />
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default SettingsPage;
