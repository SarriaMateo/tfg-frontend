import React from 'react';
import { Badge } from 'react-bootstrap';

export const CategoryBadge = ({ category, onRemove, removable = false }) => {
  return (
    <Badge
      bg="light"
      text="dark"
      style={{
        backgroundColor: category.color,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 12px',
        marginRight: '8px',
        marginBottom: '8px',
        color: '#fff',
      }}
    >
      {category.name}
      {removable && (
        <button
          type="button"
          onClick={() => onRemove(category.id)}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '0',
            marginLeft: '4px',
          }}
          title="Remover"
        >
          ×
        </button>
      )}
    </Badge>
  );
};

export default CategoryBadge;
