import React from 'react';

/** Cinco bolinhas tocáveis para registrar intensidade (1 a 5) de um sintoma. */
export function IntensityDots({ value = 0, onChange, label }) {
  return (
    <div role="group" aria-label={label} style={{ display: 'flex', gap: 'var(--space-2)' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`Intensidade ${n} de 5`}
          aria-pressed={value >= n}
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            padding: 0,
            border: '1px solid var(--primary)',
            background: value >= n ? 'var(--primary)' : 'transparent',
            cursor: 'pointer',
          }}
        />
      ))}
    </div>
  );
}
