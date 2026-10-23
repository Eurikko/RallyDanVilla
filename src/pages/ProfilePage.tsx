import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';
import { 
  Shield, 
  Edit3, 
  LogOut, 
  Info, 
  Lock, 
  Award, 
  HelpCircle, 
  X, 
  Calendar, 
  MapPin, 
  CheckCircle,
  Camera,
  Trash2,
  Check,
  Loader2,
  Home
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  TECHNICAL_LEVELS, 
  TechnicalLevelNumber, 
  getTechnicalLevelInfo 
} from '../lib/technicalLevel';
import { getUserAttendanceHistory, UserParticipationHistoryItem } from '../lib/attendanceService';
import { 
  validateDisplayName, 
  processProfileImage, 
  uploadAvatarAndSaveProfile, 
  removeProfileAvatar, 
  updateProfileInfo 
} from '../lib/profileService';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, isAuthenticated, loading: authLoading, logout, updateProfileLocal, refreshProfile } = useAuth();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLevelGuideModal, setShowLevelGuideModal] = useState(false);

  // Participation History state
  const [historyItems, setHistoryItems] = useState<UserParticipationHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  // Photo Edit State
  const [newPhotoBlob, setNewPhotoBlob] = useState<Blob | null>(null);
  const [newPhotoPreviewUrl, setNewPhotoPreviewUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [markPhotoForRemoval, setMarkPhotoForRemoval] = useState(false);
  const [showRemoveConfirmModal, setShowRemoveConfirmModal] = useState(false);

  // Form submission state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Authentication Guard
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !profile)) {
      navigate('/entrar', { replace: true, state: { errorMsg: 'Faça login para acessar seu perfil.' } });
    }
  }, [authLoading, isAuthenticated, profile, navigate]);

  // Load participation history
  useEffect(() => {
    async function loadHistory() {
      if (profile?.uid) {
        setHistoryLoading(true);
        setHistoryError(null);
        try {
          const res = await getUserAttendanceHistory(profile.uid);
          setHistoryItems(res.history);
        } catch (err) {
          console.error('[ProfilePage] Error loading attendance history:', err);
          setHistoryError('Não foi possível carregar seu histórico de participações.');
        } finally {
          setHistoryLoading(false);
        }
      }
    }
    loadHistory();
  }, [profile?.uid]);

  if (authLoading || !profile) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#0B192C]" />
        <p className="text-xs text-slate-500 font-medium mt-2">Carregando dados do perfil...</p>
      </div>
    );
  }

  const username = profile.username;
  const displayName = profile.displayName || null;
  const effectiveName = displayName || username;
  const attendanceCount = profile.attendanceCount ?? 0;
  
  const levelInfo = getTechnicalLevelInfo(profile.technicalLevel);
  const userRole = profile.role || 'player';

  const roleLabel = userRole === 'owner' ? 'Proprietário' : userRole === 'admin' ? 'Administrador' : 'Jogador';
  const roleBadgeVariant = userRole === 'owner' ? 'owner' : userRole === 'admin' ? 'admin' : 'player';

  // Format attendance count text
  const attendanceText = attendanceCount === 0
    ? 'Nenhuma participação registrada'
    : attendanceCount === 1
    ? '1 participação registrada'
    : `${attendanceCount} participações registradas`;

  // Start editing mode
  const handleStartEditing = () => {
    setEditDisplayName(profile.displayName || '');
    setNameError(null);
    setPhotoError(null);
    setNewPhotoBlob(null);
    setNewPhotoPreviewUrl(null);
    setMarkPhotoForRemoval(false);
    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);
    setIsEditing(true);
  };

  // Cancel editing mode
  const handleCancelEditing = () => {
    setIsEditing(false);
    setEditDisplayName('');
    setNameError(null);
    setPhotoError(null);
    setNewPhotoBlob(null);
    setNewPhotoPreviewUrl(null);
    setMarkPhotoForRemoval(false);
    setSaveErrorMsg(null);
  };

  // Handle image file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError(null);
    setSaveErrorMsg(null);

    try {
      const processed = await processProfileImage(file);
      setNewPhotoBlob(processed.blob);
      setNewPhotoPreviewUrl(processed.dataUrl);
      setMarkPhotoForRemoval(false);
    } catch (err: any) {
      console.error('[ProfilePage] Image processing error:', err);
      setPhotoError(err.message || 'Não foi possível processar esta imagem.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Confirm photo removal
  const handleConfirmPhotoRemoval = () => {
    setMarkPhotoForRemoval(true);
    setNewPhotoBlob(null);
    setNewPhotoPreviewUrl(null);
    setShowRemoveConfirmModal(false);
  };

  // Validate Display Name on change
  const handleDisplayNameChange = (value: string) => {
    setEditDisplayName(value);
    setSaveErrorMsg(null);

    const valRes = validateDisplayName(value);
    if (!valRes.isValid) {
      setNameError(valRes.error || null);
    } else {
      setNameError(null);
    }
  };

  // Save profile modifications
  const handleSaveProfile = async () => {
    if (isSaving) return;

    // Validate name before submission
    const valRes = validateDisplayName(editDisplayName);
    if (!valRes.isValid) {
      setNameError(valRes.error || 'Nome de exibição inválido.');
      return;
    }

    setIsSaving(true);
    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);

    try {
      let updatedPhotoUrl: string | null | undefined = undefined;

      // 1. Handle Photo Removal
      if (markPhotoForRemoval) {
        try {
          await removeProfileAvatar(profile.uid, profile.uid);
          updatedPhotoUrl = null;
        } catch (err: any) {
          throw new Error('Não foi possível remover a foto.');
        }
      } 
      // 2. Handle Photo Upload
      else if (newPhotoBlob && newPhotoPreviewUrl) {
        try {
          const res = await uploadAvatarAndSaveProfile(profile.uid, profile.uid, newPhotoBlob, newPhotoPreviewUrl);
          updatedPhotoUrl = res.photoUrl;
        } catch (err: any) {
          throw new Error('Não foi possível enviar a foto.');
        }
      }

      // 3. Update Display Name and Profile Info
      const { cleanDisplayName } = await updateProfileInfo({
        authenticatedUid: profile.uid,
        targetProfileUid: profile.uid,
        displayName: valRes.cleanName,
        photoUrl: updatedPhotoUrl,
      });

      // 4. Update local AuthContext state
      updateProfileLocal({
        displayName: cleanDisplayName,
        ...(updatedPhotoUrl !== undefined ? { photoUrl: updatedPhotoUrl } : {}),
      });

      await refreshProfile();

      setSaveSuccessMsg('Perfil atualizado com sucesso.');
      setIsEditing(false);
      setNewPhotoBlob(null);
      setNewPhotoPreviewUrl(null);
      setMarkPhotoForRemoval(false);

      setTimeout(() => setSaveSuccessMsg(null), 5000);
    } catch (err: any) {
      console.error('[ProfilePage] Save profile error:', err);
      setSaveErrorMsg(err.message || 'Não foi possível atualizar o perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/entrar', { replace: true });
    } catch (err) {
      console.error('[ProfilePage] Logout error:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const currentPhotoDisplay = markPhotoForRemoval
    ? null
    : newPhotoPreviewUrl || profile.photoUrl || null;

  return (
    <div className="min-h-screen bg-slate-100 text-[#0F172A] pb-24">
      <Header 
        title="Meu perfil" 
        rightAction={
          <button
            onClick={() => navigate('/inicio')}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
            title="Página Inicial"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Início</span>
          </button>
        }
      />

      <main className="max-w-md mx-auto px-4 py-5 space-y-5">
        {/* Success Alert Banner */}
        {saveSuccessMsg && (
          <Alert type="success" className="animate-fadeIn">
            {saveSuccessMsg}
          </Alert>
        )}

        {/* Global Save Error Banner */}
        {saveErrorMsg && (
          <Alert type="error" className="animate-fadeIn">
            {saveErrorMsg}
          </Alert>
        )}

        {/* Main Profile Summary Card */}
        <Card accentBar accentColor="navy" className="shadow-md text-center py-6 space-y-4 bg-white relative">
          <div className="relative inline-block mx-auto">
            <PlayerAvatar
              photoUrl={currentPhotoDisplay}
              displayName={displayName}
              username={username}
              size="2xl"
              className="mx-auto"
            />

            {!isEditing && (
              <button
                onClick={handleStartEditing}
                className="absolute bottom-0 right-0 p-2 bg-[#0B192C] text-white hover:bg-[#1E3A8A] rounded-full border-2 border-white shadow-md cursor-pointer transition-transform active:scale-95"
                title="Editar foto ou perfil"
                aria-label="Editar foto do perfil"
              >
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>

          <div>
            <h1 className="text-xl font-black text-[#0B192C] break-words px-2">
              {displayName || username}
            </h1>
            <p className="text-xs font-bold text-slate-500 mt-0.5">@{username}</p>
          </div>

          <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
            <Badge variant={roleBadgeVariant} size="md">
              {roleLabel}
            </Badge>

            {levelInfo ? (
              <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${levelInfo.badgeBg} ${levelInfo.badgeText} ${levelInfo.badgeBorder}`}>
                <Award className="w-3.5 h-3.5" />
                Nível {levelInfo.level} • {levelInfo.name}
              </span>
            ) : (
              <Badge variant="level" size="md">
                Ainda não classificado
              </Badge>
            )}
          </div>

          {!isEditing && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartEditing}
                icon={<Edit3 className="w-4 h-4 text-[#1E3A8A]" />}
                className="border-[#1E3A8A] text-[#1E3A8A] hover:bg-blue-50 font-bold"
              >
                Editar Perfil
              </Button>
            </div>
          )}
        </Card>

        {/* PROFILE EDIT MODE FORM */}
        {isEditing && (
          <Card className="space-y-4 bg-white border-2 border-[#1E3A8A] shadow-lg animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-sm font-black text-[#0B192C] flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#1E3A8A]" />
                Editar Dados Pessoais
              </h2>
              <button
                onClick={handleCancelEditing}
                disabled={isSaving}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer disabled:opacity-50"
                aria-label="Cancelar edição"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo Selection / Management */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#0B192C] block">
                Foto do Perfil (Opcional)
              </label>

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <PlayerAvatar
                  photoUrl={currentPhotoDisplay}
                  displayName={editDisplayName || displayName}
                  username={username}
                  size="lg"
                />

                <div className="flex-1 space-y-2 min-w-0">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    id="profile-photo-input"
                  />

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      disabled={isSaving}
                      onClick={() => fileInputRef.current?.click()}
                      icon={<Camera className="w-3.5 h-3.5" />}
                      className="text-xs font-bold border-slate-300 text-slate-700 bg-white"
                    >
                      {currentPhotoDisplay ? 'Substituir foto' : 'Escolher foto'}
                    </Button>

                    {currentPhotoDisplay && (
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        disabled={isSaving}
                        onClick={() => setShowRemoveConfirmModal(true)}
                        icon={<Trash2 className="w-3.5 h-3.5 text-red-600" />}
                        className="text-xs font-bold border-red-200 text-red-600 bg-red-50/50 hover:bg-red-100"
                      >
                        Remover
                      </Button>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-500">
                    Formato JPEG, PNG ou WebP. Tamanho máximo: 5 MB.
                  </p>
                </div>
              </div>

              {photoError && (
                <p className="text-[11px] font-bold text-red-600 mt-1">{photoError}</p>
              )}
            </div>

            {/* Display Name Input */}
            <div className="space-y-1.5">
              <label htmlFor="display-name-input" className="text-xs font-bold text-[#0B192C] block">
                Nome de exibição
              </label>
              <input
                id="display-name-input"
                type="text"
                value={editDisplayName}
                onChange={(e) => handleDisplayNameChange(e.target.value)}
                placeholder={username}
                maxLength={40}
                disabled={isSaving}
                className={`w-full px-3 py-2 text-xs rounded-xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 transition-all font-medium ${
                  nameError 
                    ? 'border-red-400 focus:ring-red-300 text-red-900' 
                    : 'border-slate-300 focus:ring-[#1E3A8A] text-[#0B192C]'
                }`}
              />

              <div className="flex justify-between items-center text-[10px] text-slate-500 pt-0.5">
                <span>
                  {editDisplayName.trim().length === 0
                    ? 'Será utilizado seu username como fallback.'
                    : 'Mínimo de 2 caracteres, máximo de 40.'}
                </span>
                <span className="font-mono font-bold">{editDisplayName.length}/40</span>
              </div>

              {nameError && (
                <p className="text-[11px] font-bold text-red-600 mt-0.5">{nameError}</p>
              )}
            </div>

            {/* Username Readonly Notice */}
            <div className="p-2.5 bg-slate-100 rounded-xl border border-slate-200 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Username no sistema:</span>
                <span className="font-mono font-bold text-[#0B192C]">@{username}</span>
              </div>
              <p className="text-[10px] text-slate-500">
                Seu username é utilizado no acesso à conta e não pode ser alterado por esta página.
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="md"
                fullWidth
                type="button"
                disabled={isSaving}
                onClick={handleCancelEditing}
              >
                Cancelar
              </Button>

              <Button
                variant="primary"
                size="md"
                fullWidth
                type="button"
                loading={isSaving}
                disabled={isSaving || !!nameError}
                onClick={handleSaveProfile}
                icon={<Check className="w-4 h-4" />}
                className="bg-[#0B192C] hover:bg-[#1E3A8A]"
              >
                Salvar alterações
              </Button>
            </div>
          </Card>
        )}

        {/* Protected Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="text-center bg-white space-y-1">
            <span className="text-2xl font-black text-[#0B192C] block">{attendanceCount}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              {attendanceCount === 1 ? 'Participação' : 'Participações'}
            </span>
            <p className="text-[9px] text-slate-400">{attendanceText}</p>
          </Card>

          <Card className="text-center bg-white flex flex-col items-center justify-center space-y-1">
            {levelInfo ? (
              <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${levelInfo.badgeBg} ${levelInfo.badgeText} ${levelInfo.badgeBorder}`}>
                Nível {levelInfo.level} - {levelInfo.name}
              </span>
            ) : (
              <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
                Não classificado
              </span>
            )}
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Nível Técnico</span>
            <span className="text-[9px] text-slate-400">Mantido por organizadores</span>
          </Card>
        </div>

        {/* Participation History Section (Reusing Day 7) */}
        <Card className="space-y-3 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0B192C] flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Minhas participações ({historyItems.length})
            </h2>
            <span className="text-[10px] text-slate-500 font-bold">
              {attendanceCount} presencia(s) contabilizada(s)
            </span>
          </div>

          {historyLoading ? (
            <div className="py-4 text-center space-y-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#0B192C] mx-auto" />
              <p className="text-xs text-slate-400">Carregando histórico de participações...</p>
            </div>
          ) : historyError ? (
            <p className="text-xs text-red-600 py-3 text-center font-medium">{historyError}</p>
          ) : historyItems.length === 0 ? (
            <div className="text-center py-5 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-1">
              <p className="text-xs font-medium text-slate-600">Você ainda não possui participações registradas.</p>
              <p className="text-[10px] text-slate-400">
                Seu comparecimento em partidas concluídas é confirmado pelos organizadores.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {historyItems.map((item) => (
                <div key={item.attendanceId} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#0B192C] truncate">{item.gameTitle}</span>
                    {item.isWinner === true ? (
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-full border border-emerald-200">
                        Vitória ({item.userSetsWon}x{item.opponentSetsWon})
                      </span>
                    ) : item.isWinner === false ? (
                      <span className="text-[9px] bg-slate-200 text-slate-700 font-black px-2 py-0.5 rounded-full">
                        Derrota ({item.userSetsWon}x{item.opponentSetsWon})
                      </span>
                    ) : (
                      <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                        Participou ({item.setScoresFormatted})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {new Date(item.gameDate).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {item.gameLocation}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Role & Protected System Information Box */}
        <Card className="space-y-3 bg-slate-50">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#0B192C] flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-[#1E3A8A]" />
            Informações do Sistema
          </h2>

          <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
            <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-[#0B192C] block">Papel no aplicativo:</span>
              <p className="text-[11px]">
                Como <strong>{roleLabel}</strong>, você possui acesso {userRole === 'owner' ? 'total de proprietário e gestão de administradores' : userRole === 'admin' ? 'de administrador para gerenciamento de comunidade' : 'de jogador para visualizar partidas e confirmar presença'}.
              </p>
            </div>

            <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#0B192C] block">Classificação técnica:</span>
                <button
                  onClick={() => setShowLevelGuideModal(true)}
                  className="text-[11px] text-[#1E3A8A] font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  Ver níveis
                </button>
              </div>
              <p className="text-[11px] text-slate-600">
                {levelInfo
                  ? `Sua classificação é Nível ${levelInfo.level} (${levelInfo.name}): "${levelInfo.description}".`
                  : 'Seu nível técnico ainda não foi definido pelos organizadores.'}
              </p>
              <p className="text-[10px] text-slate-500 italic">
                A classificação é mantida pelos organizadores para garantir partidas disputadas e equilibradas.
              </p>
              {(userRole === 'owner' || userRole === 'admin') && (
                <div className="pt-1.5 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    onClick={() => navigate('/admin/niveis')}
                    icon={<Award className="w-3.5 h-3.5 text-[#1E3A8A]" />}
                    className="text-xs font-bold border-[#1E3A8A] text-[#1E3A8A] hover:bg-blue-50"
                  >
                    Gerenciar Níveis de Todos os Jogadores
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Real Logout Button */}
        <div className="pt-2">
          <Button
            variant="secondary"
            size="md"
            fullWidth
            onClick={handleLogout}
            loading={isLoggingOut}
            icon={<LogOut className="w-4 h-4 text-[#E63946]" />}
            className="bg-[#0B192C] text-white hover:bg-[#1E3A8A]"
          >
            Sair da conta
          </Button>
        </div>

        {/* Session Status Footer Notice */}
        <Alert type="info" className="text-xs">
          <div className="flex items-start gap-1.5">
            <Info className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
            <p className="text-[11px] text-blue-900">
              <strong>Sessão Autenticada:</strong> Conectado com sucesso à conta <strong>@{username}</strong> ({roleLabel}).
            </p>
          </div>
        </Alert>
      </main>

      {/* Technical Levels Guide Modal */}
      {showLevelGuideModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto p-5 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-black text-[#0B192C]">Guia dos Níveis Técnicos</h3>
              </div>
              <button
                onClick={() => setShowLevelGuideModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                A classificação é mantida pelos organizadores para promover jogos equilibrados.
              </p>

              {([1, 2, 3] as TechnicalLevelNumber[]).map((lvl) => {
                const info = TECHNICAL_LEVELS[lvl];
                const isCurrent = levelInfo?.level === lvl;

                return (
                  <div
                    key={lvl}
                    className={`p-3 rounded-xl border space-y-1 ${
                      isCurrent
                        ? 'bg-blue-50/70 border-[#1E3A8A] ring-1 ring-[#1E3A8A]'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${info.badgeBg} ${info.badgeText} ${info.badgeBorder}`}>
                          Nível {info.level}
                        </span>
                        <h4 className="font-bold text-[#0B192C]">{info.name}</h4>
                      </div>

                      {isCurrent && (
                        <span className="text-[10px] font-bold text-[#1E3A8A] bg-blue-100 px-2 py-0.5 rounded-full">
                          Seu Nível
                        </span>
                      )}
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
                onClick={() => setShowLevelGuideModal(false)}
                className="bg-[#0B192C]"
              >
                Entendi
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Photo Removal Modal */}
      {showRemoveConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xs w-full p-5 space-y-4 shadow-2xl border border-slate-200 text-center">
            <div className="p-3 bg-red-100 text-red-600 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-sm font-black text-[#0B192C]">Remover foto de perfil?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Sua foto será excluída e o perfil voltará a utilizar o avatar de iniciais.
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => setShowRemoveConfirmModal(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                fullWidth
                onClick={handleConfirmPhotoRemoval}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Remover
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
