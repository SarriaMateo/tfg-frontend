import React from 'react';
import { Table, Button, Spinner, Alert } from 'react-bootstrap';
import { useAuthorization } from '../hooks/useAuthorization';

export const CategoryList = ({ 
  categories = [], 
  loading = false, 
  error = null, 
  onEditCategory, 
  onDeleteCategory 
}) => {
  const { hasAnyRole, hasRole } = useAuthorization();

  // Check permissions: ADMIN and MANAGER can edit, only ADMIN can delete
  const canEdit = hasAnyRole(['MANAGER', 'ADMIN']);
  const canDelete = hasRole('ADMIN');

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" className="me-2" />
        Cargando categorías...
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (categories.length === 0) {
    return (
      <Alert variant="info">
        No hay categorías creadas. {canEdit && 'Puedes crear una nueva categoría haciendo clic en el botón "Nueva Categoría".'}
      </Alert>
    );
  }

  return (
    <div className="table-responsive">
      <Table hover className="align-middle">
        <thead className="table-light">
          <tr>
            <th style={{ fontWeight: '600', width: '80px', textAlign: 'center' }}>Color</th>
            <th style={{ fontWeight: '600', width: '30%' }}>Nombre</th>
            <th style={{ fontWeight: '600', width: '130px', textAlign: 'center' }}>Código HEX</th>
            {(canEdit || canDelete) && (
              <th style={{ fontWeight: '600', textAlign: 'center', width: '150px' }}>Acciones</th>
            )}
          </tr>
        </thead>
        <tbody>
          {categories.map(category => (
            <tr key={category.id}>
              <td style={{ textAlign: 'center' }}>
                <div
                  style={{
                    backgroundColor: category.color,
                    width: '35px',
                    height: '35px',
                    borderRadius: '6px',
                    border: '2px solid #dee2e6',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    margin: '0 auto',
                  }}
                  title={category.color}
                />
              </td>
              <td>
                <div className="fw-500">{category.name}</div>
              </td>
              <td style={{ textAlign: 'center' }}>
                <code className="bg-light px-2 py-1 rounded" style={{ fontSize: '0.875rem' }}>
                  {category.color}
                </code>
              </td>
              {(canEdit || canDelete) && (
                <td className="text-center">
                  <div className="d-flex gap-2 justify-content-center">
                    {canEdit && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onEditCategory(category)}
                        title="Editar categoría"
                        style={{ width: '80px', height: '32px', padding: '0.25rem 0.5rem' }}
                      >
                        Editar
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => onDeleteCategory(category.id)}
                        title="Eliminar categoría"
                        style={{ width: '80px', height: '32px', padding: '0.25rem 0.5rem' }}
                      >
                        Eliminar
                      </Button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default CategoryList;
