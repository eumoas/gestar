import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Baby, Calendar, Stethoscope, FlaskConical } from 'lucide-react';
import { api } from '../api';
import { useGestanteContext } from '../context/GestanteContext';
import { CardHero, Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Chip } from '../components/ui/Chip';
import { Button } from '../components/ui/Button';
import { infoRisco } from '../lib/risco';
import { formatarDataCompleta, semanasAteData } from '../lib/datas';
import { tamanhoNaSemana } from '../lib/tamanhoBebe';

const SEMANAS_GESTACAO = 40;

export default function Home() {
  const { selected, loading } = useGestanteContext();
  const [carteira, setCarteira] = useState(null);
  const [nivelRisco, setNivelRisco] = useState('verde');

  useEffect(() => {
    if (!selected) return;
    api.carteira(selected.id).then(setCarteira);
    api.historicoSintomas(selected.id).then((historico) => {
      const ultimo = historico[historico.length - 1];
      setNivelRisco(ultimo?.nivel || 'verde');
    });
  }, [selected]);

  if (loading) return <p className="muted">Carregando...</p>;

  if (!selected) {
    return (
      <Card>
        <h2 style={{ fontSize: 'var(--text-title)', marginBottom: 'var(--space-2)' }}>Bem-vinda ao Gestar</h2>
        <p className="muted" style={{ marginBottom: 'var(--space-3)' }}>Nenhuma gestante cadastrada ainda.</p>
        <Link to="/onboarding"><Button>Cadastrar gestante</Button></Link>
      </Card>
    );
  }

  const proximaConsulta = carteira?.itens
    .filter((i) => i.categoria === 'consulta' && i.status === 'pendente')
    .sort((a, b) => a.semana_prevista - b.semana_prevista)[0];
  const proximoExame = carteira?.itens
    .filter((i) => i.categoria === 'exame' && i.status === 'pendente')
    .sort((a, b) => a.semana_prevista - b.semana_prevista)[0];

  const risco = infoRisco(nivelRisco);
  const percentual = Math.min(100, Math.round((selected.semanas / SEMANAS_GESTACAO) * 100));

  return (
    <div className="stack">
      <CardHero>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-3)' }}>
          <span style={{ fontSize: 'var(--text-hero)', fontWeight: 600 }}>Semana {selected.semanas}</span>
          <span style={{ fontSize: 'var(--text-secondary)', fontWeight: 600 }}>{percentual}% · {selected.trimestre}º trimestre</span>
        </div>
        <ProgressBar value={selected.semanas} max={SEMANAS_GESTACAO} label="Progresso da gestação" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
          <Baby size={18} strokeWidth={2} aria-hidden="true" />
          <span style={{ fontSize: 'var(--text-body)' }}>Do tamanho de {tamanhoNaSemana(selected.semanas)}</span>
        </div>
        <p style={{ fontSize: 'var(--text-caption)', marginTop: 'var(--space-2)', opacity: 0.85 }}>
          DPP {formatarDataCompleta(selected.dpp)} · faltam {semanasAteData(selected.dpp)} semanas
        </p>
      </CardHero>

      <Chip color={risco.color} bg={risco.bg} text={risco.text}>{risco.label}</Chip>

      <div className="grid-2">
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <Stethoscope size={16} strokeWidth={2} aria-hidden="true" />
            <span className="section-title" style={{ marginBottom: 0 }}>Próxima consulta</span>
          </div>
          {proximaConsulta ? (
            <>
              <p style={{ fontWeight: 600, marginBottom: 2 }}>{proximaConsulta.descricao}</p>
              <p className="hint">Agendar até a semana {proximaConsulta.semana_prevista}</p>
            </>
          ) : (
            <p className="hint">Nenhuma pendente</p>
          )}
        </Card>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <FlaskConical size={16} strokeWidth={2} aria-hidden="true" />
            <span className="section-title" style={{ marginBottom: 0 }}>Próximo exame</span>
          </div>
          {proximoExame ? (
            <>
              <p style={{ fontWeight: 600, marginBottom: 2 }}>{proximoExame.descricao}</p>
              <p className="hint">Agendar até a semana {proximoExame.semana_prevista}</p>
            </>
          ) : (
            <p className="hint">Nenhum pendente</p>
          )}
        </Card>
      </div>

      <div className="grid-2">
        <Link to="/carteira"><Button variant="outline" style={{ width: '100%' }}><Calendar size={16} style={{ marginRight: 6, verticalAlign: -3 }} />Ver carteira completa</Button></Link>
        <Link to="/diario"><Button style={{ width: '100%' }}>Registrar sintoma</Button></Link>
      </div>
    </div>
  );
}
