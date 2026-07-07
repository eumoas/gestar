import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api';

export default function PainelEquipe() {
  const [dashboard, setDashboard] = useState(null);
  const [alertas, setAlertas] = useState([]);
  const [filtroNivel, setFiltroNivel] = useState('todos');

  const carregar = useCallback(() => {
    api.dashboardEquipe().then(setDashboard);
    api.listaAlertas().then(setAlertas);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const tratar = async (id) => {
    await api.tratarAlerta(id);
    carregar();
  };

  if (!dashboard) return <p className="muted">Carregando painel...</p>;

  const gestantesFiltradas = dashboard.gestantes.filter(
    (g) => filtroNivel === 'todos' || g.nivel === filtroNivel
  );
  const alertasPendentes = alertas.filter((a) => !a.tratado);

  return (
    <div>
      <section className="hero">
        <h2>Painel da equipe — território</h2>
        <p className="muted">Semáforo de risco simulado a partir do motor de regras.</p>
        <div className="semaforo">
          <button className={'chip chip-verde' + (filtroNivel === 'verde' ? ' chip-active' : '')} onClick={() => setFiltroNivel(filtroNivel === 'verde' ? 'todos' : 'verde')}>
            Verde: {dashboard.contagem.verde}
          </button>
          <button className={'chip chip-amarelo' + (filtroNivel === 'amarelo' ? ' chip-active' : '')} onClick={() => setFiltroNivel(filtroNivel === 'amarelo' ? 'todos' : 'amarelo')}>
            Amarelo: {dashboard.contagem.amarelo}
          </button>
          <button className={'chip chip-vermelho' + (filtroNivel === 'vermelho' ? ' chip-active' : '')} onClick={() => setFiltroNivel(filtroNivel === 'vermelho' ? 'todos' : 'vermelho')}>
            Vermelho: {dashboard.contagem.vermelho}
          </button>
        </div>
      </section>

      <section>
        <h3>Fila de alertas pendentes</h3>
        {alertasPendentes.length === 0 && <p className="muted">Nenhum alerta pendente.</p>}
        <div className="grid">
          {alertasPendentes.map((a) => (
            <article key={a.id} className={'card nivel-' + a.nivel}>
              <div className="card-body">
                <span className={'badge badge-' + a.nivel}>{a.nivel}</span>
                <p>{a.mensagem}</p>
                <p className="muted">Gestação #{a.gestacao_id} — origem: {a.origem}</p>
                <button className="btn btn-outline" onClick={() => tratar(a.id)}>Marcar como tratado</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 16 }}>
        <h3>Gestantes do território</h3>
        <div className="grid">
          {gestantesFiltradas.map((g) => (
            <article key={g.gestante_id} className={'card nivel-' + g.nivel}>
              <div className="card-body">
                <span className={'badge badge-' + g.nivel}>{g.nivel}</span>
                <h4>{g.nome}</h4>
                <p className="muted">{g.semanas} semanas — {g.trimestre}º trimestre</p>
                <p className="muted">{g.alertas_pendentes} alerta(s) pendente(s)</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
