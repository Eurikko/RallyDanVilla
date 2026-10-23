import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';
import { Input } from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { 
  Game, 
  MatchSession, 
  MatchParticipant, 
  MatchFormat, 
  GuestPlayer, 
  UserProfile 
} from '../types';
import { 
  getOrCreateMatchSession, 
  getMatchParticipants, 
  addParticipantToMatch, 
  removeParticipantFromMatch, 
  updateParticipantProvisionalLevel, 
  updateParticipantTeam, 
  autoBalanceTeams, 
  updateMatchFormat, 
  updateMatchTeamNames, 
  startMatchSession 
} from '../lib/matchService';
import { 
  getGuestPlayers, 
  createGuestPlayer, 
  checkSimilarGuestNames 
} from '../lib/guestPlayerService';
import { getGameRegistrations } from '../lib/gameService';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { getTechnicalLevelShortLabel, getTechnicalLevelLabel } from '../lib/technicalLevel';
import { 
  ArrowLeft, 
  Users, 
  UserPlus, 
  Sparkles, 
  Check, 
  X, 
  AlertTriangle, 
  Loader2, 
  Award, 
  Shuffle, 
  Play, 
  Search, 
  Info, 
  ChevronRight, 
  ShieldCheck,
  Edit2
} from 'lucide-react';

export const AdminMatchSetupPage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();

  const [game, setGame] = useState<Game | null>(null);
  const [match, setMatch] = useState<MatchSession | null>(null);
  const [participants, setParticipants] = useState<MatchParticipant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Active step (1: Escalação, 2: Níveis, 3: Times, 4: Formato, 5: Revisão)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Confirmed Registrations from game
  const [confirmedProfiles, setConfirmedProfiles] = useState<{ userId: string; username: string; photoUrl?: string }[]>([]);

  // Search Registered Profiles
  const [profileSearchTerm, setProfileSearchTerm] = useState('');
  const [profileSearchResults, setProfileSearchResults] = useState<UserProfile[]>([]);
  const [isSearchingProfiles, setIsSearchingProfiles] = useState(false);

  // Search Guests
  const [guestSearchTerm, setGuestSearchTerm] = useState('');
  const [guestSearchResults, setGuestSearchResults] = useState<GuestPlayer[]>([]);
  const [isSearchingGuests, setIsSearchingGuests] = useState(false);

  // Guest Creation Modal
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestNickname, setGuestNickname] = useState('');
  const [guestLevel, setGuestLevel] = useState<number | null>(null);
  const [similarGuests, setSimilarGuests] = useState<GuestPlayer[]>([]);
  const [isCreatingGuest, setIsCreatingGuest] = useState(false);
  const [guestModalError, setGuestModalError] = useState<string | null>(null);

  // Team names editing
  const [team1Name, setTeam1Name] = useState('Time 1');
  const [team2Name, setTeam2Name] = useState('Time 2');

  // Submitting state
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Access Control Guard
  useEffect(() => {
    if (!authLoading) {
      if (!profile) {
        navigate('/entrar', { replace: true });
        return;
      }
      if (profile.role !== 'owner' && profile.role !== 'admin') {
        navigate('/inicio', { 
          replace: true, 
          state: { errorMsg: 'Você não possui permissão para preparar partidas.' } 
        });
      }
    }
  }, [profile, authLoading, navigate]);

  // Load Match & Game Data
  const loadData = useCallback(async () => {
    if (!gameId || !profile) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Get or create match session
      const { match: mSession, game: g } = await getOrCreateMatchSession(gameId, profile.uid);
      setGame(g);
      setMatch(mSession);
      setTeam1Name(mSession.teamAName || 'Time 1');
      setTeam2Name(mSession.teamBName || 'Time 2');

      // 2. Fetch participants
      const parts = await getMatchParticipants(mSession.id);
      setParticipants(parts);

      // 3. Fetch confirmed registrations for context
      const regs = await getGameRegistrations(gameId);
      const confirmedList = regs
        .filter((r) => r.status === 'confirmed')
        .map((r) => ({ userId: r.userId, username: r.username, photoUrl: r.photoUrl || undefined }));
      setConfirmedProfiles(confirmedList);

      // Load initial guest list
      const guests = await getGuestPlayers({ requestorUid: profile.uid, maxResults: 15 });
      setGuestSearchResults(guests);
    } catch (err: any) {
      console.error('[AdminMatchSetupPage] Load error:', err);
      setErrorMsg(err.message || 'Não foi possível carregar as informações da partida.');
    } finally {
      setLoading(false);
    }
  }, [gameId, profile]);

  useEffect(() => {
    if (profile && (profile.role === 'owner' || profile.role === 'admin')) {
      loadData();
    }
  }, [profile, loadData]);

  // Search Registered Profiles
  useEffect(() => {
    const timer = setTimeout(async () => {
      const term = profileSearchTerm.trim().toLowerCase();
      if (term.length < 2) {
        setProfileSearchResults([]);
        setIsSearchingProfiles(false);
        return;
      }

      setIsSearchingProfiles(true);
      try {
        const q = query(
          collection(db, 'profiles'),
          where('status', '==', 'active'),
          limit(20)
        );
        const snap = await getDocs(q);
        const results: UserProfile[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data() as UserProfile;
          const norm = (data.usernameNormalized || data.username || '').toLowerCase();
          if (norm.includes(term)) {
            results.push({
              uid: docSnap.id,
              username: data.username,
              usernameNormalized: norm,
              role: data.role || 'player',
              status: data.status || 'active',
              technicalLevel: data.technicalLevel || null,
              attendanceCount: data.attendanceCount || 0,
              photoUrl: data.photoUrl || null,
            });
          }
        });
        setProfileSearchResults(results.slice(0, 10));
      } catch (err) {
        console.error('Error searching profiles:', err);
      } finally {
        setIsSearchingProfiles(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [profileSearchTerm]);

  // Search Guests
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!profile) return;
      const term = guestSearchTerm.trim();
      setIsSearchingGuests(true);
      try {
        const guests = await getGuestPlayers({
          requestorUid: profile.uid,
          searchTerm: term,
          maxResults: 15,
        });
        setGuestSearchResults(guests);
      } catch (err) {
        console.error('Error searching guests:', err);
      } finally {
        setIsSearchingGuests(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [guestSearchTerm, profile]);

  // Check guest similarity in modal
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (guestName.trim().length >= 2) {
        const matches = await checkSimilarGuestNames(guestName);
        setSimilarGuests(matches);
      } else {
        setSimilarGuests([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [guestName]);

  // Add Registered Profile to Match
  const handleAddProfileToMatch = async (user: { uid: string; username: string; technicalLevel?: any }, isConfirmed = false) => {
    if (!match || !game || !profile) return;
    setIsActionLoading(true);
    setErrorMsg(null);

    try {
      const newPart = await addParticipantToMatch({
        matchId: match.id,
        gameMaxPlayers: game.maxPlayers,
        profileId: user.uid,
        displayName: user.username,
        isGuest: false,
        technicalLevel: user.technicalLevel,
        isConfirmedContext: isConfirmed,
        requestorUid: profile.uid,
      });

      setParticipants((prev) => [...prev, newPart]);
      setSuccessMsg(`${user.username} adicionado à escalação.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao adicionar jogador.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Add Guest Player to Match
  const handleAddGuestToMatch = async (guest: GuestPlayer) => {
    if (!match || !game || !profile) return;
    setIsActionLoading(true);
    setErrorMsg(null);

    try {
      const displayName = guest.nickname ? `${guest.displayName} (${guest.nickname})` : guest.displayName;
      const newPart = await addParticipantToMatch({
        matchId: match.id,
        gameMaxPlayers: game.maxPlayers,
        guestPlayerId: guest.id,
        displayName,
        isGuest: true,
        technicalLevel: guest.technicalLevel,
        isConfirmedContext: false,
        requestorUid: profile.uid,
      });

      setParticipants((prev) => [...prev, newPart]);
      setSuccessMsg(`${guest.displayName} adicionado à escalação.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao adicionar convidado.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Remove Participant from Match
  const handleRemoveParticipant = async (participantId: string, name: string) => {
    if (!profile) return;
    setIsActionLoading(true);
    setErrorMsg(null);

    try {
      await removeParticipantFromMatch(participantId, profile.uid);
      setParticipants((prev) => prev.filter((p) => p.id !== participantId));
      setSuccessMsg(`${name} removido da escalação.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao remover participante.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Create Guest Player
  const handleCreateGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !match || !game) return;

    setIsCreatingGuest(true);
    setGuestModalError(null);

    try {
      const created = await createGuestPlayer({
        requestorUid: profile.uid,
        displayName: guestName,
        nickname: guestNickname,
        technicalLevel: guestLevel,
      });

      // Automatically add newly created guest to match
      await handleAddGuestToMatch(created);

      setShowGuestModal(false);
      setGuestName('');
      setGuestNickname('');
      setGuestLevel(null);
      setSimilarGuests([]);
    } catch (err: any) {
      setGuestModalError(err.message || 'Não foi possível criar o jogador convidado.');
    } finally {
      setIsCreatingGuest(false);
    }
  };

  // Update Provisional Level
  const handleSetProvisionalLevel = async (participantId: string, level: number) => {
    if (!profile) return;
    setIsActionLoading(true);
    setErrorMsg(null);

    try {
      await updateParticipantProvisionalLevel({
        participantId,
        newLevel: level,
        requestorUid: profile.uid,
      });

      setParticipants((prev) =>
        prev.map((p) =>
          p.id === participantId
            ? { ...p, technicalLevelSnapshot: level, isProvisionalLevel: true }
            : p
        )
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao atualizar nível provisório.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Auto Balance Teams
  const handleAutoBalance = async () => {
    if (!match || !profile) return;
    setIsActionLoading(true);
    setErrorMsg(null);

    try {
      await autoBalanceTeams(match.id, profile.uid);
      const updated = await getMatchParticipants(match.id);
      setParticipants(updated);
      setSuccessMsg('Times equilibrados automaticamente!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Não foi possível equilibrar os times.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Assign Team manually
  const handleAssignTeam = async (participantId: string, teamNum: 1 | 2 | null) => {
    if (!profile) return;
    setIsActionLoading(true);

    try {
      await updateParticipantTeam({
        participantId,
        teamNumber: teamNum,
        requestorUid: profile.uid,
      });

      setParticipants((prev) =>
        prev.map((p) => (p.id === participantId ? { ...p, teamNumber: teamNum } : p))
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao atribuir time.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Update Format
  const handleSelectFormat = async (fmt: MatchFormat) => {
    if (!match || !profile) return;
    setIsActionLoading(true);
    setErrorMsg(null);

    try {
      await updateMatchFormat({
        matchId: match.id,
        format: fmt,
        requestorUid: profile.uid,
      });
      setMatch((prev) => (prev ? { ...prev, format: fmt } : null));
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao atualizar formato.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Save Team Names
  const handleSaveTeamNames = async () => {
    if (!match || !profile) return;
    try {
      await updateMatchTeamNames({
        matchId: match.id,
        teamAName: team1Name,
        teamBName: team2Name,
        requestorUid: profile.uid,
      });
      setMatch((prev) => (prev ? { ...prev, teamAName: team1Name, teamBName: team2Name } : null));
    } catch (err: any) {
      console.error('Error updating team names:', err);
    }
  };

  // Start Match Session
  const handleStartMatch = async () => {
    if (!match || !profile) return;
    setIsActionLoading(true);
    setErrorMsg(null);

    try {
      await handleSaveTeamNames();
      await startMatchSession(match.id, profile.uid);
      navigate(`/partidas/${match.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Não foi possível iniciar a partida.');
      setIsActionLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#0B192C] mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Preparando sessão da partida...</p>
        </div>
      </div>
    );
  }

  if (errorMsg && !match) {
    return (
      <div className="min-h-screen bg-slate-100 pb-24">
        <Header title="Preparar Partida" />
        <main className="max-w-md mx-auto px-4 py-8 space-y-4">
          <Alert type="error">{errorMsg}</Alert>
          <Button variant="outline" onClick={() => navigate('/admin/jogos')} icon={<ArrowLeft className="w-4 h-4" />}>
            Voltar aos jogos
          </Button>
        </main>
      </div>
    );
  }

  const team1 = participants.filter((p) => p.teamNumber === 1);
  const team2 = participants.filter((p) => p.teamNumber === 2);
  const unassigned = participants.filter((p) => p.teamNumber !== 1 && p.teamNumber !== 2);

  const team1Sum = team1.reduce((acc, p) => acc + (p.technicalLevelSnapshot || 3), 0);
  const team2Sum = team2.reduce((acc, p) => acc + (p.technicalLevelSnapshot || 3), 0);

  const team1Avg = team1.length > 0 ? (team1Sum / team1.length).toFixed(1) : '0.0';
  const team2Avg = team2.length > 0 ? (team2Sum / team2.length).toFixed(1) : '0.0';

  const diffAvg = Math.abs(parseFloat(team1Avg) - parseFloat(team2Avg)).toFixed(1);

  return (
    <div className="min-h-screen bg-slate-100 text-[#0F172A] pb-28">
      <Header />

      <main className="max-w-md mx-auto px-4 py-5 space-y-5">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/admin/jogos')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B192C] hover:text-[#1E3A8A] bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar aos Jogos
          </button>
          <Badge variant="admin" size="sm">
            Preparação da Partida
          </Badge>
        </div>

        {/* Game Context Header Card */}
        {game && (
          <Card accentBar accentColor="navy" className="bg-[#0B192C] text-white">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                  Jogo Agendado
                </span>
                <h1 className="text-base font-black text-white">{game.title}</h1>
                <p className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
                  <span>{game.location}</span>
                  <span>•</span>
                  <span>Capacidade: {game.maxPlayers} atletas</span>
                </p>
              </div>
              <Badge variant="info" size="sm" className="bg-white/10 text-white border-white/20">
                {participants.length}/{game.maxPlayers} na escalação
              </Badge>
            </div>
          </Card>
        )}

        {/* Success / Error Alerts */}
        {errorMsg && (
          <Alert type="error" className="text-xs">
            {errorMsg}
          </Alert>
        )}
        {successMsg && (
          <Alert type="success" className="text-xs">
            {successMsg}
          </Alert>
        )}

        {/* Step Wizard Navigation Bar */}
        <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
          {[
            { num: 1, label: 'Escalação' },
            { num: 2, label: 'Níveis' },
            { num: 3, label: 'Times' },
            { num: 4, label: 'Formato' },
            { num: 5, label: 'Revisão' },
          ].map((step) => {
            const isActive = currentStep === step.num;
            const isCompleted = currentStep > step.num;

            return (
              <button
                key={step.num}
                onClick={() => setCurrentStep(step.num)}
                className={`flex-1 py-1.5 px-1 flex flex-col items-center gap-0.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#0B192C] text-white font-bold'
                    : isCompleted
                    ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <span className="text-[10px] uppercase tracking-tight">{step.label}</span>
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                    isActive
                      ? 'bg-amber-400 text-[#0B192C]'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isCompleted ? '✓' : step.num}
                </span>
              </button>
            );
          })}
        </div>

        {/* STEP 1: ESCALAÇÃO (ROSTER) */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#0B192C]">
                  1. Escalação da Partida ({participants.length}/{game?.maxPlayers})
                </h2>
                <p className="text-[11px] text-slate-500">
                  Adicione cadastrados e convidados sem conta para a partida
                </p>
              </div>
            </div>

            {/* Current Lineup Card */}
            <Card className="space-y-3">
              <h3 className="text-xs font-black text-[#0B192C] flex items-center justify-between">
                <span>Atletas Escalados ({participants.length})</span>
                {game && participants.length >= game.maxPlayers && (
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    Limite atingido ({game.maxPlayers})
                  </span>
                )}
              </h3>

              {participants.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Nenhum atleta na escalação. Adicione confirmados ou convidados abaixo.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {participants.map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-[#0B192C] truncate">{p.displayName}</span>
                        {p.isGuest ? (
                          <span className="text-[10px] bg-purple-100 text-purple-800 font-semibold px-2 py-0.5 rounded-full border border-purple-200">
                            Sem conta
                          </span>
                        ) : p.isConfirmed ? (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                            Confirmado
                          </span>
                        ) : (
                          <span className="text-[10px] bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
                            Não confirmado
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleRemoveParticipant(p.id, p.displayName)}
                        disabled={isActionLoading}
                        className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                        title="Remover da escalação"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Confirmed Game Registrations Section */}
            <Card className="space-y-3">
              <h3 className="text-xs font-black text-[#0B192C]">
                Confirmados no Agendamento ({confirmedProfiles.length})
              </h3>

              {confirmedProfiles.length === 0 ? (
                <p className="text-xs text-slate-500">Nenhum atleta confirmou presença no jogo ainda.</p>
              ) : (
                <div className="space-y-1.5">
                  {confirmedProfiles.map((conf) => {
                    const isAlreadyIn = participants.some((p) => p.profileId === conf.userId);

                    return (
                      <div
                        key={conf.userId}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                      >
                        <span className="font-bold text-[#0B192C]">{conf.username}</span>
                        {isAlreadyIn ? (
                          <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Na escalação
                          </span>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isActionLoading || (game ? participants.length >= game.maxPlayers : false)}
                            onClick={() => handleAddProfileToMatch({ uid: conf.userId, username: conf.username }, true)}
                            className="text-xs py-1"
                          >
                            + Incluir
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Search & Add Other Registered Users */}
            <Card className="space-y-3">
              <h3 className="text-xs font-black text-[#0B192C]">Buscar Outros Atletas Cadastrados</h3>
              <Input
                placeholder="Digitar nome de usuário..."
                value={profileSearchTerm}
                onChange={(e) => setProfileSearchTerm(e.target.value)}
                icon={<Search className="w-4 h-4 text-slate-400" />}
              />

              {isSearchingProfiles && <p className="text-xs text-slate-500">Buscando atletas...</p>}

              <div className="space-y-1.5">
                {profileSearchResults.map((user) => {
                  const isAlreadyIn = participants.some((p) => p.profileId === user.uid);
                  return (
                    <div
                      key={user.uid}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-[#0B192C]">{user.username}</span>
                        <span className="text-[10px] text-slate-500 ml-2">
                          {getTechnicalLevelShortLabel(user.technicalLevel)}
                        </span>
                      </div>
                      {isAlreadyIn ? (
                        <span className="text-[10px] font-bold text-emerald-700">Na escalação</span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isActionLoading || (game ? participants.length >= game.maxPlayers : false)}
                          onClick={() => handleAddProfileToMatch({ uid: user.uid, username: user.username, technicalLevel: user.technicalLevel }, false)}
                          className="text-xs py-1"
                        >
                          + Incluir
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Guest Players Section */}
            <Card className="space-y-3 border-purple-200 bg-purple-50/30">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-purple-900">Jogadores Convidados (Sem Conta)</h3>
                  <p className="text-[10px] text-purple-700">Pessoas sem acesso ao app ou sem login</p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowGuestModal(true)}
                  icon={<UserPlus className="w-3.5 h-3.5" />}
                  className="bg-purple-900 hover:bg-purple-950 text-xs py-1"
                >
                  + Novo Convidado
                </Button>
              </div>

              <Input
                placeholder="Pesquisar convidado existente..."
                value={guestSearchTerm}
                onChange={(e) => setGuestSearchTerm(e.target.value)}
                icon={<Search className="w-4 h-4 text-purple-400" />}
              />

              <div className="space-y-1.5">
                {guestSearchResults.map((guest) => {
                  const isAlreadyIn = participants.some((p) => p.guestPlayerId === guest.id);
                  const nameDisplay = guest.nickname ? `${guest.displayName} (${guest.nickname})` : guest.displayName;

                  return (
                    <div
                      key={guest.id}
                      className="p-2.5 bg-white border border-purple-100 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-purple-950">{nameDisplay}</span>
                        <span className="text-[10px] text-purple-600 ml-2">
                          {getTechnicalLevelShortLabel(guest.technicalLevel)}
                        </span>
                      </div>
                      {isAlreadyIn ? (
                        <span className="text-[10px] font-bold text-purple-800">Na escalação</span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isActionLoading || (game ? participants.length >= game.maxPlayers : false)}
                          onClick={() => handleAddGuestToMatch(guest)}
                          className="text-xs py-1 border-purple-300 text-purple-900 hover:bg-purple-100"
                        >
                          + Incluir
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Next Step Button */}
            <Button
              variant="primary"
              fullWidth
              disabled={participants.length < 2}
              onClick={() => setCurrentStep(2)}
              className="bg-[#0B192C]"
            >
              Avançar para Níveis ({participants.length} atletas)
            </Button>
          </div>
        )}

        {/* STEP 2: NÍVEIS TÉCNICOS */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#0B192C]">
                2. Níveis Técnicos na Partida
              </h2>
              <p className="text-[11px] text-slate-500">
                Atribua um nível provisório de 1 a 3 para quem ainda não possui classificação
              </p>
            </div>

            <Card className="bg-amber-50/70 border-amber-200 text-amber-900 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Info className="w-4 h-4 text-amber-700" />
                <span>Nível Provisório da Partida</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Níveis provisórios são aplicados apenas nesta sessão e não alteram a classificação oficial do perfil do jogador.
              </p>
            </Card>

            <div className="space-y-2">
              {participants.map((p) => {
                const currentLevel = p.technicalLevelSnapshot;

                return (
                  <Card key={p.id} className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-[#0B192C]">{p.displayName}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {p.isGuest && (
                            <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                              Convidado
                            </span>
                          )}
                          {p.isProvisionalLevel ? (
                            <span className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                              Provisório ({currentLevel})
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              Oficial ({currentLevel})
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="text-xs font-black text-[#0B192C]">
                        {getTechnicalLevelShortLabel(currentLevel)}
                      </span>
                    </div>

                    {/* Level Selector Buttons (1 to 3) */}
                    <div className="flex gap-1 pt-1">
                      {[1, 2, 3].map((lvl) => {
                        const isSelected = currentLevel === lvl;
                        return (
                          <button
                            key={lvl}
                            onClick={() => handleSetProvisionalLevel(p.id, lvl)}
                            disabled={isActionLoading}
                            className={`flex-1 py-1 text-xs font-bold rounded-lg border transition-all ${
                              isSelected
                                ? 'bg-[#0B192C] text-amber-400 border-[#0B192C]'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {lvl}
                          </button>
                        );
                      })}
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" fullWidth onClick={() => setCurrentStep(1)}>
                Voltar
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={() => setCurrentStep(3)}
                className="bg-[#0B192C]"
              >
                Avançar para Formação
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: TIMES & EQUILÍBRIO */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#0B192C]">
                  3. Formação e Equilíbrio dos Times
                </h2>
                <p className="text-[11px] text-slate-500">
                  Gere times calibrados pelo nível técnico ou ajuste manualmente
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleAutoBalance}
                loading={isActionLoading}
                icon={<Shuffle className="w-3.5 h-3.5" />}
                className="bg-[#1E3A8A] hover:bg-[#0B192C] text-xs py-1"
              >
                Gerar Times
              </Button>
            </div>

            {/* Balance Metrics Card */}
            <Card accentBar accentColor="gold" className="bg-[#0B192C] text-white space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-bold text-amber-400">Indicadores de Equilíbrio</span>
                <span className="text-[10px] text-slate-300">
                  {diffAvg === '0.0' ? 'Equilíbrio exato' : `Diferença média: ${diffAvg}`}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-white/10 p-2.5 rounded-xl">
                  <p className="text-[10px] text-slate-300 uppercase font-bold">{team1Name}</p>
                  <p className="text-base font-black text-white">{team1.length} atletas</p>
                  <p className="text-[11px] text-amber-300">Soma: {team1Sum} • Média: {team1Avg}</p>
                </div>

                <div className="bg-white/10 p-2.5 rounded-xl">
                  <p className="text-[10px] text-slate-300 uppercase font-bold">{team2Name}</p>
                  <p className="text-base font-black text-white">{team2.length} atletas</p>
                  <p className="text-[11px] text-amber-300">Soma: {team2Sum} • Média: {team2Avg}</p>
                </div>
              </div>
            </Card>

            {/* Editable Team Names */}
            <Card className="space-y-2">
              <h3 className="text-xs font-bold text-[#0B192C]">Nomes dos Times</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Time 1</label>
                  <Input value={team1Name} onChange={(e) => setTeam1Name(e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Time 2</label>
                  <Input value={team2Name} onChange={(e) => setTeam2Name(e.target.value)} />
                </div>
              </div>
            </Card>

            {/* Team 1 Card */}
            <Card accentBar accentColor="navy" className="space-y-2">
              <h3 className="text-xs font-black text-[#0B192C] flex items-center justify-between">
                <span>{team1Name} ({team1.length})</span>
                <span className="text-xs font-bold text-slate-500">Média {team1Avg}</span>
              </h3>

              {team1.length === 0 ? (
                <p className="text-xs text-slate-400 py-2 text-center">Nenhum jogador no Time 1</p>
              ) : (
                <div className="space-y-1">
                  {team1.map((p) => (
                    <div key={p.id} className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                      <span className="font-bold text-[#0B192C]">{p.displayName}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500 mr-2">Nível {p.technicalLevelSnapshot}</span>
                        <button
                          onClick={() => handleAssignTeam(p.id, 2)}
                          className="text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-bold hover:bg-slate-300"
                        >
                          Mover P/ Time 2
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Team 2 Card */}
            <Card accentBar accentColor="red" className="space-y-2">
              <h3 className="text-xs font-black text-[#0B192C] flex items-center justify-between">
                <span>{team2Name} ({team2.length})</span>
                <span className="text-xs font-bold text-slate-500">Média {team2Avg}</span>
              </h3>

              {team2.length === 0 ? (
                <p className="text-xs text-slate-400 py-2 text-center">Nenhum jogador no Time 2</p>
              ) : (
                <div className="space-y-1">
                  {team2.map((p) => (
                    <div key={p.id} className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                      <span className="font-bold text-[#0B192C]">{p.displayName}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500 mr-2">Nível {p.technicalLevelSnapshot}</span>
                        <button
                          onClick={() => handleAssignTeam(p.id, 1)}
                          className="text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-bold hover:bg-slate-300"
                        >
                          Mover P/ Time 1
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Unassigned Players Card */}
            {unassigned.length > 0 && (
              <Card className="space-y-2 bg-amber-50/50 border-amber-200">
                <h3 className="text-xs font-bold text-amber-900">Aguardando Distribuição ({unassigned.length})</h3>
                <div className="space-y-1">
                  {unassigned.map((p) => (
                    <div key={p.id} className="p-2 bg-white rounded-lg border border-amber-200 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{p.displayName}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleAssignTeam(p.id, 1)}
                          className="text-[10px] bg-[#0B192C] text-white px-2 py-0.5 rounded font-bold"
                        >
                          + {team1Name}
                        </button>
                        <button
                          onClick={() => handleAssignTeam(p.id, 2)}
                          className="text-[10px] bg-[#E63946] text-white px-2 py-0.5 rounded font-bold"
                        >
                          + {team2Name}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <div className="flex gap-2">
              <Button variant="outline" fullWidth onClick={() => setCurrentStep(2)}>
                Voltar
              </Button>
              <Button
                variant="primary"
                fullWidth
                disabled={team1.length === 0 || team2.length === 0}
                onClick={() => setCurrentStep(4)}
                className="bg-[#0B192C]"
              >
                Avançar para Formato
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: FORMATO DA PARTIDA */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#0B192C]">
                4. Formato da Partida
              </h2>
              <p className="text-[11px] text-slate-500">
                Escolha a quantidade de sets disputados na partida
              </p>
            </div>

            <div className="space-y-2">
              {[
                {
                  id: 'best_of_3' as MatchFormat,
                  title: 'Melhor de 3 Sets (Padrão)',
                  desc: 'Vence quem ganhar 2 sets. Sets 1 e 2 até 25 pontos; 3º set (tiebreak) até 15 pontos.',
                },
                {
                  id: 'single_set' as MatchFormat,
                  title: 'Set Único',
                  desc: 'Apenas 1 set até 25 pontos. Exige diferença mínima de 2 pontos.',
                },
                {
                  id: 'best_of_5' as MatchFormat,
                  title: 'Melhor de 5 Sets',
                  desc: 'Vence quem ganhar 3 sets. Sets 1 a 4 até 25 pontos; 5º set (tiebreak) até 15 pontos.',
                },
              ].map((fmt) => {
                const isSelected = match?.format === fmt.id;

                return (
                  <Card
                    key={fmt.id}
                    onClick={() => handleSelectFormat(fmt.id)}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? 'border-2 border-[#0B192C] bg-blue-50/50 shadow-xs'
                        : 'hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xs font-black text-[#0B192C]">{fmt.title}</h3>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{fmt.desc}</p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold ${
                          isSelected ? 'bg-[#0B192C] text-white border-[#0B192C]' : 'border-slate-300'
                        }`}
                      >
                        {isSelected ? '✓' : ''}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" fullWidth onClick={() => setCurrentStep(3)}>
                Voltar
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={() => setCurrentStep(5)}
                className="bg-[#0B192C]"
              >
                Avançar para Revisão
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: REVISÃO & INÍCIO */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#0B192C]">
                5. Revisão Final e Início
              </h2>
              <p className="text-[11px] text-slate-500">
                Confirme as informações antes de iniciar o placar ao vivo
              </p>
            </div>

            {/* Summary Card */}
            <Card accentBar accentColor="navy" className="space-y-3">
              <div className="border-b border-slate-100 pb-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Formato</span>
                <h3 className="text-xs font-black text-[#0B192C]">
                  {match?.format === 'single_set'
                    ? 'Set Único (25 pts)'
                    : match?.format === 'best_of_5'
                    ? 'Melhor de 5 Sets'
                    : 'Melhor de 3 Sets (Padrão)'}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="font-bold text-[#0B192C] block">{team1Name}</span>
                  <span className="text-[11px] text-slate-500">{team1.length} atletas (Média {team1Avg})</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="font-bold text-[#0B192C] block">{team2Name}</span>
                  <span className="text-[11px] text-slate-500">{team2.length} atletas (Média {team2Avg})</span>
                </div>
              </div>

              {(team1.length < 6 || team2.length < 6) && (
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Esta formação possui menos de seis jogadores em um dos times.</span>
                </div>
              )}
            </Card>

            <Button
              variant="primary"
              fullWidth
              loading={isActionLoading}
              onClick={handleStartMatch}
              icon={<Play className="w-4 h-4 fill-white" />}
              className="bg-emerald-700 hover:bg-emerald-800 text-sm py-3"
            >
              Iniciar Partida e Abrir Placar
            </Button>
          </div>
        )}
      </main>

      {/* CREATE GUEST PLAYER MODAL */}
      {showGuestModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-800">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-purple-950">Novo Convidado (Sem Conta)</h3>
                  <p className="text-[11px] text-purple-700">Adicionar atleta sem login</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuestModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {guestModalError && <Alert type="error" className="text-xs">{guestModalError}</Alert>}

            {similarGuests.length > 0 && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Convidado semelhante encontrado</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Já existe um jogador convidado com nome semelhante ({similarGuests[0].displayName}).
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={() => {
                    handleAddGuestToMatch(similarGuests[0]);
                    setShowGuestModal(false);
                  }}
                  className="text-xs border-amber-300 text-amber-900 hover:bg-amber-100"
                >
                  Usar {similarGuests[0].displayName} existente
                </Button>
              </div>
            )}

            <form onSubmit={handleCreateGuestSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nome Completo / Exibição *</label>
                <Input
                  placeholder="Ex: Carlos Silva"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Apelido ou Complemento (Opcional)</label>
                <Input
                  placeholder="Ex: Carlinhos / Vila do Sol"
                  value={guestNickname}
                  onChange={(e) => setGuestNickname(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Nível Técnico Inicial (Opcional)</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      type="button"
                      key={lvl}
                      onClick={() => setGuestLevel(guestLevel === lvl ? null : lvl)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg border ${
                        guestLevel === lvl
                          ? 'bg-purple-900 text-white border-purple-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <Button variant="outline" fullWidth onClick={() => setShowGuestModal(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  fullWidth
                  loading={isCreatingGuest}
                  className="bg-purple-900 hover:bg-purple-950"
                >
                  Criar e Incluir
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
