import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold tracking-wide rounded-xl transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none disabled:transform-none select-none min-h-[44px] cursor-pointer';

  const variants = {
    primary: 'bg-[#E63946] hover:bg-[#d62839] text-white shadow-md shadow-red-500/20 focus-visible:ring-[#E63946]',
    secondary: 'bg-[#0B192C] hover:bg-[#1E3A8A] text-white shadow-md focus-visible:ring-[#0B192C]',
    outline: 'border-2 border-[#1E3A8A] text-[#1E3A8A] bg-transparent hover:bg-[#1E3A8A]/5 focus-visible:ring-[#1E3A8A]',
    ghost: 'text-[#0B192C] bg-transparent hover:bg-slate-200/60 focus-visible:ring-slate-400',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-md focus-visible:ring-red-600',
  };

  const sizes = {
    sm: 'text-xs px-3 py-2 gap-1.5 min-h-[38px]',
    md: 'text-sm px-5 py-2.5 gap-2 min-h-[44px]',
    lg: 'text-base px-6 py-3.5 gap-2.5 min-h-[50px]',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
};
