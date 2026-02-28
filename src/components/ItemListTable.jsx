import React from 'react';
import { Spinner, Alert } from 'react-bootstrap';

export const ItemListTable = ({ items, loading, error, pagination, onFetchItems }) => {
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
      {/* Table will be implemented in next stage */}
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
                <td>{item.sku}</td>
                <td>-</td>
                <td>-</td>
                <td>{item.brand || '-'}</td>
                <td>{item.price ? `${item.price}€` : '-'}</td>
                <td>{item.is_active ? '✓' : '✗'}</td>
                <td>
                  <button className="btn btn-sm btn-primary">Detalles</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
