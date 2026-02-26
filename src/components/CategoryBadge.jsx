import React from 'react';

const getTextColor = (hexColor) => {
  if (!hexColor || typeof hexColor !== 'string') {
    return '#ffffff';
  }

  const normalized = hexColor.replace('#', '');
  if (normalized.length !== 6) {
    return '#ffffff';
  }

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#1b1b1b' : '#ffffff';
};

export const CategoryBadge = ({ category, onRemove, removable = false }) => {
  const textColor = getTextColor(category?.color);

  return (
    <span
      className="badge"
      style={{
        backgroundColor: category.color,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 12px',
        marginRight: '8px',
        marginBottom: '8px',
        color: textColor,
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
            opacity: 0.8,
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
    </span>
  );
};

export default CategoryBadge;
