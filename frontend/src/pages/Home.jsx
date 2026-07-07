import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useGestanteContext } from '../context/GestanteContext';
import GestanteSwitcher from '../components/GestanteSwitcher';

export default function Home() {
  const { selected, loading } = useGestanteContext();
  const [jornada, setJornada] = useState(null);

  useEffect(() => {
    if (!selected) return;
    api.jornada(selected.id).then(setJornada);
  }, [selected]);

  if (loading) return <p className="muted">Carregando...</p>;

  if (!selected) {
    return (
      <section className="hero">
        <h2>Bem-vinda ao Gestar</h2>
        <p>Nenhuma gestante cadastrada ainda.</p>
        <Link className="btn btn-outline" to="/onboarding">Fazer cadastro</Link>
      </section>
    );
  }

  return (
    <div>
      <section className="hero">
        <h2>Olá, {selected.nome}</h2>
        <p>
          Você está com <strong>{selected.semanas} semanas</strong> de gestação
          (trimestre {selected.trimestre}). Data provável do parto: {selected.dpp}.
        </p>
        <p className="muted">Protótipo acadêmico com respostas simuladas. Não substitui atendimento.</p>
        <GestanteSwitcher />
      </section>

      <section>
        <h3>Linha do tempo</h3>
        <div className="grid">
          {(jornada?.timeline || []).map((evento, idx) => (
            <article key={idx} className="card">
              <div className="card-body">
                <h4>{evento.descricao}</h4>
                <p className="muted">{evento.tipo} — {evento.data}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="actions" style={{ marginTop: 16 }}>
        <Link className="btn btn-outline" to="/carteira">Ver carteira de pré-natal</Link>
        <Link className="btn btn-outline" to="/diario">Registrar sintomas</Link>
      </section>
    </div>
  );
}
