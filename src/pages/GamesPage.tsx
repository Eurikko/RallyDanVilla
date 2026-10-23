import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { Game } from '../types';
import { 
  getUpcomingGames, 
  getUserRegistrations, 
  formatGameDateTime 
} from '../lib/gameService';
import { DEMO_PAST_GAMES } from '../mocks';
import { 
  Calendar, 
  History, 
  Clock, 
  MapPin, 
  Plus, 
  ChevronRight, 
  CheckCircle2, 
  Loader2,
  Users
} from 'lucide-react';

export const GamesPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [games, setGames] = useState<Game[]>([]);
  const [userRegistrations, setUserRegistrations] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canCreateGame = profile?.role === 'owner' || profile?.role === 'admin';

  const fetchGamesData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const list = await getUpcomingGames();
      setGames(list);

      if (profile?.uid) {
        const regsMap = await getUserRegistrations(profile.uid);
        setUserRegistrations(regsMap);
      }
    } catch (err) {
      console.error('[GamesPage] Error fetching games:', err);
      setErrorMsg('Não foi possível carregar a lista de jogos.');
    } finally {
      setLoading(false);
    }
  }, [profile?.uid]);

  useEffect(() => {
    fetchGamesData();
  }, [fetchGamesData]);

  // Separate upcoming vs completed/past
  const upcomingGames = games.filter((g) => g.status === 'scheduled' || g.status === 'cancelled');

  return (
    <div className="min-h-screen bg-slate-100 text-[#0F172A] pb-24">
      <Header title="Jogos da Comunidade" />

      <main className="max-w-md mx-auto px-4 py-5 space-y-4">
        {/* Page Title & Action */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-[#0B192C]">Jogos</h1>
            <p className="text-xs text-slate-500">Agendamento e presença de partidas de vôlei</p>
          </div>

          {canCreateGame && (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => navigate('/admin/jogos')}
              className="bg-[#0B192C] hover:bg-[#1E3A8A]"
            >
              Novo Jogo
            </Button>
          )}
        </div>

        {/* Error Notice */}
        {errorMsg && (
          <Alert type="error" className="animate-fadeIn">
            {errorMsg}
          </Alert>
        )}

        {/* Tabs for Upcoming vs History */}
        <div className="flex p-1 bg-slate-200/80 rounded-xl">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'upcoming'
                ? 'bg-white text-[#0B192C] shadow-xs'
                : 'text-slate-600 hover:text-[#0B192C]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Próximos Jogos ({upcomingGames.length})
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white text-[#0B192C] shadow-xs'
                : 'text-slate-600 hover:text-[#0B192C]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Histórico ({DEMO_PAST_GAMES.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'upcoming' ? (
          <div className="space-y-3">
            {loading ? (
              <div className="p-8 text-center space-y-2 bg-white rounded-2xl border border-slate-200">
                <Loader2 className="w-6 h-6 animate-spin text-[#0B192C] mx-auto" />
                <p className="text-xs text-slate-500 font-medium">Buscando próximos jogos...</p>
              </div>
            ) : upcomingGames.length > 0 ? (
              upcomingGames.map((game) => {
                const dt = formatGameDateTime(game.scheduledAt);
                const isCancelled = game.status === 'cancelled' || (game.status as string) === 'cancelado';
                const isUserConfirmed = !!userRegistrations[game.id];
                const availableSlots = Math.max(0, game.maxPlayers - game.confirmedCount);
                const isFull = availableSlots === 0;

                return (
                  <Card 
                    key={game.id} 
                    accentBar 
                    accentColor={isCancelled ? 'red' : isUserConfirmed ? 'navy' : 'navy'} 
                    className="shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          {isCancelled ? (
                            <span className="inline-block text-[10px] font-bold text-red-600 uppercase tracking-wider">
                              Jogo Cancelado
                            </span>
                          ) : isUserConfirmed ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Presença Confirmada
                            </span>
                          ) : isFull ? (
                            <span className="inline-block text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                              Lotado
                            </span>
                          ) : (
                            <span className="inline-block text-[10px] font-bold text-[#E63946] uppercase tracking-wider">
                              Inscrições Abertas
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-black text-[#0B192C]">{game.title}</h3>
                      </div>
                      <Badge variant={isFull ? 'warning' : 'info'} size="sm">
                        {game.confirmedCount}/{game.maxPlayers} vagas
                      </Badge>
                    </div>

                    {game.notes && (
                      <p className="text-xs text-slate-600 line-clamp-2">{game.notes}</p>
                    )}

                    <div className="space-y-1.5 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        <span className="font-semibold">{dt.dateStr}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        <span className="font-semibold">{dt.timeStr}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        <span>{game.location}</span>
                      </div>
                    </div>

                    <div className="pt-1">
                      <Button
                        variant={isUserConfirmed ? 'outline' : 'primary'}
                        size="sm"
                        fullWidth
                        onClick={() => navigate(`/jogos/${game.id}`)}
                        icon={isUserConfirmed ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Users className="w-4 h-4" />}
                        className={isUserConfirmed ? 'border-emerald-300 text-emerald-800 hover:bg-emerald-50' : 'bg-[#0B192C]'}
                      >
                        {isUserConfirmed ? 'Ver Minha Confirmação' : 'Ver Jogo / Confirmar Presença'}
                      </Button>
                    </div>
                  </Card>
                );
              })
            ) : (
              <EmptyState
                icon={<Calendar className="w-8 h-8" />}
                title="Nenhum jogo disponível no momento"
                description="Novas partidas serão agendadas pelos organizadores da vila em breve."
              />
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {DEMO_PAST_GAMES.length > 0 ? (
              DEMO_PAST_GAMES.map((game) => (
                <Card key={game.id} accentBar accentColor="navy" className="bg-slate-50 opacity-90">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <Badge variant="success" size="sm" className="mb-1">
                        Concluído
                      </Badge>
                      <h3 className="text-sm font-bold text-[#0B192C]">{game.title}</h3>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">{game.date}</span>
                  </div>

                  <p className="text-xs text-slate-500 mb-3">{game.description}</p>

                  <div className="text-xs text-slate-600 flex items-center justify-between border-t pt-2 border-slate-200">
                    <span>Participantes: <strong>12 jogadores</strong></span>
                    <button 
                      onClick={() => navigate('/placar')}
                      className="text-[#1E3A8A] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      Ver Placar <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </Card>
              ))
            ) : (
              <EmptyState
                icon={<History className="w-8 h-8" />}
                title="Sem histórico de partidas"
                description="Os resultados das partidas anteriores aparecerão nesta aba."
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
};
