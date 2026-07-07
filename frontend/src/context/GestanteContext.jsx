import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api';

const GestanteContext = createContext(null);

const STORAGE_KEY = 'gestar:selectedGestanteId';

export function GestanteProvider({ children }) {
  const [gestantes, setGestantes] = useState([]);
  const [selectedId, setSelectedId] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Number(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const lista = await api.listGestantes();
    setGestantes(lista);
    setLoading(false);
    return lista;
  }, []);

  useEffect(() => {
    reload().then((lista) => {
      setSelectedId((current) => {
        if (current && lista.some((g) => g.id === current)) return current;
        return lista[0]?.id ?? null;
      });
    });
  }, [reload]);

  const selectGestante = (id) => {
    setSelectedId(id);
    localStorage.setItem(STORAGE_KEY, String(id));
  };

  const selected = gestantes.find((g) => g.id === selectedId) || null;

  return (
    <GestanteContext.Provider value={{ gestantes, selected, selectedId, selectGestante, reload, loading }}>
      {children}
    </GestanteContext.Provider>
  );
}

export function useGestanteContext() {
  const ctx = useContext(GestanteContext);
  if (!ctx) throw new Error('useGestanteContext deve ser usado dentro de GestanteProvider');
  return ctx;
}
