import React from 'react';

/** Trilha --primary-mid de 6px, preenchimento --primary, raio 999px. */
export function ProgressBar({ value, max = 100, label }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      style={{
        width: '100%',
        height: 6,
        borderRadius: 'var(--radius-pill)',
        background: 'var(--primary-mid)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          borderRadius: 'var(--radius-pill)',
          background: 'var(--primary)',
          transition: 'width 300ms ease',
        }}
      />
    </div>
  );
}
