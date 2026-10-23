import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'demo' | 'role' | 'owner' | 'admin' | 'player' | 'level' | 'success' | 'warning' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'info',
  size = 'md',
  className = '',
}) => {
  const variants = {
    demo: 'bg-[#E63946]/10 text-[#E63946] border-[#E63946]/30',
    role: 'bg-[#1E3A8A]/10 text-[#1E3A8A] border-[#1E3A8A]/30',
    owner: 'bg-amber-500/15 text-amber-900 border-amber-500/40 font-black',
    admin: 'bg-purple-500/15 text-purple-900 border-purple-500/40 font-bold',
    player: 'bg-blue-500/10 text-blue-800 border-blue-500/30',
    level: 'bg-amber-500/10 text-amber-800 border-amber-500/30',
    success: 'bg-emerald-500/10 text-emerald-800 border-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-800 border-amber-500/30',
    info: 'bg-blue-500/10 text-blue-800 border-blue-500/30',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider',
    md: 'text-xs px-2.5 py-1 font-semibold tracking-wide',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
};
