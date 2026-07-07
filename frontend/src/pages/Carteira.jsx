import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api';
import { useGestanteContext } from '../context/GestanteContext';
import { Timeline, TimelineItem } from '../components/ui/Timeline';
import { somarDias, formatarDataCurta } from '../lib/datas';

const CATEGORIA_LABEL = { consulta: 'Consulta', exame: 'Exame' };

export default function Carteira() {
  const { selected, loading } = useGestanteContext();
  const [dados, setDados] = useState(null);

  const carregar = useCallback(() => {
    if (!selected) return;
    api.carteira(selected.id).then(setDados);
  }, [selected]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const alternarStatus = async (item) => {
    const novo = item.status === 'realizada' ? 'pendente' : 'realizada';
    await api.atualizarCarteiraItem(selected.id, item.item_id, novo);
    carregar();
  };

  if (loading) return <p className="muted">Carregando...</p>;
  if (!selected) return <p className="muted">Cadastre uma gestante primeiro.</p>;
  if (!dados) return <p className="muted">Carregando carteira...</p>;

  const itens = [...dados.itens].sort((a, b) => a.semana_prevista - b.semana_prevista);
  const idxAtual = itens.findIndex((i) => i.status === 'pendente');

  return (
    <div className="stack">
      <div>
        <h2 style={{ fontSize: 'var(--text-title)' }}>Carteira de pré-natal</h2>
        <p className="muted">Semana atual: {dados.semana_atual}</p>
      </div>

      <Timeline>
        {itens.map((item, idx) => {
          const status = item.status === 'realizada' ? 'concluido' : idx === idxAtual ? 'atual' : 'futuro';
          const prazo =
            item.status === 'realizada'
              ? `Concluída · semana ${item.semana_prevista}`
              : `Agendar até ${formatarDataCurta(somarDias(selected.dum, item.semana_prevista * 7))} · semana ${item.semana_prevista}`;
          return (
            <TimelineItem
              key={item.item_id}
              status={status}
              title={`${CATEGORIA_LABEL[item.categoria]} · ${item.descricao}`}
              subtitle={prazo}
              last={idx === itens.length - 1}
              onClick={() => alternarStatus(item)}
            />
          );
        })}
      </Timeline>
    </div>
  );
}
