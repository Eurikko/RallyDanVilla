/**
 * RallyNaVila Domain Types
 */

export type UserRole = 'owner' | 'admin' | 'player';

export type TechnicalLevel = 
  | 1 
  | 2 
  | 3 
  | 'nao_classificado'
  | 'iniciante'
  | 'intermediario'
  | 'avancado'
  | number
  | null;

export type AttendanceStatus = 'pending' | 'present' | 'absent';
export type MatchAttendanceFinalStatus = 'pending' | 'finalized' | 'corrected';

export interface MatchAttendanceRecord {
  id: string;
  matchId: string;
  matchParticipantId: string;
  profileId: string | null;
  guestPlayerId: string | null;
  attendanceStatus: AttendanceStatus;
  markedBy: string;
  markedAt: string;
  finalizedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttendanceAdjustment {
  id: string;
  matchAttendanceId: string;
  matchId: string;
  profileId: string | null;
  previousStatus: AttendanceStatus;
  newStatus: AttendanceStatus;
  reason: string;
  changedBy: string;
  clientActionId: string;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  username: string;
  usernameNormalized: string;
  displayName?: string | null;
  role: UserRole;
  status: 'active' | 'suspended' | 'inactive';
  technicalLevel: TechnicalLevel | null;
  technicalLevelUpdatedAt?: string | number | any;
  technicalLevelUpdatedBy?: string | null;
  attendanceCount: number;
  photoUrl: string | null;
  avatarUpdatedAt?: string | number | any;
  createdAt?: string | number | any;
  updatedAt?: string | number | any;
}

export interface TechnicalLevelHistory {
  id: string;
  profileId: string;
  previousLevel: number | null;
  newLevel: number | null;
  changedBy: string;
  changedAt: string | number | any;
}

export type GameStatus = 'scheduled' | 'cancelled' | 'completed' | 'agendado' | 'em_andamento' | 'concluido' | 'cancelado';

export type RegistrationStatus = 'confirmed' | 'cancelled' | 'confirmado' | 'ausente';

export interface GameRegistration {
  id: string;
  gameId: string;
  userId: string;
  username: string;
  photoUrl?: string | null;
  status: 'confirmed' | 'cancelled';
  confirmedAt?: string;
  cancelledAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Game {
  id: string;
  title: string;
  scheduledAt: string; // ISO String or Date
  date?: string; // Formatted date string for display
  time?: string; // Formatted time string for display
  location: string;
  maxPlayers: number;
  confirmedCount: number;
  notes?: string;
  description?: string;
  status: GameStatus;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
  cancelledAt?: string;
  cancelledBy?: string;
}

export interface Team {
  id: string;
  gameId: string;
  name: string;
  color: 'azul' | 'vermelho' | 'amarelo' | 'verde';
  playerNames: string[];
}

export interface Score {
  id: string;
  gameId: string;
  teamA: {
    name: string;
    color: string;
    sets: number;
    pointsCurrentSet: number;
  };
  teamB: {
    name: string;
    color: string;
    sets: number;
    pointsCurrentSet: number;
  };
  isFinished: boolean;
  statusText: string;
}

export interface CommunityRule {
  id: string;
  title: string;
  category: 'Geral' | 'Pontuação' | 'Faltas' | 'Etiqueta';
  summary: string;
  description: string;
}

export interface GuestPlayer {
  id: string;
  displayName: string;
  displayNameNormalized: string;
  nickname?: string | null;
  technicalLevel: number | null;
  status: 'active' | 'inactive';
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export type MatchFormat = 'single_set' | 'best_of_3' | 'best_of_5';
export type MatchStatus = 'draft' | 'ready' | 'live' | 'finished' | 'cancelled';

export interface MatchSession {
  id: string;
  gameId: string;
  status: MatchStatus;
  format: MatchFormat;
  teamAName: string;
  teamBName: string;
  currentSetNumber: number;
  teamASetsWon: number;
  teamBSetsWon: number;
  winnerTeam: 1 | 2 | null;
  createdBy: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  attendanceStatus?: MatchAttendanceFinalStatus;
  attendanceFinalizedBy?: string | null;
  attendanceFinalizedAt?: string | null;
  attendanceClientActionId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface MatchParticipant {
  id: string;
  matchId: string;
  profileId: string | null;
  guestPlayerId: string | null;
  displayName: string;
  isGuest: boolean;
  teamNumber: 1 | 2 | null;
  technicalLevelSnapshot: number;
  isProvisionalLevel: boolean;
  isConfirmed: boolean;
  addedBy: string;
  createdAt?: string;
}

export interface MatchSet {
  id: string;
  matchId: string;
  setNumber: number;
  teamAScore: number;
  teamBScore: number;
  targetScore: number;
  status: 'pending' | 'in_progress' | 'completed';
  winnerTeam: 1 | 2 | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  createdAt?: string;
}

export interface MatchScoreEvent {
  id: string;
  matchId: string;
  setId: string;
  setNumber: number;
  teamNumber: 1 | 2;
  eventType: 'point' | 'undo';
  clientActionId: string;
  reversedEventId?: string | null;
  teamAScoreAfter: number;
  teamBScoreAfter: number;
  createdBy: string;
  createdAt?: string;
}

export type NotificationType = 
  | 'game_published' 
  | 'game_updated' 
  | 'game_cancelled' 
  | 'spot_confirmed' 
  | 'lineup_selected' 
  | 'game_completed' 
  | 'attendance_recorded';

export interface InternalNotification {
  id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  gameId?: string | null;
  matchId?: string | null;
  createdAt: string;
  readAt?: string | null;
}

