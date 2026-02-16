import React, { useState, useEffect } from 'react';
import { Card, Button, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { companyService } from '../services/companyService';
import { translateError } from '../utils/errorTranslator';

export const CompanyInfo = ({ onEditCompany, canEdit }) => {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    setLoading(true);
    setError(null);
    try {
      const companyData = await companyService.getCompanyInfo();
      setCompany(companyData);
    } catch (err) {
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" className="me-2" />
        Cargando información de la empresa...
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (!company) {
    return <Alert variant="info">No hay información de empresa disponible.</Alert>;
  }

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="mb-0" style={{ fontWeight: '600' }}>Información de la Empresa</h5>
          {canEdit && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onEditCompany(company, fetchCompany)}
              style={{ height: '32px', padding: '0.25rem 1rem' }}
            >
              Editar
            </Button>
          )}
        </div>

        <Row className="g-3">
          <Col md={6}>
            <div className="mb-3">
              <label className="text-muted small mb-1" style={{ fontWeight: '500' }}>
                Nombre de la Empresa
              </label>
              <div className="fw-500">{company.name || '-'}</div>
            </div>
          </Col>

          <Col md={6}>
            <div className="mb-3">
              <label className="text-muted small mb-1" style={{ fontWeight: '500' }}>
                Email
              </label>
              <div className="fw-500">{company.email || '-'}</div>
            </div>
          </Col>

          <Col md={6}>
            <div className="mb-3">
              <label className="text-muted small mb-1" style={{ fontWeight: '500' }}>
                NIF
              </label>
              <div className="fw-500">{company.nif || '-'}</div>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};
