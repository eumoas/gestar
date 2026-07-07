import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useGestanteContext } from '../context/GestanteContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const CONDICOES_OPCOES = ['hipertensão', 'diabetes gestacional', 'gestação múltipla', 'nenhuma'];

export default function Onboarding() {
  const { reload, selectGestante } = useGestanteContext();
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [dum, setDum] = useState('');
  const [paridade, setParidade] = useState(0);
  const [condicoes, setCondicoes] = useState([]);
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const toggleCondicao = (c) => {
    setCondicoes((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErro(null);
    if (!nome.trim() || !dum) {
      setErro('Preencha nome e data da última menstruação.');
      return;
    }
    setEnviando(true);
    try {
      const filtrado = condicoes.filter((c) => c !== 'nenhuma');
      const nova = await api.criarGestante({ nome, dum, paridade: Number(paridade), condicoes_previas: filtrado });
      await reload();
      selectGestante(nova.id);
      navigate('/');
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="stack">
      <div>
        <h2 style={{ fontSize: 'var(--text-title)' }}>Cadastro da gestante</h2>
        <p className="muted">
          Ao informar a data da última menstruação, calculamos a idade gestacional e a data provável do parto.
        </p>
      </div>

      <Card>
        <form onSubmit={onSubmit} className="stack">
          <div className="field">
            <label htmlFor="nome">Nome</label>
            <input id="nome" type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" />
          </div>

          <div className="field">
            <label htmlFor="dum">Data da última menstruação</label>
            <input id="dum" type="date" value={dum} onChange={(e) => setDum(e.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="paridade">Partos anteriores</label>
            <input id="paridade" type="number" min="0" value={paridade} onChange={(e) => setParidade(e.target.value)} />
          </div>

          <fieldset>
            <legend>Condições prévias</legend>
            {CONDICOES_OPCOES.map((c) => (
              <label key={c} className="checkbox-row">
                <input type="checkbox" checked={condicoes.includes(c)} onChange={() => toggleCondicao(c)} />
                {c}
              </label>
            ))}
          </fieldset>

          {erro && <p className="error-text">{erro}</p>}

          <Button type="submit" disabled={enviando}>
            {enviando ? 'Salvando…' : 'Concluir cadastro'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
