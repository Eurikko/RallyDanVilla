import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  setDoc, 
  updateDoc, 
  runTransaction, 
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Game, GameRegistration, UserProfile } from '../types';
import { 
  notifyGamePublished, 
  notifyGameUpdated, 
  notifyGameCancelled, 
  notifySpotConfirmed 
} from './notificationService';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    operationType,
    path,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    }
  };
  console.error('Firestore Error details:', JSON.stringify(errInfo));
  throw new Error(errMessage);
}

/**
 * Helper to format ISO date to Brazilian Portuguese date & time string
 */
export function formatGameDateTime(isoString: string): { dateStr: string; timeStr: string; fullStr: string; isPast: boolean } {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) {
      return { dateStr: 'Data a definir', timeStr: '--:--', fullStr: 'Data a definir', isPast: false };
    }

    const isPast = d.getTime() < Date.now();

    const dateStr = d.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const timeStr = d.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const fullStr = `${dateStr} às ${timeStr}`;

    return { dateStr, timeStr, fullStr, isPast };
  } catch {
    return { dateStr: 'Data a definir', timeStr: '--:--', fullStr: 'Data a definir', isPast: false };
  }
}

/**
 * Fetch all upcoming/active games ordered by scheduledAt
 */
export async function getUpcomingGames(): Promise<Game[]> {
  const path = 'games';
  try {
    const gamesRef = collection(db, path);
    const q = query(gamesRef, orderBy('scheduledAt', 'asc'), limit(50));
    const snap = await getDocs(q);

    const games: Game[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const dt = formatGameDateTime(data.scheduledAt || '');
      games.push({
        id: docSnap.id,
        title: data.title || 'Jogo de Vôlei',
        scheduledAt: data.scheduledAt || new Date().toISOString(),
        date: dt.dateStr,
        time: dt.timeStr,
        location: data.location || 'Quadra Principal',
        maxPlayers: Number(data.maxPlayers) || 12,
        confirmedCount: Number(data.confirmedCount) || 0,
        notes: data.notes || '',
        description: data.notes || '',
        status: data.status || 'scheduled',
        createdBy: data.createdBy || '',
        createdAt: data.createdAt ? String(data.createdAt) : undefined,
        updatedAt: data.updatedAt ? String(data.updatedAt) : undefined,
        cancelledAt: data.cancelledAt ? String(data.cancelledAt) : undefined,
        cancelledBy: data.cancelledBy ? String(data.cancelledBy) : undefined,
      });
    });

    return games;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Fetch a single game by ID
 */
export async function getGameById(gameId: string): Promise<Game | null> {
  const path = `games/${gameId}`;
  try {
    const docSnap = await getDoc(doc(db, 'games', gameId));
    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    const dt = formatGameDateTime(data.scheduledAt || '');

    return {
      id: docSnap.id,
      title: data.title || 'Jogo de Vôlei',
      scheduledAt: data.scheduledAt || new Date().toISOString(),
      date: dt.dateStr,
      time: dt.timeStr,
      location: data.location || 'Quadra Principal',
      maxPlayers: Number(data.maxPlayers) || 12,
      confirmedCount: Number(data.confirmedCount) || 0,
      notes: data.notes || '',
      description: data.notes || '',
      status: data.status || 'scheduled',
      createdBy: data.createdBy || '',
      createdAt: data.createdAt ? String(data.createdAt) : undefined,
      updatedAt: data.updatedAt ? String(data.updatedAt) : undefined,
      cancelledAt: data.cancelledAt ? String(data.cancelledAt) : undefined,
      cancelledBy: data.cancelledBy ? String(data.cancelledBy) : undefined,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Fetch confirmed registrations for a game (only safe public player info)
 */
export async function getGameRegistrations(gameId: string): Promise<GameRegistration[]> {
  const path = 'game_registrations';
  try {
    const regsRef = collection(db, path);
    const q = query(
      regsRef,
      where('gameId', '==', gameId),
      where('status', '==', 'confirmed')
    );
    const snap = await getDocs(q);

    const regs: GameRegistration[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      regs.push({
        id: docSnap.id,
        gameId: data.gameId,
        userId: data.userId,
        username: data.username || 'Jogador',
        photoUrl: data.photoUrl || null,
        status: data.status || 'confirmed',
        confirmedAt: data.confirmedAt || '',
      });
    });

    return regs;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Get all active registrations for the logged-in user
 */
export async function getUserRegistrations(userId: string): Promise<Record<string, boolean>> {
  const path = 'game_registrations';
  try {
    const regsRef = collection(db, path);
    const q = query(
      regsRef,
      where('userId', '==', userId),
      where('status', '==', 'confirmed')
    );
    const snap = await getDocs(q);

    const map: Record<string, boolean> = {};
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.gameId) {
        map[data.gameId] = true;
      }
    });

    return map;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Create a new game (Owner / Admin only)
 */
export async function createGame(
  gameData: {
    title: string;
    scheduledAt: string;
    location: string;
    maxPlayers: number;
    notes?: string;
  },
  currentUser: UserProfile
): Promise<string> {
  if (currentUser.status !== 'active') {
    throw new Error('Sua conta não pode realizar esta operação.');
  }

  if (currentUser.role !== 'owner' && currentUser.role !== 'admin') {
    throw new Error('Você não possui permissão para realizar esta ação.');
  }

  const title = gameData.title.trim();
  if (title.length < 3 || title.length > 80) {
    throw new Error('O título do jogo deve ter entre 3 e 80 caracteres.');
  }

  const location = gameData.location.trim();
  if (location.length < 2 || location.length > 120) {
    throw new Error('O local deve ter entre 2 e 120 caracteres.');
  }

  const notes = (gameData.notes || '').trim();
  if (notes.length > 500) {
    throw new Error('As observações não podem exceder 500 caracteres.');
  }

  const maxPlayers = Number(gameData.maxPlayers);
  if (isNaN(maxPlayers) || maxPlayers < 4 || maxPlayers > 30) {
    throw new Error('A capacidade deve ser entre 4 e 30 jogadores.');
  }

  const scheduledDate = new Date(gameData.scheduledAt);
  if (isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now()) {
    throw new Error('A data e horário do jogo devem ser no futuro.');
  }

  const gameId = 'game_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const path = `games/${gameId}`;

  try {
    const newDoc = {
      title,
      scheduledAt: scheduledDate.toISOString(),
      location,
      maxPlayers,
      confirmedCount: 0,
      notes,
      status: 'scheduled',
      createdBy: currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'games', gameId), newDoc);

    // Trigger notification to active community members
    notifyGamePublished(gameId, title, scheduledDate.toISOString()).catch((err) =>
      console.warn('[gameService] Notification trigger error:', err)
    );

    return gameId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Edit an existing game (Owner / Admin only)
 */
export async function updateGame(
  gameId: string,
  gameData: {
    title: string;
    scheduledAt: string;
    location: string;
    maxPlayers: number;
    notes?: string;
  },
  currentUser: UserProfile
): Promise<void> {
  if (currentUser.status !== 'active') {
    throw new Error('Sua conta não pode realizar esta operação.');
  }

  if (currentUser.role !== 'owner' && currentUser.role !== 'admin') {
    throw new Error('Você não possui permissão para realizar esta ação.');
  }

  const title = gameData.title.trim();
  if (title.length < 3 || title.length > 80) {
    throw new Error('O título do jogo deve ter entre 3 e 80 caracteres.');
  }

  const location = gameData.location.trim();
  if (location.length < 2 || location.length > 120) {
    throw new Error('O local deve ter entre 2 e 120 caracteres.');
  }

  const notes = (gameData.notes || '').trim();
  if (notes.length > 500) {
    throw new Error('As observações não podem exceder 500 caracteres.');
  }

  const maxPlayers = Number(gameData.maxPlayers);
  if (isNaN(maxPlayers) || maxPlayers < 4 || maxPlayers > 30) {
    throw new Error('A capacidade deve ser entre 4 e 30 jogadores.');
  }

  const scheduledDate = new Date(gameData.scheduledAt);
  if (isNaN(scheduledDate.getTime())) {
    throw new Error('A data e horário do jogo são inválidos.');
  }

  const path = `games/${gameId}`;

  try {
    const gameSnap = await getDoc(doc(db, 'games', gameId));
    if (!gameSnap.exists()) {
      throw new Error('Jogo não encontrado.');
    }

    const currentData = gameSnap.data();
    if (currentData.status === 'cancelled') {
      throw new Error('Não é possível editar um jogo cancelado.');
    }

    const currentConfirmed = Number(currentData.confirmedCount) || 0;
    if (maxPlayers < currentConfirmed) {
      throw new Error('A capacidade não pode ser menor que o número de jogadores confirmados.');
    }

    await updateDoc(doc(db, 'games', gameId), {
      title,
      scheduledAt: scheduledDate.toISOString(),
      location,
      maxPlayers,
      notes,
      updatedAt: serverTimestamp(),
    });

    notifyGameUpdated(gameId, title).catch((err) =>
      console.warn('[gameService] notifyGameUpdated error:', err)
    );
  } catch (error) {
    if (error instanceof Error && (error.message.includes('A capacidade') || error.message.includes('não pode') || error.message.includes('no futuro'))) {
      throw error;
    }
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Cancel a game (Owner / Admin only)
 */
export async function cancelGame(gameId: string, currentUser: UserProfile): Promise<void> {
  if (currentUser.status !== 'active') {
    throw new Error('Sua conta não pode realizar esta operação.');
  }

  if (currentUser.role !== 'owner' && currentUser.role !== 'admin') {
    throw new Error('Você não possui permissão para realizar esta ação.');
  }

  const path = `games/${gameId}`;

  try {
    const gameSnap = await getDoc(doc(db, 'games', gameId));
    if (!gameSnap.exists()) {
      throw new Error('Jogo não encontrado.');
    }

    const currentData = gameSnap.data();
    if (currentData.status === 'cancelled') {
      return; // Already cancelled
    }

    await updateDoc(doc(db, 'games', gameId), {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancelledBy: currentUser.uid,
      updatedAt: serverTimestamp(),
    });

    notifyGameCancelled(gameId, currentData.title || 'Jogo de Vôlei').catch((err) =>
      console.warn('[gameService] notifyGameCancelled error:', err)
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Confirm user's own presence (Atomic transaction to enforce limit and prevent overbooking)
 * IMPORTANT: Does NOT increment profiles.attendanceCount!
 */
export async function confirmPresence(gameId: string, currentUser: UserProfile): Promise<void> {
  if (currentUser.status !== 'active') {
    throw new Error('Sua conta não pode realizar esta operação.');
  }

  const userId = currentUser.uid;
  const registrationDocId = `${gameId}_${userId}`;
  const gameRef = doc(db, 'games', gameId);
  const regRef = doc(db, 'game_registrations', registrationDocId);

  try {
    await runTransaction(db, async (transaction) => {
      const gameSnap = await transaction.get(gameRef);
      if (!gameSnap.exists()) {
        throw new Error('Jogo não encontrado.');
      }

      const gameData = gameSnap.data();

      if (gameData.status === 'cancelled') {
        throw new Error('Não é possível confirmar presença em um jogo cancelado.');
      }

      if (gameData.status !== 'scheduled') {
        throw new Error('Não é possível confirmar presença neste jogo.');
      }

      const scheduledTime = new Date(gameData.scheduledAt).getTime();
      if (scheduledTime <= Date.now()) {
        throw new Error('O período de confirmação deste jogo terminou.');
      }

      const regSnap = await transaction.get(regRef);
      const isAlreadyConfirmed = regSnap.exists() && regSnap.data().status === 'confirmed';

      if (isAlreadyConfirmed) {
        return; // Already confirmed
      }

      const confirmedCount = Number(gameData.confirmedCount) || 0;
      const maxPlayers = Number(gameData.maxPlayers) || 12;

      if (confirmedCount >= maxPlayers) {
        throw new Error('O jogo acabou de ficar lotado.');
      }

      // 1. Write or update registration doc
      transaction.set(
        regRef,
        {
          id: registrationDocId,
          gameId,
          userId,
          username: currentUser.username,
          photoUrl: currentUser.photoUrl || null,
          status: 'confirmed',
          confirmedAt: new Date().toISOString(),
          updatedAt: serverTimestamp(),
          createdAt: regSnap.exists() ? regSnap.data().createdAt : serverTimestamp(),
        },
        { merge: true }
      );

      // 2. Increment confirmedCount on game doc
      transaction.update(gameRef, {
        confirmedCount: confirmedCount + 1,
        updatedAt: serverTimestamp(),
      });
    });

    // Notify user of confirmed spot
    notifySpotConfirmed(userId, gameId, 'Jogo de Vôlei').catch((err) =>
      console.warn('[gameService] notifySpotConfirmed error:', err)
    );
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('lotado') ||
        error.message.includes('cancelado') ||
        error.message.includes('terminou') ||
        error.message.includes('Sua conta'))
    ) {
      throw error;
    }
    handleFirestoreError(error, OperationType.WRITE, `games/${gameId}`);
  }
}

/**
 * Cancel user's own presence (Atomic transaction to release slot)
 * IMPORTANT: Does NOT modify profiles.attendanceCount!
 */
export async function cancelPresence(gameId: string, currentUser: UserProfile): Promise<void> {
  if (currentUser.status !== 'active') {
    throw new Error('Sua conta não pode realizar esta operação.');
  }

  const userId = currentUser.uid;
  const registrationDocId = `${gameId}_${userId}`;
  const gameRef = doc(db, 'games', gameId);
  const regRef = doc(db, 'game_registrations', registrationDocId);

  try {
    await runTransaction(db, async (transaction) => {
      const regSnap = await transaction.get(regRef);
      if (!regSnap.exists()) {
        return; // No registration exists
      }

      const regData = regSnap.data();
      if (regData.status !== 'confirmed') {
        return; // Already cancelled or not confirmed
      }

      const gameSnap = await transaction.get(gameRef);

      // 1. Update registration status to cancelled
      transaction.update(regRef, {
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      });

      // 2. Decrement confirmedCount on game if game document exists
      if (gameSnap.exists()) {
        const gameData = gameSnap.data();
        const currentCount = Number(gameData.confirmedCount) || 0;
        transaction.update(gameRef, {
          confirmedCount: Math.max(0, currentCount - 1),
          updatedAt: serverTimestamp(),
        });
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `game_registrations/${registrationDocId}`);
  }
}

/**
 * Fetch all user profiles safely for Owner/Admin directory (No passwords/tokens exposed)
 */
export async function getAllUserProfiles(currentUser: UserProfile): Promise<UserProfile[]> {
  if (currentUser.role !== 'owner' && currentUser.role !== 'admin') {
    throw new Error('Você não possui permissão para visualizar a relação de jogadores.');
  }

  const path = 'profiles';
  try {
    const profilesRef = collection(db, path);
    const snap = await getDocs(query(profilesRef, limit(200)));

    const profiles: UserProfile[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      profiles.push({
        uid: docSnap.id,
        username: data.username || '',
        usernameNormalized: data.usernameNormalized || (data.username || '').toLowerCase(),
        displayName: data.displayName || null,
        role: data.role || 'player',
        status: data.status || 'active',
        technicalLevel: data.technicalLevel ?? null,
        attendanceCount: Number(data.attendanceCount) || 0,
        photoUrl: data.photoUrl || null,
        createdAt: data.createdAt ? (typeof data.createdAt?.toDate === 'function' ? data.createdAt.toDate().toISOString() : String(data.createdAt)) : undefined,
      });
    });

    return profiles;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Include a registered player in a game administratively (Owner / Admin only)
 * Handles full capacity (waiting_list), duplicate prevention, and account status checks.
 */
export async function adminAddPlayerToGame(
  gameId: string,
  targetUserId: string,
  currentUser: UserProfile
): Promise<{ status: 'confirmed' | 'waiting_list'; message: string }> {
  if (currentUser.status !== 'active') {
    throw new Error('Sua conta não pode realizar esta operação.');
  }

  if (currentUser.role !== 'owner' && currentUser.role !== 'admin') {
    throw new Error('Você não possui permissão para realizar esta ação.');
  }

  // 1. Fetch target user profile
  const targetDocSnap = await getDoc(doc(db, 'profiles', targetUserId));
  if (!targetDocSnap.exists()) {
    throw new Error('Jogador não encontrado.');
  }

  const targetData = targetDocSnap.data();
  if (targetData.status !== 'active') {
    throw new Error('Não é possível adicionar uma conta desativada.');
  }

  const gameRef = doc(db, 'games', gameId);
  const registrationDocId = `${gameId}_${targetUserId}`;
  const regRef = doc(db, 'game_registrations', registrationDocId);

  let resultStatus: 'confirmed' | 'waiting_list' = 'confirmed';
  let resultMsg = 'Jogador adicionado com sucesso como confirmado.';

  try {
    await runTransaction(db, async (transaction) => {
      const gameSnap = await transaction.get(gameRef);
      if (!gameSnap.exists()) {
        throw new Error('Jogo não encontrado.');
      }

      const gameData = gameSnap.data();
      const gStatus = gameData.status;
      if (gStatus === 'cancelled' || gStatus === 'completed' || gStatus === 'cancelado' || gStatus === 'concluido') {
        throw new Error('Não é possível adicionar jogadores a uma partida cancelada ou finalizada.');
      }

      const regSnap = await transaction.get(regRef);
      if (regSnap.exists()) {
        const regStatus = regSnap.data().status;
        if (regStatus === 'confirmed') {
          throw new Error('Este jogador já está confirmado nesta partida.');
        }
        if (regStatus === 'waiting_list') {
          throw new Error('Este jogador já está na lista de espera desta partida.');
        }
      }

      const confirmedCount = Number(gameData.confirmedCount) || 0;
      const maxPlayers = Number(gameData.maxPlayers) || 12;

      const playerDisplayName = targetData.displayName
        ? `${targetData.displayName} (@${targetData.username})`
        : targetData.username;

      if (confirmedCount < maxPlayers) {
        resultStatus = 'confirmed';
        resultMsg = 'Jogador adicionado com sucesso como confirmado.';

        transaction.set(
          regRef,
          {
            id: registrationDocId,
            gameId,
            userId: targetUserId,
            username: playerDisplayName,
            photoUrl: targetData.photoUrl || null,
            status: 'confirmed',
            confirmedAt: new Date().toISOString(),
            addedBy: currentUser.uid,
            updatedAt: serverTimestamp(),
            createdAt: regSnap.exists() ? regSnap.data().createdAt : serverTimestamp(),
          },
          { merge: true }
        );

        transaction.update(gameRef, {
          confirmedCount: confirmedCount + 1,
          updatedAt: serverTimestamp(),
        });
      } else {
        resultStatus = 'waiting_list';
        resultMsg = 'Partida lotada. Jogador adicionado à lista de espera.';

        transaction.set(
          regRef,
          {
            id: registrationDocId,
            gameId,
            userId: targetUserId,
            username: playerDisplayName,
            photoUrl: targetData.photoUrl || null,
            status: 'waiting_list',
            addedAt: new Date().toISOString(),
            addedBy: currentUser.uid,
            updatedAt: serverTimestamp(),
            createdAt: regSnap.exists() ? regSnap.data().createdAt : serverTimestamp(),
          },
          { merge: true }
        );
      }
    });

    return { status: resultStatus, message: resultMsg };
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('desativada') ||
        error.message.includes('confirmado') ||
        error.message.includes('espera') ||
        error.message.includes('cancelada') ||
        error.message.includes('encontrado'))
    ) {
      throw error;
    }
    handleFirestoreError(error, OperationType.WRITE, `game_registrations/${registrationDocId}`);
  }
}

