import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Input, InputProps } from './Input';

export interface PasswordInputProps extends Omit<InputProps, 'type' | 'rightElement'> {}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>((props, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  const toggleVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <Input
      ref={ref}
      type={showPassword ? 'text' : 'password'}
      leftIcon={<Lock className="w-4 h-4" />}
      rightElement={
        <button
          type="button"
          onClick={toggleVisibility}
          tabIndex={0}
          className="p-1.5 text-slate-600 hover:text-[#1E3A8A] focus:outline-none focus:text-[#1E3A8A] rounded-lg transition-colors cursor-pointer"
          title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
          aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      }
      {...props}
    />
  );
});

PasswordInput.displayName = 'PasswordInput';
