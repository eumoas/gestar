import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, UserPlus, Calendar, Syringe, NotebookPen, Milk, Stethoscope, Users } from 'lucide-react';

const LINKS = [
  { to: '/', label: 'Início', end: true, icon: Home },
  { to: '/onboarding', label: 'Cadastro', icon: UserPlus },
  { to: '/carteira', label: 'Carteira', icon: Calendar },
  { to: '/vacinacao', label: 'Vacinação', icon: Syringe },
  { to: '/diario', label: 'Diário', icon: NotebookPen },
  { to: '/amamentacao', label: 'Amamentação', icon: Milk },
  { to: '/triagem', label: 'Triagem', icon: Stethoscope },
  { to: '/equipe', label: 'Equipe', icon: Users },
];

export default function NavBar() {
  return (
    <nav className="nav-bar" aria-label="Navegação principal">
      {LINKS.map(({ to, label, end, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => 'nav-link' + (isActive ? ' nav-link-active' : '')}
        >
          <Icon size={20} strokeWidth={2} aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
