import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';
import { useAuth } from '../context/AuthContext';
import { MatchSession, MatchSet, MatchParticipant } from '../types';
import { 
  subscribeToMatchSession, 
  addPointToScore, 
  undoPointFromScore 
} from '../lib/matchService';
import { 
  Trophy, 
  RotateCcw, 
  ArrowLeft, 
  ShieldCheck, 
  Loader2, 
  Wifi, 
  Users, 
  CheckCircle2, 
  Award,
  Sparkles
} from 'lucide-react';

export const LiveScoreboardPage: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [match, setMatch] = useState<MatchSession | null>(null);
  const [sets, setSets] = useState<MatchSet[]>([]);
  const [participants, setParticipants] = useState<MatchParticipant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isAdminOrOwner = profile?.role === 'owner' || profile?.role === 'admin';

  // Realtime subscription
  useEffect(() => {
    if (!matchId) return;
    setLoading(true);

    const unsubscribe = subscribeToMatchSession(matchId, (data) => {
      setMatch(data.match);
      setSets(data.sets);
      setParticipants(data.participants);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [matchId]);

  // Handle Point Addition
  const handleAddPoint = async (teamNum: 1 | 2) => {
    if (!match || !profile || actionLoading || match.status !== 'live') return;

    setActionLoading(true);
    setErrorMsg(null);

    // Generate unique client action ID for idempotency
    const clientActionId = `pt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    try {
      await addPointToScore({
        matchId: match.id,
        teamNumber: teamNum,
        clientActionId,
        requestorUid: profile.uid,
      });
    } catch (err: any) {
      console.error('Error adding point:', err);
      setErrorMsg(err.message || 'Não foi possível registrar o ponto.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Undo Last Point
  const handleUndoPoint = async () => {
    if (!match || !profile || actionLoading) return;

    setActionLoading(true);
    setErrorMsg(null);

    const clientActionId = `undo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    try {
      await undoPointFromScore({
        matchId: match.id,
        clientActionId,
        requestorUid: profile.uid,
      });
    } catch (err: any) {
      console.error('Error undoing point:', err);
      setErrorMsg(err.message || 'Não foi possível desfazer o ponto.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#0B192C] mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Conectando ao placar ao vivo...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-slate-100 pb-24">
        <Header title="Placar da Partida" />
        <main className="max-w-md mx-auto px-4 py-8 space-y-4 text-center">
          <Alert type="error">Partida não encontrada.</Alert>
          <Button variant="outline" onClick={() => navigate('/jogos')} icon={<ArrowLeft className="w-4 h-4" />}>
            Voltar aos Jogos
          </Button>
        </main>
      </div>
    );
  }

  const activeSet = sets.find((s) => s.setNumber === match.currentSetNumber) || sets[sets.length - 1] || {
    teamAScore: 0,
    teamBScore: 0,
    targetScore: 25,
    setNumber: 1,
  };

  const team1 = participants.filter((p) => p.teamNumber === 1);
  const team2 = participants.filter((p) => p.teamNumber === 2);

  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';

  const winnerName = match.winnerTeam === 1 ? match.teamAName : match.winnerTeam === 2 ? match.teamBName : null;

  return (
    <div className="min-h-screen bg-slate-100 text-[#0F172A] pb-28">
      <Header />

      <main className="max-w-md mx-auto px-4 py-5 space-y-5">
        {/* Navigation & Live Badge */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/jogos')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B192C] hover:text-[#1E3A8A] bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <Wifi className="w-3 h-3 animate-pulse text-emerald-600" /> Ao Vivo
            </span>
            {isAdminOrOwner && (
              <Badge variant="admin" size="sm">
                Acesso Organizador
              </Badge>
            )}
          </div>
        </div>

        {errorMsg && <Alert type="error" className="text-xs">{errorMsg}</Alert>}

        {/* Winner Banner if Finished */}
        {isFinished && (
          <Card accentBar accentColor="gold" className="bg-[#0B192C] text-white text-center space-y-3 py-5 shadow-lg">
            <div className="p-3 bg-amber-400/20 text-amber-400 rounded-2xl w-fit mx-auto">
              <Trophy className="w-8 h-8" />
            </div>
            <h2 className="text-base font-black text-white">Partida Encerrada</h2>
            <p className="text-sm font-bold text-amber-300">
              Vencedor: {winnerName || 'Empate'}
            </p>
            <p className="text-xs text-slate-300">
              Placar Final de Sets: {match.teamASetsWon} x {match.teamBSetsWon}
            </p>

            {isAdminOrOwner && (
              <div className="pt-2">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => navigate(`/admin/partidas/${match.id}/comparecimento`)}
                  icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  Registrar Comparecimento Real
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Main Scoreboard Display Card */}
        <Card className="bg-[#0B192C] text-white p-5 space-y-5 shadow-xl border-slate-800">
          {/* Header Info */}
          <div className="text-center border-b border-white/10 pb-3 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              Set {activeSet.setNumber} • Até {activeSet.targetScore} pontos
            </span>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-300">
              <span>Sets Vencidos:</span>
              <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded-md">
                {match.teamASetsWon} x {match.teamBSetsWon}
              </span>
            </div>
          </div>

          {/* Scores Display */}
          <div className="grid grid-cols-2 gap-4 text-center">
            {/* Team 1 Score */}
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2 flex flex-col items-center">
              <p className="text-xs font-black text-amber-300 truncate max-w-[120px]">{match.teamAName}</p>
              <p className="text-5xl font-black text-white tracking-tight py-1">{activeSet.teamAScore}</p>

              {isAdminOrOwner && isLive && (
                <button
                  onClick={() => handleAddPoint(1)}
                  disabled={actionLoading}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-lg rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  +1
                </button>
              )}
            </div>

            {/* Team 2 Score */}
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2 flex flex-col items-center">
              <p className="text-xs font-black text-amber-300 truncate max-w-[120px]">{match.teamBName}</p>
              <p className="text-5xl font-black text-white tracking-tight py-1">{activeSet.teamBScore}</p>

              {isAdminOrOwner && isLive && (
                <button
                  onClick={() => handleAddPoint(2)}
                  disabled={actionLoading}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-lg rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  +1
                </button>
              )}
            </div>
          </div>

          {/* Undo Point Action for Admins */}
          {isAdminOrOwner && (isLive || isFinished) && (
            <div className="pt-2 border-t border-white/10 flex justify-center">
              <button
                onClick={handleUndoPoint}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Desfazer último ponto
              </button>
            </div>
          )}
        </Card>

        {/* Finished Sets History */}
        {sets.length > 0 && (
          <Card className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B192C]">
              Histórico dos Sets ({sets.length})
            </h3>
            <div className="space-y-1.5">
              {sets.map((s) => (
                <div
                  key={s.id}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-[#0B192C]">Set {s.setNumber}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-[#0B192C]">
                      {s.teamAScore} x {s.teamBScore}
                    </span>
                    {s.status === 'completed' && (
                      <span className="text-[10px] text-emerald-800 bg-emerald-100 font-bold px-2 py-0.5 rounded-full">
                        {s.winnerTeam === 1 ? match.teamAName : match.teamBName} venceu
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Team Rosters */}
        <div className="grid grid-cols-2 gap-3">
          {/* Team 1 Roster */}
          <Card accentBar accentColor="navy" className="space-y-2">
            <h3 className="text-xs font-black text-[#0B192C]">{match.teamAName} ({team1.length})</h3>
            <div className="space-y-1 text-xs">
              {team1.map((p) => (
                <div key={p.id} className="p-1.5 bg-slate-50 rounded-lg flex items-center justify-between">
                  <span className="font-semibold text-slate-800 truncate">{p.displayName}</span>
                  {p.isGuest && (
                    <span className="text-[9px] text-purple-700 bg-purple-50 px-1 rounded border border-purple-200">
                      Sem conta
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Team 2 Roster */}
          <Card accentBar accentColor="red" className="space-y-2">
            <h3 className="text-xs font-black text-[#0B192C]">{match.teamBName} ({team2.length})</h3>
            <div className="space-y-1 text-xs">
              {team2.map((p) => (
                <div key={p.id} className="p-1.5 bg-slate-50 rounded-lg flex items-center justify-between">
                  <span className="font-semibold text-slate-800 truncate">{p.displayName}</span>
                  {p.isGuest && (
                    <span className="text-[9px] text-purple-700 bg-purple-50 px-1 rounded border border-purple-200">
                      Sem conta
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};
