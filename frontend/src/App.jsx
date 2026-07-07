import React from 'react';
import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import GestanteSwitcher from './components/GestanteSwitcher';
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import Carteira from './pages/Carteira';
import Diario from './pages/Diario';
import ResultadoTriagem from './pages/ResultadoTriagem';
import PainelEquipe from './pages/PainelEquipe';
import logoIcon from './assets/logo-icon.png';

export default function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <span className="topbar-brand">
          <img src={logoIcon} alt="" className="topbar-logo" />
          Gestar
        </span>
        <GestanteSwitcher />
      </header>
      <NavBar />
      <main className="page">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/carteira" element={<Carteira />} />
          <Route path="/diario" element={<Diario />} />
          <Route path="/triagem" element={<ResultadoTriagem />} />
          <Route path="/equipe" element={<PainelEquipe />} />
        </Routes>
      </main>
      <footer style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
        <small className="hint">Protótipo acadêmico — dados fictícios, respostas simuladas. Não substitui atendimento médico.</small>
      </footer>
    </div>
  );
}
