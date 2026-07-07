// Mapeia o `nivel` que a API já devolve (verde|amarelo|vermelho — não muda)
// para rótulo humano e tokens de cor. Único lugar que conhece essa tradução,
// para nenhuma tela hardcodar cor ou texto de risco por conta própria.
const RISCO = {
  verde: {
    label: 'Risco habitual',
    color: 'var(--risk-low)',
    bg: 'var(--risk-low-bg)',
    text: 'var(--risk-low-text)',
  },
  amarelo: {
    label: 'Risco intermediário',
    color: 'var(--risk-mid)',
    bg: 'var(--risk-mid-bg)',
    text: 'var(--risk-mid-text)',
  },
  vermelho: {
    label: 'Alto risco',
    color: 'var(--risk-high)',
    bg: 'var(--risk-high-bg)',
    text: 'var(--risk-high-text)',
  },
};

export function infoRisco(nivel) {
  return RISCO[nivel] || RISCO.verde;
}
