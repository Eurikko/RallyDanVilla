import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Avatar } from '../components/Avatar';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';
import { Input } from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { 
  TECHNICAL_LEVELS, 
  TechnicalLevelNumber, 
  getTechnicalLevelInfo, 
  getTechnicalLevelLabel 
} from '../lib/technicalLevel';
import { 
  getTechnicalLevelMetrics, 
  searchPlayersForClassification, 
  updatePlayerTechnicalLevel, 
  ClassificationMetrics, 
  PlayerSearchItem 
} from '../lib/technicalLevelService';
import { 
  Award, 
  ArrowLeft, 
  Search, 
  Loader2, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  X, 
  ChevronRight, 
  Filter, 
  Info,
  SlidersHorizontal
} from 'lucide-react';

export const AdminLevelsPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, loading: authLoading, updateProfileLocal, refreshProfile } = useAuth();

  // Metrics state
  const [metrics, setMetrics] = useState<ClassificationMetrics>({
    totalActive: 0,
    classifiedCount: 0,
    unclassifiedCount: 0,
    levelCounts: { 1: 0, 2: 0, 3: 0 },
  });
  const [metricsLoading, setMetricsLoading] = useState(true);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'unclassified' | number>('all');
  const [players, setPlayers] = useState<PlayerSearchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Selected Player & Classification Modal State
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerSearchItem | null>(null);
  const [chosenLevel, setChosenLevel] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Criteria guidelines modal state
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);

  // Check role authorization
  useEffect(() => {
    if (!authLoading) {
      if (!profile) {
        navigate('/entrar', { replace: true });
        return;
      }

      if (profile.role !== 'owner' && profile.role !== 'admin') {
        navigate('/inicio', {
          replace: true,
          state: { errorMsg: 'Você não possui permissão para gerenciar níveis técnicos.' },
        });
      }
    }
  }, [profile, authLoading, navigate]);

  // Load metrics
  const loadMetrics = useCallback(async () => {
    setMetricsLoading(true);
    try {
      const data = await getTechnicalLevelMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('[AdminLevelsPage] Error loading metrics:', err);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (profile && (profile.role === 'owner' || profile.role === 'admin')) {
      loadMetrics();
    }
  }, [profile, loadMetrics]);

  // Execute Player Search
  const fetchPlayers = useCallback(async () => {
    if (!profile?.uid) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const items = await searchPlayersForClassification({
        requestorUid: profile.uid,
        searchTerm,
        levelFilter,
        maxResults: 20,
      });
      setPlayers(items);
    } catch (err: any) {
      console.error('[AdminLevelsPage] Fetch players error:', err);
      setSearchError('Não foi possível localizar jogadores. Tente novamente.');
    } finally {
      setIsSearching(false);
    }
  }, [profile?.uid, searchTerm, levelFilter]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      if (profile && (profile.role === 'owner' || profile.role === 'admin')) {
        fetchPlayers();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, levelFilter, profile, fetchPlayers]);

  // Open Level Selection Modal for a Player
  const handleOpenLevelModal = (player: PlayerSearchItem) => {
    setSelectedPlayer(player);
    setChosenLevel(player.technicalLevel);
    setShowConfirmModal(false);
    setSaveError(null);
  };

  const handleCloseModal = () => {
    setSelectedPlayer(null);
    setChosenLevel(null);
    setShowConfirmModal(false);
    setSaveError(null);
  };

  // Submit level change
  const handleSaveLevel = async () => {
    if (!selectedPlayer || !profile?.uid) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      await updatePlayerTechnicalLevel({
        requestorUid: profile.uid,
        targetUid: selectedPlayer.uid,
        newLevel: chosenLevel,
      });

      // Sync local profile if editing own level
      if (selectedPlayer.uid === profile.uid) {
        updateProfileLocal({ technicalLevel: chosenLevel as any });
        await refreshProfile();
      }

      // Show Toast Notice
      const levelInfo = chosenLevel ? TECHNICAL_LEVELS[chosenLevel as TechnicalLevelNumber] : null;
      const targetName = selectedPlayer.displayName || selectedPlayer.username;
      const toastMsg = levelInfo
        ? `Nível de ${targetName} definido como Nível ${levelInfo.level} (${levelInfo.name}).`
        : `Classificação técnica de ${targetName} foi removida.`;

      setSuccessToast(toastMsg);
      setTimeout(() => setSuccessToast(null), 4000);

      // Refresh list and metrics
      handleCloseModal();
      fetchPlayers();
      loadMetrics();
    } catch (err: any) {
      console.error('[AdminLevelsPage] Save level error:', err);
      setSaveError(err.message || 'Não foi possível atualizar a classificação. Tente novamente.');
    } finally {
      setIsSaving(false);
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
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B192C] hover:text-[#1E3A8A] bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Central Administrativa
          </button>

          <Badge variant={isOwner ? 'owner' : 'admin'} size="sm">
            {isOwner ? 'Proprietário' : 'Administrador'}
          </Badge>
        </div>

        {/* Title Banner */}
        <Card accentBar accentColor="navy" className="bg-[#0B192C] text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400">
                <Award className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-base font-black text-white">Níveis dos Jogadores</h1>
                <p className="text-xs text-slate-300">
                  Classificação técnica manual dos atletas
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowCriteriaModal(true)}
              className="p-2 text-amber-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              title="Ver critérios de classificação"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </Card>

        {/* Success Toast Notification */}
        {successToast && (
          <Alert type="success" className="animate-fadeIn">
            {successToast}
          </Alert>
        )}

        {/* Summary Indicators */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="text-center p-3 bg-white">
            <span className="text-xl font-black text-[#0B192C] block">
              {metricsLoading ? '...' : metrics.totalActive}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Atletas Ativos</span>
          </Card>

          <Card className="text-center p-3 bg-white border-l-2 border-l-emerald-500">
            <span className="text-xl font-black text-emerald-700 block">
              {metricsLoading ? '...' : metrics.classifiedCount}
            </span>
            <span className="text-[10px] font-bold text-emerald-800 uppercase">Classificados</span>
          </Card>

          <Card className="text-center p-3 bg-white border-l-2 border-l-amber-500">
            <span className="text-xl font-black text-amber-700 block">
              {metricsLoading ? '...' : metrics.unclassifiedCount}
            </span>
            <span className="text-[10px] font-bold text-amber-800 uppercase">Sem Nível</span>
          </Card>
        </div>

        {/* Breakdown Badges Pill Strip */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#0B192C]">
            <span>Distribuição por Nível:</span>
            <button
              onClick={() => setShowCriteriaModal(true)}
              className="text-[11px] text-[#1E3A8A] font-semibold flex items-center gap-1 hover:underline"
            >
              <Info className="w-3.5 h-3.5" />
              Guia de níveis
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {([1, 2, 3] as TechnicalLevelNumber[]).map((lvl) => {
              const info = TECHNICAL_LEVELS[lvl];
              const count = metrics.levelCounts[lvl] || 0;
              return (
                <button
                  key={lvl}
                  onClick={() => setLevelFilter(levelFilter === lvl ? 'all' : lvl)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
                    levelFilter === lvl
                      ? 'bg-[#0B192C] text-white border-[#0B192C] shadow-xs'
                      : `${info.badgeBg} ${info.badgeText} ${info.badgeBorder} hover:opacity-90`
                  }`}
                >
                  <span>N{lvl} ({info.name}):</span>
                  <span className="font-black">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="space-y-3">
          <div className="relative">
            <Input
              placeholder="Pesquisar por nome de usuário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-4 h-4 text-slate-400" />}
            />
            {isSearching && (
              <div className="absolute right-3 top-2.5">
                <Loader2 className="w-4 h-4 animate-spin text-[#1E3A8A]" />
              </div>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              onClick={() => setLevelFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border ${
                levelFilter === 'all'
                  ? 'bg-[#0B192C] text-white border-[#0B192C]'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Todos ({metrics.totalActive})
            </button>

            <button
              onClick={() => setLevelFilter('unclassified')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border ${
                levelFilter === 'unclassified'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50'
              }`}
            >
              Sem Nível ({metrics.unclassifiedCount})
            </button>

            {([1, 2, 3] as TechnicalLevelNumber[]).map((lvl) => {
              const info = TECHNICAL_LEVELS[lvl];
              const isActive = levelFilter === lvl;
              return (
                <button
                  key={lvl}
                  onClick={() => setLevelFilter(isActive ? 'all' : lvl)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border ${
                    isActive
                      ? 'bg-[#0B192C] text-white border-[#0B192C]'
                      : `bg-white text-slate-700 border-slate-200 hover:bg-slate-50`
                  }`}
                >
                  N{lvl} - {info.name}
                </button>
              );
            })}
          </div>
        </div>

        {searchError && (
          <Alert type="error" className="text-xs">
            {searchError}
          </Alert>
        )}

        {/* Players List */}
        <div className="space-y-2">
          {isSearching ? (
            <div className="py-8 text-center space-y-2 bg-white rounded-2xl border border-slate-200 p-4">
              <Loader2 className="w-6 h-6 animate-spin text-[#0B192C] mx-auto" />
              <p className="text-xs font-medium text-slate-500">Buscando jogadores...</p>
            </div>
          ) : players.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200 space-y-2">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-700">Nenhum jogador localizado</p>
              <p className="text-[11px] text-slate-500">
                Tente ajustar o termo de pesquisa ou o filtro de nível selecionado.
              </p>
            </div>
          ) : (
            players.map((player) => {
              const levelInfo = getTechnicalLevelInfo(player.technicalLevel);
              const isSelf = player.uid === profile.uid;
              const nameToShow = player.displayName || player.username;

              return (
                <Card
                  key={player.uid}
                  className={`bg-white hover:border-slate-300 transition-all p-3.5 flex items-center justify-between gap-3 ${
                    isSelf ? 'border-l-4 border-l-[#1E3A8A]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <PlayerAvatar
                      photoUrl={player.photoUrl}
                      displayName={player.displayName}
                      username={player.username}
                      size="md"
                    />
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-xs font-bold text-[#0B192C] truncate">
                          {nameToShow}
                        </h3>
                        {isSelf && (
                          <span className="text-[9px] font-bold text-[#1E3A8A] bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded-full">
                            Você
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium">@{player.username}</p>

                      <div>
                        {levelInfo ? (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${levelInfo.badgeBg} ${levelInfo.badgeText} ${levelInfo.badgeBorder}`}
                          >
                            <Award className="w-3 h-3" />
                            Nível {levelInfo.level} • {levelInfo.name}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                            Ainda não classificado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant={levelInfo ? 'outline' : 'primary'}
                    size="sm"
                    className={levelInfo ? 'border-slate-300 text-slate-700 hover:bg-slate-50' : 'bg-[#0B192C] hover:bg-[#1E3A8A]'}
                    onClick={() => handleOpenLevelModal(player)}
                  >
                    {levelInfo ? 'Alterar' : 'Definir'}
                  </Button>
                </Card>
              );
            })
          )}
        </div>
      </main>

      {/* Level Selection Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <PlayerAvatar
                  photoUrl={selectedPlayer.photoUrl}
                  displayName={selectedPlayer.displayName}
                  username={selectedPlayer.username}
                  size="md"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-black text-[#0B192C] truncate">
                      {selectedPlayer.displayName || selectedPlayer.username}
                    </h3>
                    {selectedPlayer.uid === profile.uid && (
                      <span className="text-[9px] font-bold text-[#1E3A8A] bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded-full">
                        Você
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    @{selectedPlayer.username} • {selectedPlayer.technicalLevel
                      ? getTechnicalLevelLabel(selectedPlayer.technicalLevel)
                      : 'Ainda não classificado'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseModal}
                disabled={isSaving}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Level Options List */}
            {!showConfirmModal ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#0B192C] block">
                    Selecione o nível técnico do atleta:
                  </label>
                  <p className="text-[11px] text-slate-500">
                    A classificação deve considerar a execução técnica e regularidade em jogo.
                  </p>
                </div>

                {/* Level Radio Options */}
                <div className="space-y-2">
                  {([1, 2, 3] as TechnicalLevelNumber[]).map((lvl) => {
                    const info = TECHNICAL_LEVELS[lvl];
                    const isSelected = chosenLevel === lvl;

                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setChosenLevel(lvl)}
                        className={`w-full text-left p-3 rounded-xl border transition-all space-y-1 ${
                          isSelected
                            ? 'bg-blue-50/70 border-[#1E3A8A] ring-1 ring-[#1E3A8A]'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-black px-2 py-0.5 rounded-md border ${info.badgeBg} ${info.badgeText} ${info.badgeBorder}`}
                            >
                              Nível {info.level}
                            </span>
                            <span className="text-xs font-bold text-[#0B192C]">{info.name}</span>
                          </div>

                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-[#1E3A8A] bg-[#1E3A8A] text-white' : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-600 pl-0.5">{info.description}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Option to mark as unclassified */}
                {selectedPlayer.technicalLevel !== null && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setChosenLevel(null)}
                      className={`w-full text-xs font-bold p-2.5 rounded-xl border text-center transition-all ${
                        chosenLevel === null
                          ? 'bg-amber-50 text-amber-900 border-amber-300 ring-1 ring-amber-400'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Remover classificação (Marcar como não classificado)
                    </button>
                  </div>
                )}

                {/* Admin Guidelines Disclaimer */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[#0B192C]">
                    <Info className="w-3.5 h-3.5 text-[#1E3A8A] shrink-0" />
                    <span>Critérios Orientadores:</span>
                  </div>
                  <p>
                    Avalie domínio de fundamentos, consistência e leitura de jogo. Não considere tempo de grupo, presenças ou papéis organizacionais.
                  </p>
                </div>

                {/* Step 1 Actions */}
                <div className="flex gap-2 pt-2 border-t border-slate-200">
                  <Button variant="outline" size="sm" fullWidth onClick={handleCloseModal}>
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    onClick={() => setShowConfirmModal(true)}
                    disabled={chosenLevel === selectedPlayer.technicalLevel}
                    className="bg-[#0B192C] hover:bg-[#1E3A8A]"
                  >
                    Avançar
                  </Button>
                </div>
              </div>
            ) : (
              /* Step 2: Confirmation Prompt */
              <div className="space-y-4 animate-fadeIn">
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-900 space-y-2">
                  <h4 className="font-bold text-[#0B192C]">Confirmar alteração de nível:</h4>
                  <p className="text-slate-700 leading-relaxed">
                    {chosenLevel === null
                      ? `Deseja remover a classificação técnica de ${selectedPlayer.username}?`
                      : selectedPlayer.technicalLevel === null
                      ? `Deseja definir o nível de ${selectedPlayer.username} como Nível ${chosenLevel} (${TECHNICAL_LEVELS[chosenLevel as TechnicalLevelNumber]?.name})?`
                      : `Deseja alterar o nível de ${selectedPlayer.username} de Nível ${selectedPlayer.technicalLevel} para Nível ${chosenLevel} (${TECHNICAL_LEVELS[chosenLevel as TechnicalLevelNumber]?.name})?`}
                  </p>
                </div>

                {saveError && (
                  <Alert type="error" className="text-xs">
                    {saveError}
                  </Alert>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    onClick={() => setShowConfirmModal(false)}
                    disabled={isSaving}
                  >
                    Voltar
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    loading={isSaving}
                    onClick={handleSaveLevel}
                    className="bg-[#0B192C] hover:bg-[#1E3A8A]"
                  >
                    Salvar Classificação
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Guidelines Explanation Modal */}
      {showCriteriaModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto p-5 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-black text-[#0B192C]">Guia dos 3 Níveis Técnicos</h3>
              </div>
              <button
                onClick={() => setShowCriteriaModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                A classificação técnica é avaliada de forma geral pelos organizadores e serve para promover jogos equilibrados.
              </p>

              {([1, 2, 3] as TechnicalLevelNumber[]).map((lvl) => {
                const info = TECHNICAL_LEVELS[lvl];
                return (
                  <div key={lvl} className="p-3 rounded-xl border border-slate-200 space-y-1 bg-white">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${info.badgeBg} ${info.badgeText} ${info.badgeBorder}`}>
                        Nível {info.level}
                      </span>
                      <h4 className="font-bold text-[#0B192C]">{info.name}</h4>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{info.description}</p>
                  </div>
                );
              })}
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                size="sm"
                fullWidth
                onClick={() => setShowCriteriaModal(false)}
                className="bg-[#0B192C]"
              >
                Entendi
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
