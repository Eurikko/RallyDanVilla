import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';
import { useAuth } from '../context/AuthContext';
import { 
  getMatchAttendance, 
  finalizeMatchAttendance, 
  correctMatchAttendance,
  ParticipantAttendanceItem, 
  AttendanceSummaryMetrics 
} from '../lib/attendanceService';
import { MatchSession, AttendanceStatus } from '../types';
import { 
  ArrowLeft, 
  Check, 
  X, 
  AlertTriangle, 
  Loader2, 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  Clock, 
  Info,
  Edit2,
  Lock,
  Sparkles
} from 'lucide-react';

export const AdminAttendancePage: React.FC = () => {
  const { matchId, gameId } = useParams<{ matchId?: string; gameId?: string }>();
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();

  const [match, setMatch] = useState<MatchSession | null>(null);
  const [participants, setParticipants] = useState<ParticipantAttendanceItem[]>([]);
  const [metrics, setMetrics] = useState<AttendanceSummaryMetrics | null>(null);
  
  // Selection state for each participantId -> 'present' | 'absent' | 'pending'
  const [selections, setSelections] = useState<Record<string, AttendanceStatus>>({});

  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Finalize Confirmation Modal
  const [showFinalizeModal, setShowFinalizeModal] = useState<boolean>(false);

  // Owner Correction Modal
  const [correctionTarget, setCorrectionTarget] = useState<ParticipantAttendanceItem | null>(null);
  const [correctionNewStatus, setCorrectionNewStatus] = useState<'present' | 'absent'>('present');
  const [correctionReason, setCorrectionReason] = useState<string>('');
  const [isCorrecting, setIsCorrecting] = useState<boolean>(false);
  const [correctionError, setCorrectionError] = useState<string | null>(null);

  // Access control check
  useEffect(() => {
    if (!authLoading) {
      if (!profile) {
        navigate('/entrar', { replace: true });
        return;
      }
      if (profile.role !== 'owner' && profile.role !== 'admin') {
        navigate('/inicio', { 
          replace: true, 
          state: { errorMsg: 'Acesso restrito a organizadores e administradores.' } 
        });
      }
    }
  }, [profile, authLoading, navigate]);

  const loadData = useCallback(async () => {
    const targetMatchId = matchId || gameId;
    if (!targetMatchId || !profile) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const data = await getMatchAttendance(targetMatchId);
      setMatch(data.match);
      setParticipants(data.participants);
      setMetrics(data.metrics);

      // Populate current selections
      const initialSel: Record<string, AttendanceStatus> = {};
      data.participants.forEach((p) => {
        initialSel[p.participantId] = p.attendanceStatus;
      });
      setSelections(initialSel);
    } catch (err: any) {
      console.error('[AdminAttendancePage] Load error:', err);
      setErrorMsg(err.message || 'Não foi possível carregar o registro de comparecimento.');
    } finally {
      setLoading(false);
    }
  }, [matchId, gameId, profile]);

  useEffect(() => {
    if (profile && (profile.role === 'owner' || profile.role === 'admin')) {
      loadData();
    }
  }, [profile, loadData]);

  // Handle selection change
  const handleToggleStatus = (participantId: string, status: 'present' | 'absent') => {
    if (match?.attendanceStatus === 'finalized' || match?.attendanceStatus === 'corrected') {
      return; // Locked after finalization unless corrected by owner
    }

    setSelections((prev) => ({
      ...prev,
      [participantId]: prev[participantId] === status ? 'pending' : status,
    }));
  };

  // Check if all participants have a selection
  const totalCount = participants.length;
  const selectedCount = Object.values(selections).filter((s) => s === 'present' || s === 'absent').length;
  const isAllSelected = totalCount > 0 && selectedCount === totalCount;

  // Calculate live preview metrics based on selections
  const livePresent = Object.values(selections).filter((s) => s === 'present').length;
  const liveAbsent = Object.values(selections).filter((s) => s === 'absent').length;
  const livePending = totalCount - livePresent - liveAbsent;

  // Submit Finalization
  const handleFinalizeSubmit = async () => {
    if (!match || !profile) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const clientActionId = `att_act_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const attendanceItems = Object.entries(selections).map(([partId, status]) => ({
        participantId: partId,
        status: (status === 'present' ? 'present' : 'absent') as 'present' | 'absent',
      }));

      await finalizeMatchAttendance({
        requestorUid: profile.uid,
        matchId: match.id,
        clientActionId,
        attendanceItems,
      });

      setSuccessMsg('Comparecimento registrado e participações contabilizadas com sucesso!');
      setShowFinalizeModal(false);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao finalizar o comparecimento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Owner Correction
  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!match || !profile || !correctionTarget) return;

    if (!correctionReason.trim()) {
      setCorrectionError('Informe o motivo da correção.');
      return;
    }

    setIsCorrecting(true);
    setCorrectionError(null);

    try {
      const clientActionId = `corr_act_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      await correctMatchAttendance({
        requestorUid: profile.uid,
        matchId: match.id,
        participantId: correctionTarget.participantId,
        newStatus: correctionNewStatus,
        reason: correctionReason.trim(),
        clientActionId,
      });

      setSuccessMsg(`Comparecimento de ${correctionTarget.displayName} corrigido com sucesso.`);
      setCorrectionTarget(null);
      setCorrectionReason('');
      await loadData();
    } catch (err: any) {
      setCorrectionError(err.message || 'Erro ao aplicar correção.');
    } finally {
      setIsCorrecting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#0B192C] mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Carregando comparativo de presença...</p>
        </div>
      </div>
    );
  }

  const isFinalized = match?.attendanceStatus === 'finalized' || match?.attendanceStatus === 'corrected';
  const isMatchFinished = match?.status === 'finished' || match?.status === 'concluido';
  const isMatchCancelled = match?.status === 'cancelled' || match?.status === 'cancelado';

  return (
    <div className="min-h-screen bg-slate-100 text-[#0F172A] pb-28">
      <Header />

      <main className="max-w-md mx-auto px-4 py-5 space-y-5">
        {/* Navigation & Status Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/admin/jogos')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B192C] hover:text-[#1E3A8A] bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar aos Jogos
          </button>
          
          <Badge 
            variant={isFinalized ? 'success' : isMatchFinished ? 'warning' : 'info'} 
            size="sm"
          >
            {isFinalized ? 'Comparecimento Finalizado' : isMatchFinished ? 'Aguardando Finalização' : 'Partida em Andamento'}
          </Badge>
        </div>

        {/* Match Header Info Card */}
        {match && (
          <Card accentBar accentColor={isFinalized ? 'gold' : 'navy'} className="bg-[#0B192C] text-white space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                  Registro do Comparecimento Real
                </span>
                <h1 className="text-base font-black text-white">
                  {match.teamAName} vs {match.teamBName}
                </h1>
                <p className="text-xs text-slate-300">
                  {match.teamASetsWon} x {match.teamBSetsWon} sets • {match.format === 'best_of_3' ? 'Melhor de 3' : 'Set único'}
                </p>
              </div>

              {isFinalized ? (
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-md border border-emerald-500/30">
                    <ShieldCheck className="w-3 h-3" /> Contabilizado
                  </span>
                </div>
              ) : (
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-md border border-amber-500/30">
                    <Clock className="w-3 h-3" /> Pendente
                  </span>
                </div>
              )}
            </div>

            {isFinalized && match.attendanceFinalizedAt && (
              <p className="text-[10px] text-slate-400 border-t border-white/10 pt-1.5">
                Finalizado em: {new Date(match.attendanceFinalizedAt).toLocaleString('pt-BR')}
              </p>
            )}
          </Card>
        )}

        {/* Success / Error Alerts */}
        {errorMsg && <Alert type="error" className="text-xs">{errorMsg}</Alert>}
        {successMsg && <Alert type="success" className="text-xs">{successMsg}</Alert>}

        {/* Rule Explanation Banner */}
        {!isFinalized && (
          <Card className="bg-amber-50/70 border-amber-200 text-amber-900 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold">
              <Info className="w-4 h-4 text-amber-700 flex-shrink-0" />
              <span>Diferença entre Confirmação e Comparecimento</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Confirmação e escalação não geram pontos de participação automaticamente. Marque a presença real de cada atleta após a partida para atualizar com segurança o total de partidas jogadas (<code className="bg-amber-100/80 px-1 rounded">attendance_count</code>) nos perfis cadastrados.
            </p>
          </Card>
        )}

        {/* Live Metrics Summary Bar */}
        <Card className="grid grid-cols-4 gap-2 text-center p-3">
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Escalados</span>
            <span className="text-sm font-black text-[#0B192C]">{totalCount}</span>
          </div>

          <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">Presentes</span>
            <span className="text-sm font-black text-emerald-800">{livePresent}</span>
          </div>

          <div className="bg-rose-50 p-2 rounded-xl border border-rose-200">
            <span className="text-[10px] uppercase font-bold text-rose-700 block">Ausentes</span>
            <span className="text-sm font-black text-rose-800">{liveAbsent}</span>
          </div>

          <div className="bg-amber-50 p-2 rounded-xl border border-amber-200">
            <span className="text-[10px] uppercase font-bold text-amber-700 block">Pendentes</span>
            <span className="text-sm font-black text-amber-800">{livePending}</span>
          </div>
        </Card>

        {/* Attendance Marking List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0B192C]">
              Lista de Atletas Escalados ({totalCount})
            </h2>
            {isFinalized && (
              <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                <Lock className="w-3 h-3" /> Bloqueado pós-finalização
              </span>
            )}
          </div>

          {participants.length === 0 ? (
            <Card className="text-center py-6 text-slate-500 text-xs">
              Nenhum participante encontrado nesta partida.
            </Card>
          ) : (
            participants.map((item) => {
              const currentSel = selections[item.participantId] || 'pending';

              return (
                <Card key={item.participantId} className="p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-[#0B192C]">{item.displayName}</span>
                        {item.isGuest ? (
                          <span className="text-[9px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.2 rounded border border-purple-200">
                            Sem conta
                          </span>
                        ) : (
                          <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded border border-blue-200">
                            Com conta
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        {item.wasConfirmedRSVP ? (
                          <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5">
                            <Check className="w-3 h-3 text-emerald-600" /> Havia confirmado no agendamento
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-medium">
                            Não havia confirmado no agendamento
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Owner Correction Trigger when already finalized */}
                    {isFinalized && profile?.role === 'owner' && (
                      <button
                        onClick={() => {
                          setCorrectionTarget(item);
                          setCorrectionNewStatus(item.attendanceStatus === 'present' ? 'absent' : 'present');
                          setCorrectionReason('');
                          setCorrectionError(null);
                        }}
                        className="text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-lg border border-amber-200 flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" /> Corrigir
                      </button>
                    )}
                  </div>

                  {/* Toggle Buttons: Presente vs Ausente */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={isFinalized}
                      onClick={() => handleToggleStatus(item.participantId, 'present')}
                      className={`py-2 px-3 text-xs font-black rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                        currentSel === 'present'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      } ${isFinalized ? 'opacity-90 cursor-not-allowed' : ''}`}
                    >
                      <UserCheck className="w-4 h-4" />
                      Presente
                    </button>

                    <button
                      type="button"
                      disabled={isFinalized}
                      onClick={() => handleToggleStatus(item.participantId, 'absent')}
                      className={`py-2 px-3 text-xs font-black rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                        currentSel === 'absent'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      } ${isFinalized ? 'opacity-90 cursor-not-allowed' : ''}`}
                    >
                      <UserX className="w-4 h-4" />
                      Ausente
                    </button>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Finalize Button Section */}
        {!isFinalized && (
          <div className="space-y-2 pt-2">
            {!isMatchFinished && !isMatchCancelled && (
              <Alert type="warning" className="text-xs">
                A partida ainda não foi finalizada na placar ao vivo. É recomendável encerrar o placar da partida antes de registrar o comparecimento definitivo.
              </Alert>
            )}

            {isMatchCancelled && (
              <Alert type="error" className="text-xs">
                Esta partida foi cancelada e não permite registro de participações.
              </Alert>
            )}

            {!isMatchCancelled && (
              <Button
                variant="primary"
                fullWidth
                disabled={!isAllSelected || isSubmitting}
                onClick={() => setShowFinalizeModal(true)}
                className="bg-[#0B192C] hover:bg-[#1E3A8A] text-sm font-black py-3"
              >
                {!isAllSelected
                  ? `Selecione a presença de todos (${selectedCount}/${totalCount})`
                  : 'Finalizar e Contabilizar Comparecimento'}
              </Button>
            )}
          </div>
        )}
      </main>

      {/* FINALIZATION CONFIRMATION MODAL */}
      {showFinalizeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center gap-2 text-[#0B192C]">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              <h3 className="text-base font-black">Confirmar Registro</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Confirma o encerramento do registro de comparecimento?
            </p>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-[#0B192C]">Resumo da Partida:</p>
              <p className="text-emerald-700 font-semibold">• {livePresent} atletas confirmados como PRESENTES</p>
              <p className="text-rose-700 font-semibold">• {liveAbsent} atletas confirmados como AUSENTES</p>
              <p className="text-[11px] text-slate-500 pt-1">
                Apenas os atletas cadastrados marcados como presentes receberão +1 em <code className="bg-slate-200 px-1 rounded">attendance_count</code>.
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                fullWidth
                disabled={isSubmitting}
                onClick={() => setShowFinalizeModal(false)}
              >
                Cancelar
              </Button>

              <Button
                variant="primary"
                fullWidth
                loading={isSubmitting}
                onClick={handleFinalizeSubmit}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Confirmar e Salvar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* OWNER CORRECTION MODAL */}
      {correctionTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCorrectionSubmit} className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-black text-[#0B192C]">Corrigir Comparecimento</h3>
              </div>
              <button
                type="button"
                onClick={() => setCorrectionTarget(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Ajuste administrativo exclusivo do Proprietário para <strong className="text-[#0B192C]">{correctionTarget.displayName}</strong>.
            </p>

            {correctionError && (
              <Alert type="error" className="text-xs">{correctionError}</Alert>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Nova Situação</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCorrectionNewStatus('present')}
                  className={`py-2 text-xs font-bold rounded-xl border ${
                    correctionNewStatus === 'present'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  Presente (+1)
                </button>

                <button
                  type="button"
                  onClick={() => setCorrectionNewStatus('absent')}
                  className={`py-2 text-xs font-bold rounded-xl border ${
                    correctionNewStatus === 'absent'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  Ausente (-1)
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Motivo da Correção <span className="text-rose-600">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Ex: Erro de digitação na finalização do jogo..."
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B192C]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                fullWidth
                disabled={isCorrecting}
                onClick={() => setCorrectionTarget(null)}
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={isCorrecting}
                className="bg-[#0B192C]"
              >
                Aplicar Correção
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
