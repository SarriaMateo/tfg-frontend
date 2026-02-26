import React from 'react';
import { Alert } from 'react-bootstrap';

export const ItemList = () => {
  return (
    <Alert variant="info">
      <strong>Lista de artículos</strong>
      <p>El listado avanzado con búsqueda y filtros se desarrollará en una próxima iteración (US203).</p>
      <p>Para acceder a la página de un artículo, navega manualmente a <code>/inventory/items/:itemId</code></p>
    </Alert>
  );
};

export default ItemList;
