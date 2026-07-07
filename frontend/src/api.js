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
  dashboardEquipe: () => request('/equipe/dashboard'),
  listaAlertas: () => request('/equipe/alertas'),
  tratarAlerta: (alertaId) => request(`/equipe/alertas/${alertaId}`, { method: 'PATCH' }),
};
