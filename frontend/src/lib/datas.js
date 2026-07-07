function paraData(iso) {
  return iso instanceof Date ? iso : new Date(`${iso}T00:00:00`);
}

export function formatarDataCompleta(iso) {
  const d = paraData(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatarDataCurta(iso) {
  const d = paraData(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function somarDias(iso, dias) {
  const d = paraData(iso);
  d.setDate(d.getDate() + dias);
  return d;
}

export function semanasAteData(iso) {
  const diffMs = paraData(iso).getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000)));
}
