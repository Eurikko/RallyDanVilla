import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';
import { Input } from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { Game } from '../types';
import { 
  getUpcomingGames, 
  createGame, 
  updateGame, 
  cancelGame, 
  formatGameDateTime 
} from '../lib/gameService';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Plus, 
  Edit3, 
  XCircle, 
  ArrowLeft, 
  ShieldCheck, 
  Loader2, 
  Users, 
  FileText,
  AlertTriangle,
  Sparkles
} from 'lucide-react';

export const AdminGamesPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();

  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Modal State for Create / Edit
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);

  // Form Fields
  const [title, setTitle] = useState<string>('');
  const [dateVal, setDateVal] = useState<string>('');
  const [timeVal, setTimeVal] = useState<string>('18:00');
  const [location, setLocation] = useState<string>('Quadra Poliesportiva da Vila');
  const [maxPlayers, setMaxPlayers] = useState<number>(12);
  const [notes, setNotes] = useState<string>('');

  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  // Modal State for Cancel Confirmation
  const [targetCancelGame, setTargetCancelGame] = useState<Game | null>(null);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Guard access: Only Owner or Admin
  useEffect(() => {
    if (!authLoading) {
      if (!profile) {
        navigate('/entrar', { replace: true });
        return;
      }
      if (profile.role !== 'owner' && profile.role !== 'admin') {
        navigate('/inicio', { 
          replace: true, 
          state: { errorMsg: 'Você não possui permissão para gerenciar jogos.' } 
        });
      }
    }
  }, [profile, authLoading, navigate]);

  // Load games from Firestore
  const loadGames = useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      const list = await getUpcomingGames();
      setGames(list);
    } catch (err) {
      console.error('[AdminGamesPage] Error loading games:', err);
      setPageError('Não foi possível carregar os jogos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (profile && (profile.role === 'owner' || profile.role === 'admin')) {
      loadGames();
    }
  }, [profile, loadGames]);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingGame(null);
    setTitle('Partida de Vôlei da Vila');
    
    // Default date to tomorrow in local time
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    setDateVal(`${yyyy}-${mm}-${dd}`);
    setTimeVal('18:00');
    
    setLocation('Quadra Poliesportiva da Vila');
    setMaxPlayers(12);
    setNotes('Chegar com 15 minutos de antecedência e trazer garrafa de água.');
    setFormError(null);
    setShowFormModal(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (game: Game) => {
    setEditingGame(game);
    setTitle(game.title);
    setLocation(game.location);
    setMaxPlayers(game.maxPlayers);
    setNotes(game.notes || game.description || '');

    try {
      const d = new Date(game.scheduledAt);
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        setDateVal(`${yyyy}-${mm}-${dd}`);
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        setTimeVal(`${hh}:${min}`);
      } else {
        setDateVal('');
        setTimeVal('18:00');
      }
    } catch {
      setDateVal('');
      setTimeVal('18:00');
    }

    setFormError(null);
    setShowFormModal(true);
  };

  // Submit Form (Create / Edit)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setFormError(null);

    // Form validations
    if (!title.trim() || title.trim().length < 3 || title.trim().length > 80) {
      setFormError('O título deve ter entre 3 e 80 caracteres.');
      return;
    }

    if (!location.trim() || location.trim().length < 2 || location.trim().length > 120) {
      setFormError('O local deve ter entre 2 e 120 caracteres.');
      return;
    }

    if (!dateVal || !timeVal) {
      setFormError('Informe a data e o horário do jogo.');
      return;
    }

    const dateParts = dateVal.split('-').map(Number);
    const timeParts = timeVal.split(':').map(Number);
    if (dateParts.length !== 3 || timeParts.length < 2) {
      setFormError('Informe a data e o horário do jogo.');
      return;
    }

    const scheduledDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], timeParts[0], timeParts[1], 0);
    if (isNaN(scheduledDate.getTime())) {
      setFormError('Data ou horário inválido.');
      return;
    }

    if (scheduledDate.getTime() <= Date.now()) {
      setFormError('A data e horário do jogo devem ser no futuro.');
      return;
    }

    if (isNaN(maxPlayers) || maxPlayers < 4 || maxPlayers > 30) {
      setFormError('A capacidade de jogadores deve ser entre 4 e 30.');
      return;
    }

    if (notes.trim().length > 500) {
      setFormError('As observações devem ter no máximo 500 caracteres.');
      return;
    }

    setFormSubmitting(true);

    try {
      if (editingGame) {
        await updateGame(
          editingGame.id,
          {
            title: title.trim(),
            scheduledAt: scheduledDate.toISOString(),
            location: location.trim(),
            maxPlayers,
            notes: notes.trim(),
          },
          profile
        );
        setSuccessToast('Jogo atualizado com sucesso!');
      } else {
        await createGame(
          {
            title: title.trim(),
            scheduledAt: scheduledDate.toISOString(),
            location: location.trim(),
            maxPlayers,
            notes: notes.trim(),
          },
          profile
        );
        setSuccessToast('Novo jogo criado com sucesso!');
      }

      setTimeout(() => setSuccessToast(null), 4000);
      setShowFormModal(false);
      await loadGames();
    } catch (err: any) {
      console.error('[AdminGamesPage] Form submit error:', err);
      setFormError(err.message || 'Ocorreu um erro ao salvar o jogo.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Confirm Game Cancellation
  const handleConfirmCancelGame = async () => {
    if (!targetCancelGame || !profile) return;

    setIsCancelling(true);
    setCancelError(null);

    try {
      await cancelGame(targetCancelGame.id, profile);
      setSuccessToast('O jogo foi cancelado com sucesso.');
      setTimeout(() => setSuccessToast(null), 4000);
      setTargetCancelGame(null);
      await loadGames();
    } catch (err: any) {
      console.error('[AdminGamesPage] Cancel game error:', err);
      setCancelError(err.message || 'Não foi possível cancelar o jogo.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (authLoading || !profile || (profile.role !== 'owner' && profile.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-[#0B192C]" />
          <p className="text-xs font-semibold">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-[#0F172A] pb-24">
      <Header title="Gerenciar Jogos" />

      <main className="max-w-md mx-auto px-4 py-5 space-y-4">
        {/* Navigation back to Admin */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B192C] hover:text-[#1E3A8A] bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar à Central
          </button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            icon={<Plus className="w-4 h-4" />}
            className="bg-[#0B192C] hover:bg-[#1E3A8A]"
          >
            Novo Jogo
          </Button>
        </div>

        {/* Success Toast */}
        {successToast && (
          <Alert type="success" className="animate-fadeIn">
            {successToast}
          </Alert>
        )}

        {/* Page Error */}
        {pageError && (
          <Alert type="error" className="animate-fadeIn">
            {pageError}
          </Alert>
        )}

        {/* Title Card */}
        <Card accentBar accentColor="navy" className="bg-[#0B192C] text-white">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white/10 text-amber-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-black text-white">Jogos e Presença</h1>
              <p className="text-xs text-slate-300">
                Criar, editar e cancelar partidas organizadas na vila
              </p>
            </div>
          </div>
        </Card>

        {/* Games List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0B192C] flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#1E3A8A]" />
              Partidas Cadastradas ({games.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center space-y-2 bg-white rounded-2xl border border-slate-200">
              <Loader2 className="w-6 h-6 animate-spin text-[#0B192C] mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Buscando jogos cadastrados...</p>
            </div>
          ) : games.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200 space-y-3">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-medium text-slate-600">Nenhum jogo cadastrado no momento.</p>
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenCreate}
                icon={<Plus className="w-4 h-4" />}
                className="bg-[#0B192C]"
              >
                Criar Primeiro Jogo
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {games.map((g) => {
                const dt = formatGameDateTime(g.scheduledAt);
                const isCancelled = g.status === 'cancelled' || (g.status as string) === 'cancelado';

                return (
                  <Card key={g.id} accentBar accentColor={isCancelled ? 'red' : 'navy'} className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-black text-[#0B192C]">{g.title}</h3>
                          {isCancelled && (
                            <Badge variant="error" size="sm">
                              Cancelado
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{g.location}</p>
                      </div>

                      <Badge variant="info" size="sm">
                        {g.confirmedCount}/{g.maxPlayers} vagas
                      </Badge>
                    </div>

                    <div className="space-y-1 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        <span className="font-semibold">{dt.fullStr}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        <span>Confirmados: {g.confirmedCount} atleta(s)</span>
                      </div>
                    </div>

                    {!isCancelled && (
                      <div className="space-y-2 pt-1">
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate(`/admin/jogos/${g.id}/partida`)}
                            icon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                            className="bg-[#0B192C] hover:bg-[#1E3A8A] text-white text-[11px]"
                          >
                            Times / Partida
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate(`/admin/partidas/${g.id}/comparecimento`)}
                            icon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white text-[11px]"
                          >
                            Comparecimento
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            fullWidth
                            onClick={() => handleOpenEdit(g)}
                            icon={<Edit3 className="w-3.5 h-3.5" />}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setTargetCancelGame(g)}
                            icon={<XCircle className="w-3.5 h-3.5 text-red-600" />}
                            className="border-red-200 text-red-700 hover:bg-red-50"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modal: Create or Edit Game */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 text-[#1E3A8A]">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#0B192C]">
                    {editingGame ? 'Editar Jogo' : 'Novo Jogo de Vôlei'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Agendamento de partida na vila</p>
                </div>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <Alert type="error" className="text-xs">
                {formError}
              </Alert>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Título do Jogo *</label>
                <Input
                  placeholder="Ex: Partida Semanal da Vila"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={formSubmitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Data *</label>
                  <Input
                    type="date"
                    value={dateVal}
                    onChange={(e) => setDateVal(e.target.value)}
                    disabled={formSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Horário *</label>
                  <Input
                    type="time"
                    value={timeVal}
                    onChange={(e) => setTimeVal(e.target.value)}
                    disabled={formSubmitting}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Local *</label>
                <Input
                  placeholder="Ex: Quadra Poliesportiva Central"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={formSubmitting}
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Limite de Jogadores (4 a 30) *</label>
                <Input
                  type="number"
                  min={4}
                  max={30}
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(parseInt(e.target.value, 10) || 12)}
                  disabled={formSubmitting}
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Observações (opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Regras específicas, material necessário, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={formSubmitting}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] text-xs text-slate-800"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  disabled={formSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  type="submit"
                  loading={formSubmitting}
                  className="bg-[#0B192C]"
                >
                  {editingGame ? 'Salvar Alterações' : 'Criar Jogo'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Cancel Game */}
      {targetCancelGame && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-100 text-red-700">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#0B192C]">Cancelar Jogo</h3>
                <p className="text-xs text-slate-500">Confirmação de cancelamento</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
              Deseja cancelar o jogo <strong>"{targetCancelGame.title}"</strong>? As confirmações existentes serão preservadas no histórico, mas novas presenças não poderão ser registradas.
            </p>

            {cancelError && (
              <Alert type="error" className="text-xs">
                {cancelError}
              </Alert>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => setTargetCancelGame(null)}
                disabled={isCancelling}
              >
                Voltar
              </Button>
              <Button
                variant="danger"
                size="sm"
                fullWidth
                loading={isCancelling}
                onClick={handleConfirmCancelGame}
              >
                Sim, Cancelar Jogo
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
