import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Avatar } from '../components/Avatar';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';
import { useAuth } from '../context/AuthContext';
import { 
  Game, 
  GameRegistration 
} from '../types';
import { 
  getGameById, 
  getGameRegistrations, 
  confirmPresence, 
  cancelPresence, 
  formatGameDateTime 
} from '../lib/gameService';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  Info,
  FileText,
  Sparkles,
  Trophy
} from 'lucide-react';

export const GameDetailPage: React.FC = () => {
  const { id: gameId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [game, setGame] = useState<Game | null>(null);
  const [registrations, setRegistrations] = useState<GameRegistration[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // RSVP actions state
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Cancellation modal state
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    if (!gameId) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const g = await getGameById(gameId);
      if (!g) {
        setErrorMsg('Jogo não encontrado.');
        setLoading(false);
        return;
      }
      setGame(g);

      const regs = await getGameRegistrations(gameId);
      setRegistrations(regs);
    } catch (err: any) {
      console.error('[GameDetailPage] Error loading game details:', err);
      setErrorMsg('Não foi possível carregar as informações do jogo.');
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 text-[#0F172A] pb-24">
        <Header title="Detalhes do Jogo" />
        <main className="max-w-md mx-auto px-4 py-12 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#0B192C] mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Carregando detalhes do jogo...</p>
        </main>
      </div>
    );
  }

  if (errorMsg || !game) {
    return (
      <div className="min-h-screen bg-slate-100 text-[#0F172A] pb-24">
        <Header title="Detalhes do Jogo" />
        <main className="max-w-md mx-auto px-4 py-8 space-y-4">
          <button
            onClick={() => navigate('/jogos')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B192C] hover:text-[#1E3A8A] bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar aos jogos
          </button>
          <Alert type="error" title="Erro">
            {errorMsg || 'Jogo não encontrado.'}
          </Alert>
        </main>
      </div>
    );
  }

  const dt = formatGameDateTime(game.scheduledAt);
  const isCancelled = game.status === 'cancelled' || (game.status as string) === 'cancelado';
  const isPast = dt.isPast;
  const isUserConfirmed = !!profile && registrations.some((r) => r.userId === profile.uid && r.status === 'confirmed');
  const availableSlots = Math.max(0, game.maxPlayers - game.confirmedCount);
  const isFull = availableSlots === 0;

  // Handle Confirm Presence
  const handleConfirm = async () => {
    if (!profile || !gameId) return;
    setIsActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await confirmPresence(gameId, profile);
      setActionSuccess('Presença confirmada com sucesso!');
      setTimeout(() => setActionSuccess(null), 4000);
      await loadData();
    } catch (err: any) {
      console.error('[GameDetailPage] Confirm error:', err);
      setActionError(err.message || 'Não foi possível confirmar sua presença. Tente novamente.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Cancel Presence
  const handleCancelPresence = async () => {
    if (!profile || !gameId) return;
    setIsActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await cancelPresence(gameId, profile);
      setActionSuccess('Sua presença foi cancelada.');
      setTimeout(() => setActionSuccess(null), 4000);
      setShowCancelModal(false);
      await loadData();
    } catch (err: any) {
      console.error('[GameDetailPage] Cancel error:', err);
      setActionError(err.message || 'Não foi possível cancelar sua presença. Tente novamente.');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-[#0F172A] pb-24">
      <Header title="Detalhes do Jogo" />

      <main className="max-w-md mx-auto px-4 py-5 space-y-4">
        {/* Navigation back */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/jogos')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B192C] hover:text-[#1E3A8A] bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar aos jogos
          </button>

          {isCancelled ? (
            <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2.5 py-1 rounded-full border border-red-200">
              Jogo Cancelado
            </span>
          ) : isFull ? (
            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-200">
              Lotado
            </span>
          ) : availableSlots === 1 ? (
            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
              Última Vaga!
            </span>
          ) : (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Vagas Disponíveis
            </span>
          )}
        </div>

        {/* Action Toasts */}
        {actionSuccess && (
          <Alert type="success" className="animate-fadeIn">
            {actionSuccess}
          </Alert>
        )}

        {actionError && (
          <Alert type="error" className="animate-fadeIn">
            {actionError}
          </Alert>
        )}

        {/* Cancelled Banner */}
        {isCancelled && (
          <Alert type="warning" title="Aviso Importante" className="border-red-300 bg-red-50 text-red-900">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <p className="text-xs font-bold">Este jogo foi cancelado pelos organizadores.</p>
            </div>
          </Alert>
        )}

        {/* Game Details Card */}
        <Card accentBar accentColor={isCancelled ? 'red' : 'navy'} className="shadow-md space-y-4">
          <div>
            <h1 className="text-lg font-black text-[#0B192C]">{game.title}</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Capacidade: {game.confirmedCount} / {game.maxPlayers} confirmados
            </p>
          </div>

          <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-[#1E3A8A] shrink-0" />
              <span className="font-semibold">{dt.dateStr}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-[#1E3A8A] shrink-0" />
              <span className="font-semibold">{dt.timeStr}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-[#1E3A8A] shrink-0" />
              <span>{game.location}</span>
            </div>
          </div>

          {game.notes && (
            <div className="space-y-1 pt-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-[#1E3A8A]" /> Observações
              </span>
              <p className="text-xs text-slate-600 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200">
                {game.notes}
              </p>
            </div>
          )}

          {/* Match Session Module Card */}
          {!isCancelled && (
            <div className="p-3 bg-[#0B192C] text-white rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-400 text-[#0B192C]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white">Partida e Formação de Times</h3>
                    <p className="text-[10px] text-slate-300">Escalação, convidados e placar</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                {(profile?.role === 'owner' || profile?.role === 'admin') && (
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    onClick={() => navigate(`/admin/jogos/${game.id}/partida`)}
                    className="bg-amber-400 text-[#0B192C] hover:bg-amber-300 text-xs font-black py-2"
                    icon={<Sparkles className="w-3.5 h-3.5" />}
                  >
                    Preparar / Gerenciar Partida
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={() => navigate(`/partidas/match_${game.id}`)}
                  className="border-white/30 text-white hover:bg-white/10 text-xs py-2"
                  icon={<Trophy className="w-3.5 h-3.5 text-amber-400" />}
                >
                  Placar ao Vivo
                </Button>
              </div>
            </div>
          )}

          {/* User RSVP Action Section */}
          <div className="pt-2 border-t border-slate-100">
            {isCancelled ? (
              <Button
                variant="outline"
                size="md"
                fullWidth
                disabled
                className="border-slate-300 text-slate-400 cursor-not-allowed"
              >
                Confirmação indisponível (Jogo Cancelado)
              </Button>
            ) : isPast ? (
              <Button
                variant="outline"
                size="md"
                fullWidth
                disabled
                className="border-slate-300 text-slate-400 cursor-not-allowed"
              >
                Período de confirmação terminado
              </Button>
            ) : isUserConfirmed ? (
              <div className="space-y-2.5 bg-emerald-50/80 border border-emerald-200 p-3.5 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-xs font-black text-emerald-900">Sua presença está confirmada!</p>
                      <p className="text-[11px] text-emerald-700">Vaga reservada com sucesso para este jogo.</p>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">
                    Confirmado
                  </Badge>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={() => setShowCancelModal(true)}
                  disabled={isActionLoading}
                  icon={<XCircle className="w-4 h-4 text-red-600" />}
                  className="border-red-200 text-red-700 hover:bg-red-50 bg-white"
                >
                  Cancelar minha presença
                </Button>
              </div>
            ) : isFull ? (
              <div className="space-y-2 text-center">
                <Button
                  variant="outline"
                  size="md"
                  fullWidth
                  disabled
                  className="border-slate-300 text-slate-400 cursor-not-allowed"
                >
                  Este jogo está lotado ({game.maxPlayers}/{game.maxPlayers})
                </Button>
                <p className="text-[11px] text-slate-500 font-medium">
                  Todas as vagas foram preenchidas. Fique atento a desistências!
                </p>
              </div>
            ) : (
              <Button
                variant="primary"
                size="md"
                fullWidth
                loading={isActionLoading}
                onClick={handleConfirm}
                icon={<CheckCircle2 className="w-5 h-5" />}
                className="bg-[#0B192C] hover:bg-[#1E3A8A] text-white py-3"
              >
                Confirmar minha presença
              </Button>
            )}
          </div>
        </Card>

        {/* Confirmed Participants List (Safe Public Player Info) */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0B192C] flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#1E3A8A]" />
              Jogadores Confirmados ({registrations.length}/{game.maxPlayers})
            </h2>
          </div>

          <Card className="space-y-2">
            {registrations.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                Nenhum jogador confirmou presença ainda. Seja o primeiro a garantir a vaga!
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {registrations.map((reg, idx) => (
                  <div key={reg.id} className="py-2.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-bold text-slate-400 w-4 text-right">
                        {idx + 1}.
                      </span>
                      <Avatar name={reg.username} url={reg.photoUrl || undefined} size="sm" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#0B192C] truncate">
                          {reg.username}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Confirmado
                        </p>
                      </div>
                    </div>

                    <Badge variant="success" size="sm" className="shrink-0">
                      Confirmado
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Disclaimer Notice */}
        <Alert type="info" className="text-xs">
          <div className="flex items-start gap-1.5">
            <Info className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
            <p className="text-[11px] text-blue-900 leading-relaxed">
              <strong>Observação:</strong> A confirmação de presença reserva sua vaga na quadra. A contabilização de presença efetiva e histórico técnico ocorre somente ao término da partida.
            </p>
          </div>
        </Alert>
      </main>

      {/* Cancellation Modal Confirmation */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-100 text-red-700">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#0B192C]">Cancelar Presença</h3>
                <p className="text-xs text-slate-500">Confirmação de liberação de vaga</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
              Deseja cancelar sua presença neste jogo? Sua vaga será liberada para outros jogadores da vila.
            </p>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => setShowCancelModal(false)}
                disabled={isActionLoading}
              >
                Voltar
              </Button>
              <Button
                variant="danger"
                size="sm"
                fullWidth
                loading={isActionLoading}
                onClick={handleCancelPresence}
              >
                Confirmar cancelamento
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
