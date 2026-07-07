import React from 'react';

export function Button({ variant = 'primary', className = '', children, ...props }) {
  return (
    <button type="button" className={`ui-btn ui-btn-${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}
