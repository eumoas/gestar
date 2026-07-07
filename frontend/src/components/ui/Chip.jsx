import React from 'react';

/** Pílula de status: ponto colorido + texto. Único lugar onde cor de risco decora algo. */
export function Chip({ color, bg, text, children }) {
  return (
    <span
      className="ui-chip"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        padding: '8px 14px',
        borderRadius: 'var(--radius-pill)',
        background: bg || 'var(--border)',
        color: text || 'var(--text)',
        fontSize: 'var(--text-secondary)',
        fontWeight: 600,
      }}
    >
      <span
        aria-hidden="true"
        style={{ width: 8, height: 8, borderRadius: '50%', background: color || 'var(--text-muted)', flexShrink: 0 }}
      />
      {children}
    </span>
  );
}

/** Chip tocável para o diário de sintomas: borda quando inativo, fundo rosa-suave quando ativo. */
export function ChipSelecionavel({ ativo, onClick, icon: Icon, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className="ui-chip-selecionavel"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        padding: '8px 14px',
        borderRadius: 'var(--radius-pill)',
        border: ativo ? '1px solid transparent' : '1px solid var(--border)',
        background: ativo ? 'var(--primary-soft)' : 'var(--surface)',
        color: ativo ? 'var(--primary-deep)' : 'var(--text)',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-secondary)',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'background 120ms ease, border-color 120ms ease',
      }}
    >
      {Icon && <Icon size={16} strokeWidth={2} aria-hidden="true" />}
      {children}
    </button>
  );
}
