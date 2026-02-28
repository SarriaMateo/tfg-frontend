import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner, Alert, Button } from 'react-bootstrap';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useAuth } from '../hooks/useAuth';
import { useBranchSelection } from '../hooks/useBranchSelection';
import { formatDecimal, formatPrice } from '../utils/formatters';

export const ItemListTable = ({ items, loading, error, pagination, onFetchItems }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedBranch } = useBranchSelection();

  // Get the branch ID to display stock (user's branch or selected from localStorage)
  const getBranchIdForStock = () => {
    return user?.branch_id || selectedBranch;
  };

  // Get stock for current branch
  const getBranchStock = (item) => {
    const branchId = getBranchIdForStock();
    if (!branchId) return '0';

    const branchStock = item.stock_by_branch?.find(
      (sb) => sb.branch_id === branchId
    );
    return branchStock ? formatDecimal(branchStock.stock) : '0';
  };

  // Get total stock across all branches
  const getTotalStock = (item) => {
    const total = item.stock_by_branch?.reduce(
      (sum, sb) => sum + parseFloat(sb.stock || 0),
      0
    ) || 0;
    return formatDecimal(total);
  };

  // Render stock by branch tooltip
  const renderStockTooltip = (item) => (
    <Tooltip id={`stock-tooltip-${item.id}`}>
      <div className="text-start">
        {item.stock_by_branch && item.stock_by_branch.length > 0 ? (
          item.stock_by_branch.map((sb) => (
            <div key={sb.branch_id}>
              <strong>{sb.branch_name}:</strong> {formatDecimal(sb.stock)} {item.unit}
            </div>
          ))
        ) : (
          <div>Sin stock en sedes</div>
        )}
      </div>
    </Tooltip>
  );

  const handleDetailsClick = (itemId) => {
    navigate(`/inventory/items/${itemId}`);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        {error}
      </Alert>
    );
  }

  return (
    <div className="mb-5">
      <p className="text-muted">
        Mostrando {items.length} de {pagination.total} artículos
      </p>
      <div className="table-responsive">
        <table className="table table-hover">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>SKU</th>
              <th>Stock en sede</th>
              <th>Stock total</th>
              <th>Marca</th>
              <th>Precio</th>
              <th>Activo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center text-muted py-4">
                  No hay artículos disponibles
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>
                    <code>{item.sku}</code>
                  </td>
                  <td>
                    {getBranchStock(item)} {item.unit}
                  </td>
                  <td>
                    <OverlayTrigger placement="top" overlay={renderStockTooltip(item)}>
                      <span style={{ cursor: 'pointer', textDecoration: 'underline' }}>
                        {getTotalStock(item)} {item.unit}
                      </span>
                    </OverlayTrigger>
                  </td>
                  <td>{item.brand || '-'}</td>
                  <td>{formatPrice(item.price)}</td>
                  <td>
                    {item.is_active ? (
                      <span className="badge bg-success">Activo</span>
                    ) : (
                      <span className="badge bg-secondary">Inactivo</span>
                    )}
                  </td>
                  <td>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleDetailsClick(item.id)}
                    >
                      Detalles
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
