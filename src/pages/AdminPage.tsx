import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Avatar } from '../components/Avatar';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';
import { Input } from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { UserProfile, UserRole, Game } from '../types';
import { 
  getAllUserProfiles, 
  adminAddPlayerToGame, 
  getUpcomingGames, 
  formatGameDateTime 
} from '../lib/gameService';
import { 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  collection, 
  where, 
  limit, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  ShieldCheck, 
  ShieldAlert, 
  ArrowLeft, 
  Search, 
  UserCheck, 
  UserX, 
  Calendar, 
  Award, 
  Sparkles, 
  Clock, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  ChevronRight,
  Users,
  UserPlus,
  Filter,
  MapPin,
  X,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();

  // Search state for Owner view (Admin promotion)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Modal / Role Change Confirmation state
  const [targetUser, setTargetUser] = useState<UserProfile | null>(null);
  const [actionType, setActionType] = useState<'promote' | 'demote' | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // OBJECTIVE 4: Registered Players Directory state
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [profilesError, setProfilesError] = useState<string | null>(null);
  const [directorySearch, setDirectorySearch] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'owner' | 'admin' | 'player'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended' | 'inactive'>('all');
  const [filterLevel, setFilterLevel] = useState<'all' | '1' | '2' | '3' | 'nao_classificado'>('all');

  // OBJECTIVE 5: Add Player to Game state
  const [addToGameUser, setAddToGameUser] = useState<UserProfile | null>(null);
  const [upcomingGames, setUpcomingGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [loadingGames, setLoadingGames] = useState(false);
  const [isAddingToGame, setIsAddingToGame] = useState(false);
  const [addGameError, setAddGameError] = useState<string | null>(null);
  const [addGameSuccess, setAddGameSuccess] = useState<string | null>(null);

  // Load all user profiles for Directory
  const loadDirectoryData = useCallback(async () => {
    if (!profile || (profile.role !== 'owner' && profile.role !== 'admin')) return;
    setLoadingProfiles(true);
    setProfilesError(null);
    try {
      const data = await getAllUserProfiles(profile);
      setAllProfiles(data);
    } catch (err: any) {
      console.error('[AdminPage] Error loading profiles directory:', err);
      setProfilesError('Não foi possível carregar a lista de jogadores cadastrados.');
    } finally {
      setLoadingProfiles(false);
    }
  }, [profile]);

  useEffect(() => {
    if (profile && (profile.role === 'owner' || profile.role === 'admin')) {
      loadDirectoryData();
    }
  }, [profile, loadDirectoryData]);

  // Open "Add Player to Game" Modal
  const handleOpenAddToGame = async (user: UserProfile) => {
    setAddToGameUser(user);
    setAddGameError(null);
    setAddGameSuccess(null);
    setSelectedGameId('');
    setLoadingGames(true);

    try {
      const games = await getUpcomingGames();
      // Filter active scheduled games
      const activeGames = games.filter(g => g.status === 'scheduled' || (g.status as string) === 'agendado');
      setUpcomingGames(activeGames);
      if (activeGames.length > 0) {
        setSelectedGameId(activeGames[0].id);
      }
    } catch (err) {
      console.error('[AdminPage] Error loading upcoming games:', err);
      setAddGameError('Não foi possível carregar as partidas agendadas.');
    } finally {
      setLoadingGames(false);
    }
  };

  // Submit "Add Player to Game"
  const handleConfirmAddToGame = async () => {
    if (!addToGameUser || !selectedGameId || !profile) return;

    setIsAddingToGame(true);
    setAddGameError(null);
    setAddGameSuccess(null);

    try {
      const res = await adminAddPlayerToGame(selectedGameId, addToGameUser.uid, profile);
      setAddGameSuccess(res.message);
      setTimeout(() => {
        setAddToGameUser(null);
        setAddGameSuccess(null);
      }, 2500);
      loadDirectoryData();
    } catch (err: any) {
      console.error('[AdminPage] Add player to game error:', err);
      setAddGameError(err.message || 'Não foi possível adicionar o jogador à partida.');
    } finally {
      setIsAddingToGame(false);
    }
  };

  // Role Access Enforcement
  useEffect(() => {
    if (!authLoading) {
      if (!profile) {
        navigate('/entrar', { replace: true });
        return;
      }

      if (profile.role !== 'owner' && profile.role !== 'admin') {
        navigate('/inicio', { 
          replace: true, 
          state: { errorMsg: 'Você não possui permissão para acessar esta área.' } 
        });
      }
    }
  }, [profile, authLoading, navigate]);

  // Debounced User Search for Owner
  const executeSearch = useCallback(async (term: string) => {
    const trimmed = term.trim().toLowerCase();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const profilesRef = collection(db, 'profiles');
      // Fetch active users matching normalized prefix or listing
      const q = query(
        profilesRef,
        where('status', '==', 'active'),
        limit(20)
      );
      const snap = await getDocs(q);

      const items: UserProfile[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data() as UserProfile;
        const norm = (data.usernameNormalized || data.username || '').toLowerCase();
        if (norm.includes(trimmed)) {
          items.push({
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

      setSearchResults(items.slice(0, 10));
    } catch (err) {
      console.error('[AdminPage] Search error:', err);
      setSearchError('Não foi possível localizar usuários no momento.');
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        executeSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, executeSearch]);

  // Open Confirmation Modal
  const handleOpenConfirm = (user: UserProfile, type: 'promote' | 'demote') => {
    if (user.role === 'owner') return; // Cannot modify owner
    setTargetUser(user);
    setActionType(type);
    setUpdateError(null);
  };

  const handleCloseModal = () => {
    setTargetUser(null);
    setActionType(null);
    setUpdateError(null);
  };

  // Perform Role Update in Firestore
  const handleConfirmRoleChange = async () => {
    if (!targetUser || !actionType || !profile || profile.role !== 'owner') {
      return;
    }

    setIsUpdating(true);
    setUpdateError(null);

    const newRole: UserRole = actionType === 'promote' ? 'admin' : 'player';

    try {
      // Direct Firestore update guarded by Owner role check
      const userDocRef = doc(db, 'profiles', targetUser.uid);
      await setDoc(userDocRef, { 
        role: newRole, 
        updatedAt: serverTimestamp() 
      }, { merge: true });

      // Update local search results state
      setSearchResults((prev) =>
        prev.map((item) =>
          item.uid === targetUser.uid ? { ...item, role: newRole } : item
        )
      );

      const actionText = actionType === 'promote' 
        ? `${targetUser.username} agora é um administrador!`
        : `Função de administrador removida de ${targetUser.username}.`;

      setSuccessToast(actionText);
      setTimeout(() => setSuccessToast(null), 4000);

      handleCloseModal();
    } catch (err: any) {
      console.error('[AdminPage] Role update error:', err);
      setUpdateError('Não foi possível atualizar o administrador. Tente novamente.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (authLoading || !profile || (profile.role !== 'owner' && profile.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-[#0B192C]" />
          <p className="text-xs font-semibold">Verificando permissões de acesso...</p>
        </div>
      </div>
    );
  }

  const isOwner = profile.role === 'owner';

  return (
    <div className="min-h-screen bg-slate-100 text-[#0F172A] pb-24">
      <Header />

      <main className="max-w-md mx-auto px-4 py-5 space-y-5">
        {/* Navigation Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/inicio')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B192C] hover:text-[#1E3A8A] bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao início
          </button>

          <Badge variant={isOwner ? 'owner' : 'admin'} size="sm">
            {isOwner ? 'Proprietário' : 'Administrador'}
          </Badge>
        </div>

        {/* Title Banner */}
        <Card accentBar accentColor="navy" className="bg-[#0B192C] text-white">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white/10 text-amber-400">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-base font-black text-white">Central Administrativa</h1>
              <p className="text-xs text-slate-300">
                {isOwner 
                  ? 'Gestão da comunidade e controle de administradores' 
                  : 'Painel de controle e monitoramento do grupo'}
              </p>
            </div>
          </div>
        </Card>

        {/* Notification Toasts */}
        {successToast && (
          <Alert type="success" className="animate-fadeIn">
            {successToast}
          </Alert>
        )}

        {/* Owner View: Admin Management Section */}
        {isOwner ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#0B192C] flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-[#1E3A8A]" />
                Gerenciamento de Administradores
              </h2>
            </div>

            <Card className="space-y-4">
              <p className="text-xs text-slate-600">
                Pesquise jogadores ativos para promover a administrador ou remover permissões.
              </p>

              {/* User Search Input */}
              <div className="relative">
                <Input
                  placeholder="Pesquisar jogador por nome de usuário..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<Search className="w-4 h-4 text-slate-400" />}
                />
                {isSearching && (
                  <div className="absolute right-3 top-2.5">
                    <Loader2 className="w-4 h-4 animate-spin text-[#1E3A8A]" />
                  </div>
                )}
              </div>

              {searchError && (
                <p className="text-xs text-red-600 font-medium">{searchError}</p>
              )}

              {/* Search Results List */}
              <div className="space-y-2 pt-1">
                {searchQuery.trim().length >= 2 && !isSearching && searchResults.length === 0 && (
                  <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                    Nenhum jogador localizado com este nome.
                  </div>
                )}

                {searchResults.map((user) => {
                  const userIsOwner = user.role === 'owner';
                  const userIsAdmin = user.role === 'admin';

                  return (
                    <div
                      key={user.uid}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar name={user.username} url={user.photoUrl || undefined} size="sm" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#0B192C] truncate">
                            {user.username}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Badge 
                              variant={userIsOwner ? 'owner' : userIsAdmin ? 'admin' : 'player'} 
                              size="sm"
                            >
                              {userIsOwner ? 'Proprietário' : userIsAdmin ? 'Admin' : 'Jogador'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      {!userIsOwner && (
                        <div>
                          {userIsAdmin ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs border-red-300 text-red-700 hover:bg-red-50"
                              onClick={() => handleOpenConfirm(user, 'demote')}
                              icon={<UserX className="w-3.5 h-3.5" />}
                            >
                              Remover
                            </Button>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              className="text-xs bg-[#1E3A8A] hover:bg-[#0B192C]"
                              onClick={() => handleOpenConfirm(user, 'promote')}
                              icon={<UserCheck className="w-3.5 h-3.5" />}
                            >
                              Promover
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        ) : (
          /* Admin View Notice */
          <Card className="bg-amber-50/60 border-amber-200 text-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Visão de Administrador</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Como administrador, você possui acesso prévio à Central Administrativa. A gestão de atribuição e permissões de outros administradores é restrita exclusivamente ao Proprietário.
            </p>
          </Card>
        )}

        {/* Future Modules Cards */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#0B192C]">
            Módulos de Gestão
          </h2>

          <div className="grid grid-cols-1 gap-3">
            {/* Module 1: Jogos e Presença (ACTIVE) */}
            <Card 
              onClick={() => navigate('/admin/jogos')}
              accentBar
              accentColor="navy"
              className="bg-white hover:border-[#1E3A8A] cursor-pointer shadow-xs transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-100 text-[#1E3A8A]">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-[#0B192C]">Jogos e Presença</h3>
                    <p className="text-[10px] text-slate-500">Agendar partidas, editar e gerenciar vagas</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Ativo
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </Card>

            {/* Module 2: Níveis dos Jogadores (ACTIVE) */}
            <Card 
              onClick={() => navigate('/admin/niveis')}
              accentBar
              accentColor="gold"
              className="bg-white hover:border-amber-500 cursor-pointer shadow-xs transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-[#0B192C]">Níveis dos Jogadores</h3>
                    <p className="text-[10px] text-slate-500">Classificação técnica dos atletas</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Ativo
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </Card>

            {/* Module 3: Formação de Times (ACTIVE) */}
            <Card 
              onClick={() => navigate('/admin/jogos')}
              accentBar
              accentColor="red"
              className="bg-white hover:border-[#E63946] cursor-pointer shadow-xs transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-red-100 text-[#E63946]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-[#0B192C]">Formação de Times e Placar</h3>
                    <p className="text-[10px] text-slate-500">Escalação, convidados, times equilibrados e placar</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Ativo
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </Card>

            {/* Module 4: Registro de Comparecimento Real (ACTIVE) */}
            <Card 
              onClick={() => navigate('/admin/jogos')}
              accentBar
              accentColor="emerald"
              className="bg-white hover:border-emerald-600 cursor-pointer shadow-xs transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-[#0B192C]">Comparecimento e Histórico</h3>
                    <p className="text-[10px] text-slate-500">Registrar presença real pós-jogo e atualizar estatísticas</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Ativo
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* OBJECTIVE 4: Registered Players Directory (Jogadores cadastrados) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0B192C] flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#1E3A8A]" />
              Jogadores Cadastrados ({allProfiles.length})
            </h2>
          </div>

          <Card className="space-y-4 shadow-sm">
            {/* Search and Filters Header */}
            <div className="space-y-3">
              <div className="relative">
                <Input
                  placeholder="Pesquisar por nome ou username..."
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                  icon={<Search className="w-4 h-4 text-slate-500" />}
                />
                {directorySearch && (
                  <button
                    onClick={() => setDirectorySearch('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filter Controls */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Papel</label>
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value as any)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-slate-800 bg-white font-medium focus:ring-2 focus:ring-[#1E3A8A]"
                  >
                    <option value="all">Todos os Papéis</option>
                    <option value="owner">Proprietário</option>
                    <option value="admin">Administrador</option>
                    <option value="player">Jogador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-slate-800 bg-white font-medium focus:ring-2 focus:ring-[#1E3A8A]"
                  >
                    <option value="all">Todos os Status</option>
                    <option value="active">Ativo</option>
                    <option value="suspended">Suspenso</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nível Técnico</label>
                  <select
                    value={filterLevel}
                    onChange={(e) => setFilterLevel(e.target.value as any)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-slate-800 bg-white font-medium focus:ring-2 focus:ring-[#1E3A8A]"
                  >
                    <option value="all">Todos os Níveis</option>
                    <option value="1">Nível 1 (Iniciante)</option>
                    <option value="2">Nível 2 (Interm.)</option>
                    <option value="3">Nível 3 (Avançado)</option>
                    <option value="nao_classificado">Não classificado</option>
                  </select>
                </div>
              </div>
            </div>

            {profilesError && (
              <Alert type="error" className="text-xs">
                {profilesError}
              </Alert>
            )}

            {/* Players List */}
            {loadingProfiles ? (
              <div className="py-8 text-center text-xs text-slate-500 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#0B192C] mx-auto" />
                <p>Carregando diretório de jogadores...</p>
              </div>
            ) : (() => {
              const filtered = allProfiles.filter((p) => {
                const sTerm = directorySearch.trim().toLowerCase();
                if (sTerm) {
                  const uMatch = p.username.toLowerCase().includes(sTerm);
                  const dMatch = (p.displayName || '').toLowerCase().includes(sTerm);
                  if (!uMatch && !dMatch) return false;
                }
                if (filterRole !== 'all' && p.role !== filterRole) return false;
                if (filterStatus !== 'all' && p.status !== filterStatus) return false;
                if (filterLevel !== 'all') {
                  if (filterLevel === 'nao_classificado') {
                    if (p.technicalLevel !== null && p.technicalLevel !== 'nao_classificado') return false;
                  } else {
                    if (String(p.technicalLevel) !== filterLevel) return false;
                  }
                }
                return true;
              });

              if (filtered.length === 0) {
                return (
                  <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                    Nenhum jogador encontrado com os filtros selecionados.
                  </div>
                );
              }

              return (
                <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-1">
                  {filtered.map((u) => {
                    const roleLabel = u.role === 'owner' ? 'Proprietário' : u.role === 'admin' ? 'Admin' : 'Jogador';
                    const roleVariant = u.role === 'owner' ? 'owner' : u.role === 'admin' ? 'admin' : 'player';
                    const levelLabel = (u.technicalLevel === 1 || u.technicalLevel === '1' || u.technicalLevel === 'iniciante')
                      ? 'Nível 1'
                      : (u.technicalLevel === 2 || u.technicalLevel === '2' || u.technicalLevel === 'intermediario')
                      ? 'Nível 2'
                      : (u.technicalLevel === 3 || u.technicalLevel === '3' || u.technicalLevel === 'avancado')
                      ? 'Nível 3'
                      : 'N/C';

                    const isInactive = u.status !== 'active';

                    return (
                      <div key={u.uid} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar name={u.displayName || u.username} url={u.photoUrl || undefined} size="sm" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-xs font-black text-[#0B192C] truncate">
                                {u.displayName ? u.displayName : u.username}
                              </p>
                              {u.displayName && (
                                <span className="text-[11px] text-slate-500 font-medium">@{u.username}</span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <Badge variant={roleVariant} size="sm">
                                {roleLabel}
                              </Badge>
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                {levelLabel}
                              </span>
                              <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 font-medium">
                                {u.attendanceCount} presenças
                              </span>
                              {isInactive && (
                                <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-md border border-red-200">
                                  {u.status === 'suspended' ? 'Suspenso' : 'Inativo'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* OBJECTIVE 5: Action Button Adicionar à partida */}
                        <div className="shrink-0 flex items-center justify-end">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenAddToGame(u)}
                            icon={<UserPlus className="w-3.5 h-3.5 text-amber-400" />}
                            className="bg-[#0B192C] hover:bg-[#1E3A8A] text-white text-[11px] py-1.5"
                          >
                            Adicionar à Partida
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </Card>
        </div>
      </main>

      {/* OBJECTIVE 5 Modal: Adicionar Jogador à Partida */}

      {/* OBJECTIVE 5 Modal: Adicionar Jogador à Partida */}
      {addToGameUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 text-[#1E3A8A]">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#0B192C]">Adicionar à Partida</h3>
                  <p className="text-[11px] text-slate-500">Inclusão administrativa de jogador</p>
                </div>
              </div>
              <button
                onClick={() => setAddToGameUser(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Target Player Summary Card */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
              <Avatar name={addToGameUser.displayName || addToGameUser.username} url={addToGameUser.photoUrl || undefined} size="sm" />
              <div className="min-w-0">
                <p className="text-xs font-black text-[#0B192C] truncate">
                  {addToGameUser.displayName ? `${addToGameUser.displayName} (@${addToGameUser.username})` : addToGameUser.username}
                </p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Nível Técnico: {addToGameUser.technicalLevel ? `Nível ${addToGameUser.technicalLevel}` : 'Não classificado'}
                </p>
              </div>
            </div>

            {addGameSuccess && (
              <Alert type="success" className="text-xs">
                {addGameSuccess}
              </Alert>
            )}

            {addGameError && (
              <Alert type="error" className="text-xs">
                {addGameError}
              </Alert>
            )}

            {/* Game Selector */}
            {loadingGames ? (
              <div className="py-4 text-center text-xs text-slate-500 space-y-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#0B192C] mx-auto" />
                <p>Carregando partidas disponíveis...</p>
              </div>
            ) : upcomingGames.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-600 bg-amber-50 rounded-xl border border-amber-200">
                Nenhuma partida agendada e ativa no momento. Crie um novo jogo para incluir este jogador.
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Selecione a Partida *</label>
                  <select
                    value={selectedGameId}
                    onChange={(e) => setSelectedGameId(e.target.value)}
                    disabled={isAddingToGame}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] text-xs text-slate-800 bg-white font-medium"
                  >
                    {upcomingGames.map((g) => {
                      const dt = formatGameDateTime(g.scheduledAt);
                      return (
                        <option key={g.id} value={g.id}>
                          {g.title} ({dt.dateStr} às {dt.timeStr}) - {g.confirmedCount}/{g.maxPlayers} vagas
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Selected Game Preview Info */}
                {(() => {
                  const selGame = upcomingGames.find((g) => g.id === selectedGameId);
                  if (!selGame) return null;
                  const dt = formatGameDateTime(selGame.scheduledAt);
                  const isFull = selGame.confirmedCount >= selGame.maxPlayers;

                  return (
                    <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1 text-slate-800">
                      <p className="font-bold text-[#0B192C]">{selGame.title}</p>
                      <p className="text-[11px] text-slate-600">{dt.fullStr} • {selGame.location}</p>
                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        <span className="font-semibold text-slate-700">Situação das Vagas:</span>
                        <span className={`font-bold px-2 py-0.5 rounded-full ${isFull ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-emerald-100 text-emerald-900 border border-emerald-200'}`}>
                          {selGame.confirmedCount}/{selGame.maxPlayers} vagas ocupadas {isFull ? '(Lotado - Irá para Lista de Espera)' : ''}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    onClick={() => setAddToGameUser(null)}
                    disabled={isAddingToGame}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    loading={isAddingToGame}
                    onClick={handleConfirmAddToGame}
                    className="bg-[#0B192C]"
                  >
                    Confirmar Inclusão
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {targetUser && actionType && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${actionType === 'promote' ? 'bg-blue-100 text-[#1E3A8A]' : 'bg-red-100 text-red-700'}`}>
                {actionType === 'promote' ? <UserCheck className="w-6 h-6" /> : <UserX className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-sm font-black text-[#0B192C]">Confirmar alteração</h3>
                <p className="text-xs text-slate-500">Ação de gerenciamento de papéis</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
              {actionType === 'promote'
                ? `Deseja transformar ${targetUser.username} em administrador?`
                : `Deseja remover ${targetUser.username} da função de administrador?`}
            </p>

            {updateError && (
              <Alert type="error" className="text-xs">
                {updateError}
              </Alert>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={handleCloseModal}
                disabled={isUpdating}
              >
                Cancelar
              </Button>
              <Button
                variant={actionType === 'promote' ? 'primary' : 'danger'}
                size="sm"
                fullWidth
                loading={isUpdating}
                onClick={handleConfirmRoleChange}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
