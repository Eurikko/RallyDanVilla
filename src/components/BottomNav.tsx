import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Calendar, Award, BookOpen, User } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const location = useLocation();

  // Hide bottom nav on landing, login, register, or 404
  const publicRoutes = ['/', '/entrar', '/cadastro'];
  if (publicRoutes.includes(location.pathname)) {
    return null;
  }

  const navItems = [
    { path: '/inicio', label: 'Início', icon: Home },
    { path: '/jogos', label: 'Jogos', icon: Calendar },
    { path: '/placar', label: 'Placar', icon: Award },
    { path: '/regras', label: 'Regras', icon: BookOpen },
    { path: '/perfil', label: 'Perfil', icon: User },
  ];

  return (
    <nav 
      aria-label="Navegação Principal" 
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B192C] text-slate-300 border-t border-slate-800 shadow-lg pb-safe"
    >
      <div className="max-w-md mx-auto px-2 h-16 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#E63946] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B192C] ${
                isActive
                  ? 'text-white font-bold bg-white/10 scale-105'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#E63946]' : ''}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#E63946] rounded-full" />
                )}
              </div>
              <span className={`text-[10px] mt-1 font-medium truncate max-w-full ${isActive ? 'text-white font-bold' : ''}`}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
