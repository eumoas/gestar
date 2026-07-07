import React, { useEffect, useState, useCallback } from 'react';
import { Users, AlertTriangle, CalendarClock, FlaskConical } from 'lucide-react';
import { api } from '../api';
import { Card } from '../components/ui/Card';
import { KpiCard } from '../components/ui/KpiCard';
import { Chip } from '../components/ui/Chip';
import { Button } from '../components/ui/Button';
import { infoRisco } from '../lib/risco';

const ORDEM_RISCO = { vermelho: 0, amarelo: 1, verde: 2 };

export default function PainelEquipe() {
  const [dashboard, setDashboard] = useState(null);
  const [alertas, setAlertas] = useState([]);
  const [kpisCarteira, setKpisCarteira] = useState({ consultasAtrasadas: 0, examesPendentes: 0 });

  const carregar = useCallback(async () => {
    const [dash, alertasResp] = await Promise.all([api.dashboardEquipe(), api.listaAlertas()]);
    setDashboard(dash);
    setAlertas(alertasResp);

    const carteiras = await Promise.all(dash.gestantes.map((g) => api.carteira(g.gestante_id)));
    let consultasAtrasadas = 0;
    let examesPendentes = 0;
    carteiras.forEach((c, idx) => {
      const semanaAtual = dash.gestantes[idx].semanas;
      c.itens.forEach((item) => {
        if (item.status !== 'pendente') return;
        if (item.categoria === 'consulta' && item.semana_prevista < semanaAtual) consultasAtrasadas += 1;
        if (item.categoria === 'exame') examesPendentes += 1;
      });
    });
    setKpisCarteira({ consultasAtrasadas, examesPendentes });
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const tratar = async (id) => {
    await api.tratarAlerta(id);
    carregar();
  };

  if (!dashboard) return <p className="muted">Carregando painel...</p>;

  const alertasPendentes = alertas.filter((a) => !a.tratado);
  const gestantesOrdenadas = [...dashboard.gestantes].sort((a, b) => ORDEM_RISCO[a.nivel] - ORDEM_RISCO[b.nivel]);

  return (
    <div className="stack">
      <h2 style={{ fontSize: 'var(--text-title)' }}>Painel da equipe</h2>

      <div className="grid-2" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <KpiCard label="Gestantes acompanhadas" value={dashboard.gestantes.length} icon={Users} />
        <KpiCard label="Alto risco" value={dashboard.contagem.vermelho} icon={AlertTriangle} />
        <KpiCard label="Consultas atrasadas" value={kpisCarteira.consultasAtrasadas} icon={CalendarClock} />
        <KpiCard label="Exames pendentes" value={kpisCarteira.examesPendentes} icon={FlaskConical} />
      </div>

      <div>
        <p className="section-title">Fila de alertas pendentes</p>
        {alertasPendentes.length === 0 && <p className="hint">Nenhum alerta pendente</p>}
        <div className="stack">
          {alertasPendentes.map((a) => {
            const risco = infoRisco(a.nivel);
            return (
              <Card key={a.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                  <div>
                    <Chip color={risco.color} bg={risco.bg} text={risco.text}>{risco.label}</Chip>
                    <p style={{ marginTop: 'var(--space-2)' }}>{a.mensagem}</p>
                    <p className="hint">Gestação #{a.gestacao_id} · origem: {a.origem}</p>
                  </div>
                  <Button variant="outline" onClick={() => tratar(a.id)}>Marcar como tratado</Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <p className="section-title">Gestantes do território</p>
        <div className="stack">
          {gestantesOrdenadas.map((g) => {
            const risco = infoRisco(g.nivel);
            return (
              <Card key={g.gestante_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                <div>
                  <p style={{ fontWeight: 600, marginBottom: 2 }}>{g.nome}</p>
                  <p className="hint">{g.semanas} semanas · {g.trimestre}º trimestre · {g.alertas_pendentes} alerta(s) pendente(s)</p>
                </div>
                <Chip color={risco.color} bg={risco.bg} text={risco.text}>{risco.label}</Chip>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
