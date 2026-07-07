import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { api } from '../api';
import { useGestanteContext } from '../context/GestanteContext';
import { CardHero } from '../components/ui/Card';
import { Chip } from '../components/ui/Chip';
import { Button } from '../components/ui/Button';
import { infoRisco } from '../lib/risco';

const NIVEL_TEXTO = {
  verde: 'Continue o acompanhamento de rotina.',
  amarelo: 'Monitore e converse com a equipe de saúde na próxima consulta.',
  vermelho: 'Procure atendimento o quanto antes.',
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
      <div className="stack">
        <h2 style={{ fontSize: 'var(--text-title)' }}>Resultado da triagem</h2>
        <p className="muted">Nenhum registro ainda para {selected.nome}.</p>
        <Link to="/diario"><Button>Registrar sintoma</Button></Link>
      </div>
    );
  }

  const risco = infoRisco(resultado.nivel);

  return (
    <div className="stack">
      <CardHero>
        <Chip color={risco.color} bg={risco.bg} text={risco.text}>{risco.label}</Chip>
        <p style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-title)', fontWeight: 600 }}>{resultado.mensagem}</p>
        <p style={{ marginTop: 'var(--space-2)' }}>{NIVEL_TEXTO[resultado.nivel]}</p>
      </CardHero>
      <p className="hint" style={{ fontStyle: 'italic' }}>
        Resposta simulada (motor de regras) — protótipo acadêmico, não substitui atendimento médico.
      </p>
      <Link to="/diario"><Button variant="outline">Registrar novo sintoma</Button></Link>
    </div>
  );
}
