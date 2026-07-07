import React from 'react';
import { useGestanteContext } from '../context/GestanteContext';

export default function GestanteSwitcher() {
  const { gestantes, selectedId, selectGestante, loading } = useGestanteContext();

  if (loading) return null;
  if (gestantes.length === 0) return <span className="hint">Nenhuma gestante cadastrada</span>;

  return (
    <div className="gestante-switcher">
      <label htmlFor="gestante-select" className="hint" style={{ display: 'none' }}>
        Perfil demo
      </label>
      <select id="gestante-select" value={selectedId ?? ''} onChange={(e) => selectGestante(Number(e.target.value))}>
        {gestantes.map((g) => (
          <option key={g.id} value={g.id}>
            {g.nome}
          </option>
        ))}
      </select>
    </div>
  );
}
