import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { InternalNotification, NotificationType } from '../types';
import { 
  subscribeToUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from '../lib/notificationService';
import { 
  Bell, 
  CheckCheck, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Users, 
  Trophy, 
  ClipboardCheck, 
  ChevronRight, 
  Inbox,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const [notifications, setNotifications] = useState<InternalNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [markingAll, setMarkingAll] = useState<boolean>(false);

  useEffect(() => {
    if (!profile?.uid) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToUserNotifications(profile.uid, (data, count) => {
      setNotifications(data);
      setUnreadCount(count);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile?.uid]);

  const handleMarkAllRead = async () => {
    if (!profile?.uid || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsAsRead(profile.uid);
    } catch (err) {
      console.error('[NotificationsPage] Error marking all as read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleItemClick = async (notification: InternalNotification) => {
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
    }

    if (notification.matchId) {
      navigate(`/partidas/${notification.matchId}`);
    } else if (notification.gameId) {
      navigate(`/jogos/${notification.gameId}`);
    }
  };

  const filteredNotifications = notifications.filter((item) => {
    if (filter === 'unread') return !item.read;
    return true;
  });

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'game_published':
        return <Calendar className="w-5 h-5 text-emerald-500" />;
      case 'game_updated':
        return <Info className="w-5 h-5 text-blue-500" />;
      case 'game_cancelled':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'spot_confirmed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'lineup_selected':
        return <Users className="w-5 h-5 text-[#1E3A8A]" />;
      case 'game_completed':
        return <Trophy className="w-5 h-5 text-amber-500" />;
      case 'attendance_recorded':
        return <ClipboardCheck className="w-5 h-5 text-indigo-500" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return 'Data não disponível';

      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();

      const timeStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      if (isToday) {
        return `Hoje às ${timeStr}`;
      }

      const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      return `${dateStr} às ${timeStr}`;
    } catch {
      return 'Data não disponível';
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-[#0F172A] pb-24">
      <Header title="Central de Avisos" showBack backTo="/inicio" />

      <main className="max-w-md mx-auto px-4 py-5 space-y-4">
        {/* Unread Counter Header & Action Bar */}
        <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#0B192C] text-white relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#E63946] text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse" />
              )}
            </div>
            <div>
              <h2 className="text-xs font-black text-[#0B192C]">Avisos Internos</h2>
              <p className="text-[10px] text-slate-500 font-medium">
                {unreadCount === 0
                  ? 'Todos os avisos estão lidos'
                  : `${unreadCount} ${unreadCount === 1 ? 'aviso não lido' : 'avisos não lidos'}`}
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markingAll}
              icon={<CheckCheck className="w-3.5 h-3.5 text-emerald-600" />}
              className="text-[11px] h-8 px-2.5 border-slate-200 hover:bg-emerald-50 text-slate-700 shrink-0"
            >
              Marcar todos como lidos
            </Button>
          )}
        </div>

        {/* Filter Toggle Buttons */}
        <div className="flex items-center gap-2 bg-slate-200/80 p-1 rounded-xl">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-white text-[#0B192C] shadow-sm'
                : 'text-slate-600 hover:text-[#0B192C]'
            }`}
          >
            Todos ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              filter === 'unread'
                ? 'bg-white text-[#0B192C] shadow-sm'
                : 'text-slate-600 hover:text-[#0B192C]'
            }`}
          >
            Não lidos
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-[#E63946] text-white">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="py-12 text-center space-y-2 bg-white rounded-2xl border border-slate-200">
            <div className="w-6 h-6 border-2 border-[#0B192C] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Carregando avisos...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <Card className="py-10 text-center space-y-3 bg-white">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Inbox className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xs font-black text-[#0B192C]">
                {filter === 'unread' ? 'Nenhum aviso não lido' : 'Sua caixa de avisos está vazia'}
              </h3>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto mt-1">
                {filter === 'unread'
                  ? 'Você já leu todos os seus avisos mais recentes.'
                  : 'Quando surgirem novos jogos, atualizações de partidas ou escalações, os avisos aparecerão aqui.'}
              </p>
            </div>
            {filter === 'unread' && notifications.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilter('all')}
                className="mt-2 text-xs"
              >
                Ver todos os avisos ({notifications.length})
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-2.5">
            {filteredNotifications.map((notification) => {
              const isUnread = !notification.read;
              const hasActionableLink = !!(notification.gameId || notification.matchId);

              return (
                <Card
                  key={notification.id}
                  onClick={() => handleItemClick(notification)}
                  className={`transition-all cursor-pointer border ${
                    isUnread
                      ? 'bg-blue-50/40 border-blue-200 shadow-sm'
                      : 'bg-white border-slate-200/80 opacity-90 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Type Icon */}
                    <div className={`p-2 rounded-xl shrink-0 ${isUnread ? 'bg-white shadow-xs' : 'bg-slate-100'}`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className={`text-xs font-black truncate ${isUnread ? 'text-[#0B192C]' : 'text-slate-700'}`}>
                          {notification.title}
                        </h3>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-[#E63946] shrink-0" title="Não lido" />
                        )}
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        {notification.message}
                      </p>

                      <div className="pt-1.5 flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {formatTimestamp(notification.createdAt)}
                        </span>

                        {hasActionableLink && (
                          <span className="text-[#1E3A8A] font-bold flex items-center gap-0.5 hover:underline">
                            Ver detalhes
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
