import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Eye, Droplet, Activity, Frown, Flame, BatteryLow } from 'lucide-react';
import { api } from '../api';
import { useGestanteContext } from '../context/GestanteContext';
import { Card } from '../components/ui/Card';
import { ChipSelecionavel, Chip } from '../components/ui/Chip';
import { Button } from '../components/ui/Button';
import { IntensityDots } from '../components/ui/IntensityDots';
import { Sparkline } from '../components/ui/Sparkline';
import { infoRisco } from '../lib/risco';

const SINTOMAS = [
  { id: 'cefaleia intensa', label: 'Cefaleia intensa', icon: Brain },
  { id: 'visão embaçada', label: 'Visão embaçada', icon: Eye },
  { id: 'edema', label: 'Edema', icon: Droplet },
  { id: 'contrações regulares', label: 'Contrações regulares', icon: Activity },
  { id: 'náusea', label: 'Náusea', icon: Frown },
  { id: 'azia', label: 'Azia', icon: Flame },
  { id: 'cansaço', label: 'Cansaço', icon: BatteryLow },
];

const NIVEL_PONTUACAO = { verde: 0, amarelo: 1, vermelho: 2 };

export default function Diario() {
  const { selected, loading } = useGestanteContext();
  const [selecionados, setSelecionados] = useState([]);
  const [intensidades, setIntensidades] = useState({});
  const [historico, setHistorico] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const navigate = useNavigate();

  const carregarHistorico = useCallback(() => {
    if (!selected) return;
    api.historicoSintomas(selected.id).then(setHistorico);
  }, [selected]);

  useEffect(() => {
    carregarHistorico();
  }, [carregarHistorico]);

  const toggle = (id) => {
    setSelecionados((prev) => {
      if (prev.includes(id)) {
        setIntensidades((int) => {
          const { [id]: _remover, ...resto } = int;
          return resto;
        });
        return prev.filter((x) => x !== id);
      }
      setIntensidades((int) => ({ ...int, [id]: 3 }));
      return [...prev, id];
    });
  };

  const enviar = async () => {
    if (selecionados.length === 0 || !selected) return;
    setEnviando(true);
    try {
      const resultado = await api.registrarSintomas(selected.id, selecionados, intensidades);
      setSelecionados([]);
      setIntensidades({});
      carregarHistorico();
      navigate('/triagem', { state: { resultado } });
    } finally {
      setEnviando(false);
    }
  };

  if (loading) return <p className="muted">Carregando...</p>;
  if (!selected) return <p className="muted">Cadastre uma gestante primeiro.</p>;

  const ultimosTrinta = historico.slice(-30);

  return (
    <div className="stack">
      <div>
        <h2 style={{ fontSize: 'var(--text-title)' }}>Diário de sintomas</h2>
        <p className="muted">Toque nos sintomas de hoje</p>
      </div>

      <Card>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          {SINTOMAS.map(({ id, label, icon }) => (
            <ChipSelecionavel key={id} ativo={selecionados.includes(id)} onClick={() => toggle(id)} icon={icon}>
              {label}
            </ChipSelecionavel>
          ))}
        </div>

        {selecionados.length > 0 && (
          <div className="stack" style={{ marginTop: 'var(--space-4)' }}>
            {selecionados.map((id) => (
              <div key={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 'var(--text-secondary)' }}>{SINTOMAS.find((s) => s.id === id)?.label}</span>
                <IntensityDots
                  value={intensidades[id] || 0}
                  onChange={(n) => setIntensidades((int) => ({ ...int, [id]: n }))}
                  label={`Intensidade de ${id}`}
                />
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 'var(--space-4)' }}>
          <Button disabled={enviando || selecionados.length === 0} onClick={enviar}>
            {enviando ? 'Registrando…' : 'Registrar sintomas'}
          </Button>
        </div>
      </Card>

      <div>
        <p className="section-title">Tendência de risco (últimos registros)</p>
        <Card>
          <Sparkline values={ultimosTrinta.map((r) => NIVEL_PONTUACAO[r.nivel] ?? 0)} />
        </Card>
      </div>

      <div>
        <p className="section-title">Histórico</p>
        {historico.length === 0 && <p className="hint">Nenhum registro ainda</p>}
        <div className="stack">
          {[...historico].reverse().map((registro, idx) => {
            const risco = infoRisco(registro.nivel);
            return (
              <Card key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                  <div>
                    <p style={{ marginBottom: 2 }}>{registro.sintomas.join(', ')}</p>
                    <p className="hint">{new Date(registro.data).toLocaleString('pt-BR')}</p>
                  </div>
                  <Chip color={risco.color} bg={risco.bg} text={risco.text}>{risco.label}</Chip>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
