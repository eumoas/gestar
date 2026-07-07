import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useGestanteContext } from '../context/GestanteContext';

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
      setErro('Preencha nome e data da última menstruação (DUM).');
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
    <section className="hero">
      <h2>Cadastro da gestante</h2>
      <p className="muted">
        Ao informar a data da última menstruação (DUM), calculamos automaticamente a idade
        gestacional e a data provável do parto (DPP).
      </p>

      <form onSubmit={onSubmit} className="form">
        <label>
          Nome
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" />
        </label>

        <label>
          Data da última menstruação (DUM)
          <input type="date" value={dum} onChange={(e) => setDum(e.target.value)} />
        </label>

        <label>
          Paridade (nº de partos anteriores)
          <input type="number" min="0" value={paridade} onChange={(e) => setParidade(e.target.value)} />
        </label>

        <fieldset>
          <legend>Condições prévias</legend>
          {CONDICOES_OPCOES.map((c) => (
            <label key={c} className="checkbox-label">
              <input type="checkbox" checked={condicoes.includes(c)} onChange={() => toggleCondicao(c)} />
              {c}
            </label>
          ))}
        </fieldset>

        {erro && <p className="erro">{erro}</p>}

        <button className="btn btn-primary" type="submit" disabled={enviando}>
          {enviando ? 'Salvando...' : 'Concluir cadastro'}
        </button>
      </form>
    </section>
  );
}
