import React from 'react';

/** Card com foto, cantos arredondados e um véu de gradiente para legibilidade do texto sobreposto. */
export function PhotoCard({ src, alt, height = 280, focus = 'center 20%', children }) {
  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-card)',
        overflow: 'hidden',
        height,
        boxShadow: 'var(--shadow-float)',
      }}
    >
      <img
        src={src}
        alt={alt}
        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: focus, display: 'block' }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(75,21,40,0) 45%, rgba(75,21,40,0.78) 100%)',
        }}
      />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 'var(--space-4)', color: '#fff' }}>
        {children}
      </div>
    </div>
  );
}
