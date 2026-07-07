import React from 'react';

export function Card({ children, className = '', style, ...props }) {
  return (
    <div
      className={`ui-card ${className}`}
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius-card)',
        padding: 'var(--space-4)',
        border: '1px solid var(--border)',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHero({ children, className = '', style, ...props }) {
  return (
    <div
      className={`ui-card-hero ${className}`}
      style={{
        background: 'var(--primary-soft)',
        color: 'var(--primary-deep)',
        borderRadius: 'var(--radius-card)',
        padding: 'var(--space-5)',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
