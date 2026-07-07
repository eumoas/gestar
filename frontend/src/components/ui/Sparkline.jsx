import React from 'react';

/** Sparkline simples (SVG inline, sem lib de gráfico) para uma série de números. */
export function Sparkline({ values, height = 40, color = 'var(--primary)' }) {
  if (!values || values.length < 2) {
    return <p className="hint">Sem dados suficientes para o gráfico ainda</p>;
  }
  const width = Math.max(values.length * 18, 120);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * (width - 8) + 4;
      const y = height - 4 - ((v - min) / range) * (height - 8);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} height={height} preserveAspectRatio="none" role="img" aria-label="Tendência de risco nos últimos registros">
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
