import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api';
import { useGestanteContext } from '../context/GestanteContext';
import GestanteSwitcher from '../components/GestanteSwitcher';

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

  const porTrimestre = [1, 2, 3].map((t) => ({
    trimestre: t,
    itens: dados.itens.filter((i) => i.trimestre === t),
  }));

  return (
    <div>
      <section className="hero">
        <h2>Carteira de pré-natal — {selected.nome}</h2>
        <p className="muted">Semana atual: {dados.semana_atual}</p>
        <GestanteSwitcher />
      </section>

      {porTrimestre.map(({ trimestre, itens }) => (
        <section key={trimestre} style={{ marginBottom: 16 }}>
          <h3>{trimestre}º trimestre</h3>
          <div className="grid">
            {itens.map((item) => (
              <article key={item.item_id} className="card">
                <div className="card-body">
                  <span className={'badge badge-' + (item.categoria === 'consulta' ? 'primary' : 'accent')}>
                    {CATEGORIA_LABEL[item.categoria]}
                  </span>
                  <h4>{item.descricao}</h4>
                  <p className="muted">Semana prevista: {item.semana_prevista}</p>
                  <div className="actions">
                    <button
                      className={'btn ' + (item.status === 'realizada' ? 'btn-outline' : 'btn-primary')}
                      onClick={() => alternarStatus(item)}
                    >
                      {item.status === 'realizada' ? 'Marcar como pendente' : 'Marcar como realizada'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
