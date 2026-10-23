import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  accentBar?: boolean;
  accentColor?: 'red' | 'blue' | 'navy';
  onClick?: () => void;
  id?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  accentBar = false,
  accentColor = 'red',
  onClick,
  id,
}) => {
  const accentColors = {
    red: 'bg-[#E63946]',
    blue: 'bg-[#2563EB]',
    navy: 'bg-[#0B192C]',
  };

  return (
    <div
      id={id}
      onClick={onClick}
      className={`relative bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${
        onClick ? 'cursor-pointer active:scale-[0.99]' : ''
      } ${className}`}
    >
      {accentBar && (
        <div className={`h-1.5 w-full ${accentColors[accentColor]}`} />
      )}
      <div className="p-4 sm:p-5">
        {children}
      </div>
    </div>
  );
};
