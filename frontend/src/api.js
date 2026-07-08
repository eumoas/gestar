async function request(path, options) {
  const resp = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body.detail || `Erro ${resp.status}`);
  }
  return resp.json();
}

export const api = {
  listGestantes: () => request('/gestantes'),
  getGestante: (id) => request(`/gestantes/${id}`),
  criarGestante: (data) => request('/gestantes', { method: 'POST', body: JSON.stringify(data) }),
  jornada: (id) => request(`/gestantes/${id}/jornada`),
  carteira: (id) => request(`/gestantes/${id}/carteira`),
  atualizarCarteiraItem: (id, item_id, status) =>
    request(`/gestantes/${id}/carteira`, { method: 'PATCH', body: JSON.stringify({ item_id, status }) }),
  historicoSintomas: (id) => request(`/gestantes/${id}/sintomas`),
  registrarSintomas: (id, sintomas, intensidade) =>
    request(`/gestantes/${id}/sintomas`, { method: 'POST', body: JSON.stringify({ sintomas, intensidade }) }),
  vacinacao: (id) => request(`/gestantes/${id}/vacinacao`),
  atualizarVacinacao: (id, vacina_id, status) =>
    request(`/gestantes/${id}/vacinacao`, { method: 'PATCH', body: JSON.stringify({ vacina_id, status }) }),
  historicoAmamentacao: (id) => request(`/gestantes/${id}/amamentacao`),
  registrarAmamentacao: (id, tipo, itens) =>
    request(`/gestantes/${id}/amamentacao`, { method: 'POST', body: JSON.stringify({ tipo, itens }) }),
  buscarUnidadesBLH: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    return request(`/blh/unidades${query ? `?${query}` : ''}`);
  },
  dashboardEquipe: () => request('/equipe/dashboard'),
  listaAlertas: () => request('/equipe/alertas'),
  tratarAlerta: (alertaId) => request(`/equipe/alertas/${alertaId}`, { method: 'PATCH' }),
};
