import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Spinner, Alert } from 'react-bootstrap';
import { BsPencilSquare, BsFillTrash3Fill } from 'react-icons/bs';
import { userService } from '../services/userService';
import { companyService } from '../services/companyService';
import { translateError } from '../utils/errorTranslator';

export const UserList = ({
  currentUserId,
  onEditOwnProfile,
  onEditUserAsAdmin,
  onDeleteUser,
  isAdmin = false,
}) => {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const usersData = await userService.getUsersByCompany();
      const sortedUsers = [...usersData].sort((a, b) => {
        if (a.id === currentUserId) return -1;
        if (b.id === currentUserId) return 1;
        return 0;
      });
      setUsers(sortedUsers);

      // Get information for all branches
      const branchesData = await companyService.getCompanyBranches();
      const branchMap = {};
      branchesData.forEach(branch => {
        branchMap[branch.id] = branch.name;
      });
      setBranches(branchMap);
    } catch (err) {
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = (userId) => {
    onDeleteUser(userId);
  };

  const getRoleColor = (role) => {
    const colors = {
      ADMIN: 'primary',
      MANAGER: '#20c997',
      EMPLOYEE: 'warning',
    };
    return colors[role] || 'secondary';
  };

  if (loading) return <div className="text-center py-5"><Spinner animation="border" className="me-2" />Cargando usuarios...</div>;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <>
      <div className="table-responsive">
        <Table hover className="align-middle">
          <thead className="table-light">
            <tr>
              <th style={{ fontWeight: '600' }}>Nombre</th>
              <th style={{ fontWeight: '600' }}>Usuario</th>
              <th style={{ fontWeight: '600', textAlign: 'center' }}>Rol</th>
              <th style={{ fontWeight: '600', textAlign: 'center' }}>Sede</th>
              <th style={{ fontWeight: '600', textAlign: 'center' }}>Activo</th>
              <th style={{ fontWeight: '600', textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className={user.id === currentUserId ? 'table-light' : ''}>
                <td>
                  <div className="fw-500">{user.name}</div>
                  {user.id === currentUserId && <small className="text-muted">(tu cuenta)</small>}
                </td>
                <td>
                  <code className="bg-light px-2 py-1 rounded">{user.username}</code>
                </td>
                <td className="text-center">
                  <span className={`badge ${user.role === 'MANAGER' ? '' : `bg-${getRoleColor(user.role)}`}`} style={user.role === 'MANAGER' ? { backgroundColor: getRoleColor(user.role), color: 'white' } : {}}>
                    {user.role}
                  </span>
                </td>
                <td className="text-center">
                  {user.branch_id ? branches[user.branch_id] || `Sede #${user.branch_id}` : '-'}
                </td>
                <td className="text-center">
                  <span className={`badge ${user.is_active ? 'bg-success' : 'bg-secondary'}`}>
                    {user.is_active ? 'Sí' : 'No'}
                  </span>
                </td>
                <td>
                  <div className="d-flex gap-2 justify-content-center">
                    {user.id === currentUserId && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="list-action-btn"
                        onClick={() => onEditOwnProfile(user)}
                        title="Editar perfil"
                      >
                        <BsPencilSquare />
                      </Button>
                    )}

                    {isAdmin && user.id !== currentUserId && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          className="list-action-btn"
                          onClick={() => onEditUserAsAdmin(user)}
                          title="Editar usuario"
                        >
                          <BsPencilSquare />
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          className="list-action-btn"
                          onClick={() => handleDelete(user.id)}
                          title="Eliminar"
                        >
                          <BsFillTrash3Fill />
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
      {users.length === 0 && (
        <p className="text-center text-muted py-4">No hay usuarios registrados.</p>
      )}
    </>
  );
};
