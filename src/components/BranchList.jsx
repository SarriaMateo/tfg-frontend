import React, { useState, useEffect } from 'react';
import { Table, Button, Spinner, Alert } from 'react-bootstrap';
import { branchService } from '../services/branchService';
import { translateError } from '../utils/errorTranslator';

export const BranchList = ({ onEditBranch, onDeleteBranch, canModify }) => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    setLoading(true);
    setError(null);
    try {
      const branchesData = await branchService.getBranches();
      setBranches(branchesData);
    } catch (err) {
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (branchId) => {
    onDeleteBranch(branchId, () => {
      setBranches(branches.filter(b => b.id !== branchId));
    });
  };

  if (loading) return <div className="text-center py-5"><Spinner animation="border" className="me-2" />Cargando sedes...</div>;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <>
      <div className="table-responsive">
        <Table hover className="align-middle">
          <thead className="table-light">
            <tr>
              <th style={{ fontWeight: '600' }}>Nombre</th>
              <th style={{ fontWeight: '600' }}>Dirección</th>
              {canModify && <th style={{ fontWeight: '600', textAlign: 'center' }}>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {branches.map(branch => (
              <tr key={branch.id}>
                <td>
                  <div className="fw-500">{branch.name}</div>
                </td>
                <td>
                  {branch.address}
                </td>
                {canModify && (
                  <td>
                    <div className="d-flex gap-2 justify-content-center">
                      <Button 
                        variant="primary"
                        size="sm"
                        onClick={() => onEditBranch(branch)}
                        style={{ width: '80px', height: '32px', padding: '0.25rem 0.5rem' }}
                      >
                        Editar
                      </Button>
                      <Button 
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(branch.id)}
                        style={{ width: '80px', height: '32px', padding: '0.25rem 0.5rem' }}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
      {branches.length === 0 && (
        <p className="text-center text-muted py-4">No hay sedes registradas.</p>
      )}
    </>
  );
};
