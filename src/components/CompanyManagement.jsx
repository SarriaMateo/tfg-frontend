import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { companyService } from '../services/companyService';
import { CompanyInfo } from './CompanyInfo';
import { CompanyForm } from './CompanyForm';
import { Modal } from './Modal';
import { Card, Alert } from 'react-bootstrap';
import { translateError } from '../utils/errorTranslator';

export const CompanyManagement = () => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [refreshCallback, setRefreshCallback] = useState(null);

  const isAdmin = user?.role === 'ADMIN';

  const handleEditCompany = (company, refreshFunction) => {
    setSelectedCompany(company);
    setRefreshCallback(() => refreshFunction);
    setShowModal(true);
  };

  const handleCompanySubmit = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      await companyService.updateCompanyInfo(formData);
      setSuccess(true);
      setShowModal(false);
      setSelectedCompany(null);
      
      // Refresh company info
      if (refreshCallback) {
        refreshCallback();
      }
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-sm border-0">
      <Card.Header className="bg-primary text-white">
        <Card.Title className="mb-0">Gestión de Empresa</Card.Title>
      </Card.Header>
      <Card.Body>
        {success && <Alert variant="success" onClose={() => setSuccess(false)} dismissible>¡Información actualizada correctamente!</Alert>}
        
        <CompanyInfo 
          onEditCompany={handleEditCompany}
          canEdit={isAdmin}
        />
      </Card.Body>

      {/* Modal for Editing Company */}
      <Modal 
        isOpen={showModal}
        title="Editar Información de la Empresa"
        onClose={() => {
          setShowModal(false);
          setSelectedCompany(null);
          setError(null);
        }}
        size="lg"
      >
        <CompanyForm
          company={selectedCompany}
          onSubmit={handleCompanySubmit}
          onCancel={() => {
            setShowModal(false);
            setSelectedCompany(null);
            setError(null);
          }}
          loading={loading}
          error={error}
          onErrorChange={setError}
        />
      </Modal>
    </Card>
  );
};
