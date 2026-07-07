import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useGestanteContext } from '../context/GestanteContext';
import GestanteSwitcher from '../components/GestanteSwitcher';

const SINTOMAS_OPCOES = [
  'cefaleia intensa',
  'visão embaçada',
  'edema',
  'contrações regulares',
  'náusea',
  'azia',
  'cansaço',
];

export default function Diario() {
  const { selected, loading } = useGestanteContext();
  const [selecionados, setSelecionados] = useState([]);
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

  const toggle = (s) => {
    setSelecionados((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const enviar = async () => {
    if (selecionados.length === 0 || !selected) return;
    setEnviando(true);
    try {
      const resultado = await api.registrarSintomas(selected.id, selecionados);
      setSelecionados([]);
      carregarHistorico();
      navigate('/triagem', { state: { resultado } });
    } finally {
      setEnviando(false);
    }
  };

  if (loading) return <p className="muted">Carregando...</p>;
  if (!selected) return <p className="muted">Cadastre uma gestante primeiro.</p>;

  return (
    <div>
      <section className="hero">
        <h2>Diário de sintomas — {selected.nome}</h2>
        <p className="muted">Selecione os sintomas de hoje. A triagem é simulada (regras determinísticas).</p>
        <GestanteSwitcher />
      </section>

      <section className="card">
        <div className="card-body">
          <div className="grid">
            {SINTOMAS_OPCOES.map((s) => (
              <label key={s} className="checkbox-label">
                <input type="checkbox" checked={selecionados.includes(s)} onChange={() => toggle(s)} />
                {s}
              </label>
            ))}
          </div>
          <div className="actions" style={{ marginTop: 16 }}>
            <button className="btn btn-primary" disabled={enviando || selecionados.length === 0} onClick={enviar}>
              {enviando ? 'Enviando...' : 'Registrar sintomas'}
            </button>
          </div>
        </div>
      </section>

      <section style={{ marginTop: 16 }}>
        <h3>Histórico</h3>
        {historico.length === 0 && <p className="muted">Nenhum registro ainda.</p>}
        <div className="grid">
          {[...historico].reverse().map((registro, idx) => (
            <article key={idx} className={'card nivel-' + registro.nivel}>
              <div className="card-body">
                <span className={'badge badge-' + registro.nivel}>{registro.nivel}</span>
                <p>{registro.sintomas.join(', ')}</p>
                <p className="muted">{new Date(registro.data).toLocaleString('pt-BR')}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
