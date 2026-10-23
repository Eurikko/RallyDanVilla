import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { VolleyballLogo } from './VolleyballLogo';
import { NotificationBadgeButton } from './NotificationBadgeButton';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  backTo?: string;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBack = false,
  backTo,
  rightAction,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  const isPublicRoute = ['/', '/entrar', '/cadastro'].includes(location.pathname);

  return (
    <header className="sticky top-0 z-30 w-full bg-[#0B192C] text-white shadow-md border-b border-slate-800">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {showBack && (
            <button
              onClick={handleBack}
              className="p-2 -ml-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer shrink-0"
              aria-label="Voltar"
              title="Voltar"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {title ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-black text-lg text-white truncate">{title}</span>
            </div>
          ) : (
            <VolleyballLogo size="sm" showText={true} />
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {rightAction ? (
            rightAction
          ) : isPublicRoute ? null : (
            <div className="flex items-center gap-1">
              <NotificationBadgeButton />
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#2563EB]/20 text-[#3B82F6] border border-[#2563EB]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" />
                Vila
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
