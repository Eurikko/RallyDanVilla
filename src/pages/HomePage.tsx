import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Avatar } from '../components/Avatar';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';
import { useAuth } from '../context/AuthContext';
import { Game } from '../types';
import { 
  getUpcomingGames, 
  getUserRegistrations, 
  formatGameDateTime 
} from '../lib/gameService';
import { 
  Calendar, 
  Award, 
  BookOpen, 
  Users, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Plus,
  Loader2,
  Bell
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [nextGame, setNextGame] = useState<Game | null>(null);
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
  const [gameLoading, setGameLoading] = useState<boolean>(true);

  useEffect(() => {
    if (location.state?.errorMsg) {
      setToastMessage(location.state.errorMsg);
      // Clear location state to prevent repeating message on refresh
      window.history.replaceState({}, document.title);
      setTimeout(() => setToastMessage(null), 5000);
    }
  }, [location]);

  useEffect(() => {
    async function loadNextGame() {
      setGameLoading(true);
      try {
        const games = await getUpcomingGames();
        // Filter active scheduled games in future
        const scheduled = games.filter(
          (g) => g.status === 'scheduled' && new Date(g.scheduledAt).getTime() > Date.now()
        );

        if (scheduled.length > 0) {
          const game = scheduled[0];
          setNextGame(game);

          if (profile?.uid) {
            const regs = await getUserRegistrations(profile.uid);
            setIsConfirmed(!!regs[game.id]);
          }
        } else {
          setNextGame(null);
        }
      } catch (err) {
        console.error('[HomePage] Error loading next game:', err);
      } finally {
        setGameLoading(false);
      }
    }

    loadNextGame();
  }, [profile?.uid]);

  const handleActionNotice = (featureName: string) => {
    setToastMessage(`A funcionalidade "${featureName}" estará disponível em breve.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const username = profile?.username || 'Jogador';
  const attendanceCount = profile?.attendanceCount ?? 0;
  const levelText = profile?.technicalLevel || 'Ainda não classificado';
  const userRole = profile?.role || 'player';

  const roleLabel = userRole === 'owner' ? 'Proprietário' : userRole === 'admin' ? 'Administrador' : 'Jogador';
  const roleBadgeVariant = userRole === 'owner' ? 'owner' : userRole === 'admin' ? 'admin' : 'player';

  const canAccessAdmin = userRole === 'owner' || userRole === 'admin';

  return (
    <div className="min-h-screen bg-slate-100 text-[#0F172A] pb-24">
      <Header />

      <main className="max-w-md mx-auto px-4 py-5 space-y-5">
        {/* Temporary Toast Banner if triggered */}
        {toastMessage && (
          <Alert type="warning" title="Aviso" className="animate-fadeIn">
            {toastMessage}
          </Alert>
        )}

        {/* User Greeting Header with Real Auth Profile */}
        <Card 
          onClick={() => navigate('/perfil')}
          accentBar 
          accentColor="navy" 
          className="shadow-md cursor-pointer hover:border-[#1E3A8A] transition-all bg-white"
        >
          <div className="flex items-center gap-3.5">
            <PlayerAvatar 
              photoUrl={profile?.photoUrl} 
              displayName={profile?.displayName} 
              username={username} 
              size="lg" 
              showBadge={true}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h1 className="text-base font-black text-[#0B192C] truncate">
                  {profile?.displayName || username}
                </h1>
                <span className="text-[10px] font-bold text-[#1E3A8A] bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-blue-100 shrink-0">
                  Meu Perfil
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
              <p className="text-xs text-slate-500 font-semibold mb-1.5">@{username}</p>
              
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant={roleBadgeVariant} size="sm">
                  {roleLabel}
                </Badge>
                <Badge variant="level" size="sm">
                  {levelText}
                </Badge>
              </div>
            </div>
          </div>

          <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Presenças registradas:</span>
            <span className="font-bold text-[#0B192C] bg-slate-100 px-2.5 py-0.5 rounded-full">
              {attendanceCount} {attendanceCount === 1 ? 'partida' : 'partidas'}
            </span>
          </div>
        </Card>

        {/* Central Administrativa Card - Displayed only for Owner and Admin */}
        {canAccessAdmin && (
          <Card
            onClick={() => navigate('/admin')}
            accentBar
            accentColor="navy"
            className="bg-gradient-to-r from-[#0B192C] to-[#1E3A8A] text-white hover:opacity-95 shadow-md cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-black text-white">Central Administrativa</h3>
                    <Badge variant={userRole === 'owner' ? 'owner' : 'admin'} size="sm">
                      {roleLabel}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-slate-300">
                    {userRole === 'owner'
                      ? 'Gerenciar administradores e controle da vila'
                      : 'Painel e recursos de controle do grupo'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </div>
          </Card>
        )}

        {/* Próximo Jogo Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0B192C] flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#E63946]" />
              Próximo jogo
            </h2>
            {nextGame && (
              <span className="text-[11px] font-semibold text-[#E63946] bg-red-50 px-2 py-0.5 rounded-full">
                {nextGame.confirmedCount}/{nextGame.maxPlayers} vagas
              </span>
            )}
          </div>

          <Card className="border-l-4 border-l-[#E63946]">
            {gameLoading ? (
              <div className="py-4 text-center space-y-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#0B192C] mx-auto" />
                <p className="text-xs text-slate-500 font-medium">Buscando próximo jogo...</p>
              </div>
            ) : nextGame ? (
              (() => {
                const dt = formatGameDateTime(nextGame.scheduledAt);
                return (
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-black text-[#0B192C]">{nextGame.title}</h3>
                        <p className="text-xs text-slate-500">{nextGame.notes || nextGame.description || 'Partida de vôlei na vila'}</p>
                      </div>
                      {isConfirmed && (
                        <Badge variant="success" size="sm">
                          Confirmado
                        </Badge>
                      )}
                    </div>

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
                        <span>{nextGame.location}</span>
                      </div>
                    </div>

                    <div className="pt-1 flex gap-2">
                      <Button
                        variant={isConfirmed ? 'outline' : 'primary'}
                        size="sm"
                        fullWidth
                        onClick={() => navigate(`/jogos/${nextGame.id}`)}
                        icon={<CheckCircle2 className="w-4 h-4" />}
                        className={isConfirmed ? 'border-emerald-300 text-emerald-800 hover:bg-emerald-50' : 'bg-[#0B192C]'}
                      >
                        {isConfirmed ? 'Sua Presença Confirmada' : 'Confirmar Presença'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/jogos/${nextGame.id}`)}
                      >
                        Detalhes
                      </Button>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="py-2 space-y-2">
                <p className="text-xs text-slate-500 font-medium">Nenhum jogo programado no momento.</p>
                {canAccessAdmin ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/admin/jogos')}
                    icon={<Plus className="w-4 h-4" />}
                    className="bg-[#0B192C]"
                  >
                    Agendar Novo Jogo
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/jogos')}
                  >
                    Ver todos os jogos
                  </Button>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Feature Cards Grid */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#0B192C]">
            Ações Rápidas
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {/* Card: Participar de um jogo */}
            <Card 
              onClick={() => navigate('/jogos')}
              className="bg-gradient-to-br from-white to-blue-50/50 border-blue-200/80 hover:border-[#1E3A8A]"
            >
              <div className="p-1 space-y-2">
                <div className="w-9 h-9 rounded-xl bg-[#1E3A8A] text-white flex items-center justify-center shadow-sm">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-black text-[#0B192C]">Participar de um jogo</h3>
                <p className="text-[10px] text-slate-500">Veja a lista e garanta sua vaga</p>
              </div>
            </Card>

            {/* Card: Meus jogos */}
            <Card 
              onClick={() => handleActionNotice('Meus Jogos')}
              className="bg-gradient-to-br from-white to-slate-50 border-slate-200"
            >
              <div className="p-1 space-y-2">
                <div className="w-9 h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-sm">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-black text-[#0B192C]">Meus jogos</h3>
                <p className="text-[10px] text-slate-500">Histórico de partidas participadas</p>
              </div>
            </Card>

            {/* Card: Formação de times */}
            <Card 
              onClick={() => handleActionNotice('Formação Equilibrada de Times')}
              className="bg-gradient-to-br from-white to-red-50/40 border-red-200/80 hover:border-[#E63946]"
            >
              <div className="p-1 space-y-2">
                <div className="w-9 h-9 rounded-xl bg-[#E63946] text-white flex items-center justify-center shadow-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-black text-[#0B192C]">Formação de times</h3>
                <p className="text-[10px] text-slate-500">Algoritmo de sorteio nivelado</p>
              </div>
            </Card>

            {/* Quick Link: Placar */}
            <Card 
              onClick={() => navigate('/placar')}
              className="bg-gradient-to-br from-white to-amber-50/40 border-amber-200/80"
            >
              <div className="p-1 space-y-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-black text-[#0B192C]">Placar ao vivo</h3>
                <p className="text-[10px] text-slate-500">Acompanhe pontuação dos sets</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Quick Access to Notifications Banner */}
        <Card 
          onClick={() => navigate('/avisos')}
          className="bg-gradient-to-r from-[#0B192C] to-[#1E3A8A] text-white border-0 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between p-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center shrink-0 border border-white/20">
                <Bell className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                  Central de Avisos Internos
                </h3>
                <p className="text-[11px] text-slate-300 font-medium">
                  Confira suas notificações, partidas e confirmações
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300" />
          </div>
        </Card>

        {/* Quick Access to Rules Banner */}
        <Card 
          onClick={() => navigate('/regras')}
          accentBar
          accentColor="navy"
          className="bg-[#0B192C] text-white hover:bg-[#0F223D]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/10 text-[#E63946]">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black text-white">Livro de Regras da Vila</h3>
                <p className="text-[10px] text-slate-300">Normas da quadra, fair play e regulamento</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
        </Card>
      </main>
    </div>
  );
};
