import React from 'react';

export const Loader: React.FC<{ label?: string }> = ({ label = 'Carregando...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 gap-3 text-slate-600">
      <div className="relative w-12 h-12 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
        <div className="absolute inset-0 rounded-full border-4 border-[#E63946] border-t-transparent animate-spin" />
        <div className="w-4 h-4 rounded-full bg-[#1E3A8A] animate-pulse" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-[#0B192C]">{label}</p>
    </div>
  );
};
