import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api';
import { useGestanteContext } from '../context/GestanteContext';
import { Timeline, TimelineItem } from '../components/ui/Timeline';

const STATUS_LABEL = {
  aplicada: 'Aplicada',
  pendente: 'Agendar',
  prevista: 'Prevista para mais adiante',
  informativa: 'Informativo',
};

export default function CarteiraVacinacao() {
  const { selected, loading } = useGestanteContext();
  const [dados, setDados] = useState(null);

  const carregar = useCallback(() => {
    if (!selected) return;
    api.vacinacao(selected.id).then(setDados);
  }, [selected]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const alternarStatus = async (item) => {
    if (item.status === 'informativa') return;
    const novo = item.status === 'aplicada' ? 'pendente' : 'aplicada';
    await api.atualizarVacinacao(selected.id, item.vacina_id, novo);
    carregar();
  };

  if (loading) return <p className="muted">Carregando...</p>;
  if (!selected) return <p className="muted">Cadastre uma gestante primeiro.</p>;
  if (!dados) return <p className="muted">Carregando carteira de vacinação...</p>;

  return (
    <div className="stack">
      <div>
        <h2 style={{ fontSize: 'var(--text-title)' }}>Carteira de vacinação</h2>
        <p className="muted">Calendário Nacional de Vacinação · semana atual: {dados.semana_atual}</p>
      </div>

      <Timeline>
        {dados.itens.map((item, idx) => {
          const status = item.status === 'aplicada' ? 'concluido' : item.status === 'pendente' ? 'atual' : 'futuro';
          const subtitulo = item.status === 'informativa' ? item.observacao : `${STATUS_LABEL[item.status]} · ${item.esquema}`;
          return (
            <TimelineItem
              key={item.vacina_id}
              status={status}
              title={item.nome}
              subtitle={subtitulo}
              last={idx === dados.itens.length - 1}
              onClick={item.status === 'informativa' ? undefined : () => alternarStatus(item)}
            />
          );
        })}
      </Timeline>
    </div>
  );
}
