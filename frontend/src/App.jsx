import React from 'react';
import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import Carteira from './pages/Carteira';
import Diario from './pages/Diario';
import ResultadoTriagem from './pages/ResultadoTriagem';
import PainelEquipe from './pages/PainelEquipe';

function Header() {
  return (
    <header className="site-header">
      <div className="brand">
        <img src="/src/assets/logo.svg" alt="Alta Diagnósticos — Gestar" className="logo" />
        <div>
          <h1>Gestar</h1>
          <p className="tag">Companheira de gestação — protótipo</p>
        </div>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <div className="app-root">
      <Header />
      <NavBar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/carteira" element={<Carteira />} />
          <Route path="/diario" element={<Diario />} />
          <Route path="/triagem" element={<ResultadoTriagem />} />
          <Route path="/equipe" element={<PainelEquipe />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <small>Protótipo acadêmico — dados fictícios, respostas simuladas. Não substitui atendimento médico.</small>
      </footer>
    </div>
  );
}
