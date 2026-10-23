import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { subscribeToUserNotifications } from '../lib/notificationService';

export const NotificationBadgeButton: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (!profile?.uid) return;

    const unsubscribe = subscribeToUserNotifications(profile.uid, (_, count) => {
      setUnreadCount(count);
    });

    return () => unsubscribe();
  }, [profile?.uid]);

  if (!profile) return null;

  return (
    <button
      onClick={() => navigate('/avisos')}
      className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E63946]"
      aria-label={`Central de avisos (${unreadCount} não lidos)`}
      title="Central de Avisos"
    >
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-[#E63946] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#0B192C] animate-pulse">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};
