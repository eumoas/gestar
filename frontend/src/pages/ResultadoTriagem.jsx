import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { api } from '../api';
import { useGestanteContext } from '../context/GestanteContext';

const NIVEL_TEXTO = {
  verde: 'Sem sinais de alerta. Continue o acompanhamento de rotina.',
  amarelo: 'Sinais de atenção. Monitore e converse com a equipe de saúde na próxima consulta.',
  vermelho: 'Sinal de alerta. Procure atendimento o quanto antes.',
};

export default function ResultadoTriagem() {
  const location = useLocation();
  const { selected, loading } = useGestanteContext();
  const [resultado, setResultado] = useState(location.state?.resultado || null);

  useEffect(() => {
    if (resultado || !selected) return;
    api.historicoSintomas(selected.id).then((historico) => {
      const ultimo = historico[historico.length - 1];
      if (ultimo) setResultado(ultimo);
    });
  }, [resultado, selected]);

  if (loading) return <p className="muted">Carregando...</p>;
  if (!selected) return <p className="muted">Cadastre uma gestante primeiro.</p>;

  if (!resultado) {
    return (
      <section className="hero">
        <h2>Resultado da triagem</h2>
        <p className="muted">Nenhuma triagem registrada ainda para {selected.nome}.</p>
        <Link className="btn btn-outline" to="/diario">Registrar sintomas</Link>
      </section>
    );
  }

  return (
    <section className={'hero nivel-' + resultado.nivel}>
      <h2>Resultado da triagem — {selected.nome}</h2>
      <span className={'badge badge-' + resultado.nivel} style={{ fontSize: 16 }}>
        {resultado.nivel.toUpperCase()}
      </span>
      <p style={{ marginTop: 12 }}>{resultado.mensagem}</p>
      <p className="muted">{NIVEL_TEXTO[resultado.nivel]}</p>
      <p className="muted disclaimer">
        Resposta simulada (motor de regras) — protótipo acadêmico, não substitui atendimento médico.
      </p>
      <Link className="btn btn-outline" to="/diario">Novo registro</Link>
    </section>
  );
}
