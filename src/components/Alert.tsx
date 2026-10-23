import React from 'react';
import { Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface AlertProps {
  type?: 'info' | 'warning' | 'success' | 'error' | 'danger';
  title?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  children,
  className = '',
  id,
}) => {
  const styles = {
    info: {
      bg: 'bg-blue-50 border-blue-200 text-blue-900',
      icon: <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />,
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
    },
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      icon: <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
    },
    error: {
      bg: 'bg-red-50 border-red-200 text-red-900',
      icon: <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />,
    },
    danger: {
      bg: 'bg-red-50 border-red-200 text-red-900',
      icon: <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />,
    },
  };

  const current = styles[type] || styles.error;

  return (
    <div
      id={id}
      role="alert"
      className={`flex gap-3 p-3.5 sm:p-4 rounded-xl border text-xs sm:text-sm leading-relaxed ${current.bg} ${className}`}
    >
      {current.icon}
      <div className="flex-1">
        {title && <h4 className="font-bold mb-0.5">{title}</h4>}
        <div>{children}</div>
      </div>
    </div>
  );
};
