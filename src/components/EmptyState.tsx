import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl ${className}`}>
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-[#1E3A8A]/10 text-[#1E3A8A] flex items-center justify-center mb-4 shadow-sm">
          {icon}
        </div>
      )}
      <h3 className="text-base font-bold text-[#0B192C] mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-xs mb-5 leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};
