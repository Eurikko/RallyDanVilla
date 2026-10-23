import React, { useId } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  helperText,
  error,
  leftIcon,
  rightElement,
  required,
  className = '',
  id,
  ...props
}, ref) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label 
          htmlFor={inputId} 
          className="text-xs font-bold uppercase tracking-wider text-[#0B192C] flex items-center gap-1"
        >
          {label}
          {required && <span className="text-[#E63946]" title="Campo obrigatório">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 text-slate-500 pointer-events-none flex items-center justify-center">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`w-full h-12 bg-white text-[#0F172A] text-sm font-medium rounded-xl border transition-all duration-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
            leftIcon ? 'pl-10' : 'pl-3.5'
          } ${
            rightElement ? 'pr-11' : 'pr-3.5'
          } ${
            error 
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' 
              : 'border-slate-300 hover:border-slate-400 focus:border-[#1E3A8A] focus:ring-[#1E3A8A]/20'
          } ${className}`}
          {...props}
        />

        {rightElement && (
          <div className="absolute right-3.5 flex items-center justify-center">
            {rightElement}
          </div>
        )}
      </div>

      {error ? (
        <p id={errorId} className="text-xs font-semibold text-red-600 flex items-center gap-1" role="alert">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-600"></span>
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-slate-500">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
