import React from 'react';
import { NavLink } from 'react-router-dom';

const LINKS = [
  { to: '/', label: 'Início', end: true },
  { to: '/onboarding', label: 'Cadastro' },
  { to: '/carteira', label: 'Carteira' },
  { to: '/diario', label: 'Diário de sintomas' },
  { to: '/triagem', label: 'Triagem' },
  { to: '/equipe', label: 'Painel da equipe' },
];

export default function NavBar() {
  return (
    <nav className="nav-bar">
      {LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          className={({ isActive }) => 'nav-link' + (isActive ? ' nav-link-active' : '')}
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
