import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { InternalNotification, NotificationType } from '../types';

/**
 * Creates a persistent notification for a specific user.
 * Cannot be called with arbitrary user or data from untrusted client input.
 */
export async function sendNotification(params: {
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  gameId?: string | null;
  matchId?: string | null;
}): Promise<void> {
  const { recipientId, type, title, message, gameId = null, matchId = null } = params;
  if (!recipientId) return;

  try {
    const notifRef = doc(collection(db, 'notifications'));
    const nowIso = new Date().toISOString();

    await setDoc(notifRef, {
      id: notifRef.id,
      recipientId,
      type,
      title,
      message,
      read: false,
      gameId: gameId || null,
      matchId: matchId || null,
      createdAt: nowIso,
      readAt: null,
    });
  } catch (err) {
    console.warn('[notificationService] Failed to send notification:', err);
  }
}

/**
 * Sends a notification to multiple recipients (e.g. all confirmed players)
 */
export async function sendNotificationToMultipleUsers(params: {
  recipientIds: string[];
  type: NotificationType;
  title: string;
  message: string;
  gameId?: string | null;
  matchId?: string | null;
}): Promise<void> {
  const { recipientIds, type, title, message, gameId = null, matchId = null } = params;
  const uniqueIds = Array.from(new Set(recipientIds)).filter(Boolean);
  if (uniqueIds.length === 0) return;

  try {
    const batch = writeBatch(db);
    const nowIso = new Date().toISOString();

    for (const recipientId of uniqueIds) {
      const notifRef = doc(collection(db, 'notifications'));
      batch.set(notifRef, {
        id: notifRef.id,
        recipientId,
        type,
        title,
        message,
        read: false,
        gameId: gameId || null,
        matchId: matchId || null,
        createdAt: nowIso,
        readAt: null,
      });
    }

    await batch.commit();
  } catch (err) {
    console.warn('[notificationService] Failed to send batch notifications:', err);
  }
}

/**
 * Subscribes to real-time notifications for a specific user
 */
export function subscribeToUserNotifications(
  recipientId: string,
  onUpdate: (notifications: InternalNotification[], unreadCount: number) => void
): () => void {
  if (!recipientId) {
    onUpdate([], 0);
    return () => {};
  }

  const notifRef = collection(db, 'notifications');
  const q = query(
    notifRef,
    where('recipientId', '==', recipientId)
  );

  return onSnapshot(q, (snap) => {
    const list: InternalNotification[] = [];
    let unread = 0;

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const isRead = Boolean(data.read);
      if (!isRead) unread++;

      list.push({
        id: docSnap.id,
        recipientId: data.recipientId,
        type: data.type || 'game_published',
        title: data.title || 'Aviso da Vila',
        message: data.message || '',
        read: isRead,
        gameId: data.gameId || null,
        matchId: data.matchId || null,
        createdAt: data.createdAt || new Date().toISOString(),
        readAt: data.readAt || null,
      });
    });

    // Client-side sort by createdAt descending
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    onUpdate(list, unread);
  }, (err) => {
    console.warn('[notificationService] Subscription notice:', err);
  });
}

/**
 * Marks a single notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  if (!notificationId) return;

  try {
    const notifRef = doc(db, 'notifications', notificationId);
    await updateDoc(notifRef, {
      read: true,
      readAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[notificationService] Failed to mark notification as read:', err);
  }
}

/**
 * Marks all notifications for a given user as read
 */
export async function markAllNotificationsAsRead(recipientId: string): Promise<void> {
  if (!recipientId) return;

  try {
    const notifRef = collection(db, 'notifications');
    const q = query(
      notifRef,
      where('recipientId', '==', recipientId),
      where('read', '==', false)
    );

    const snap = await getDocs(q);
    if (snap.empty) return;

    const batch = writeBatch(db);
    const nowIso = new Date().toISOString();

    snap.forEach((docSnap) => {
      batch.update(docSnap.ref, {
        read: true,
        readAt: nowIso,
      });
    });

    await batch.commit();
  } catch (err) {
    console.error('[notificationService] Failed to mark all notifications as read:', err);
  }
}

/**
 * Event Trigger Helper: Game Published
 * Notifies all active players in the community that a new game has been scheduled.
 */
export async function notifyGamePublished(gameId: string, gameTitle: string, scheduledAt: string): Promise<void> {
  try {
    const profilesSnap = await getDocs(query(collection(db, 'profiles'), where('status', '==', 'active')));
    const activeUids: string[] = [];

    profilesSnap.forEach((d) => {
      activeUids.push(d.id);
    });

    if (activeUids.length === 0) return;

    const dt = new Date(scheduledAt);
    const formattedDate = !isNaN(dt.getTime())
      ? dt.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }) + ' às ' + dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : 'em breve';

    await sendNotificationToMultipleUsers({
      recipientIds: activeUids,
      type: 'game_published',
      title: 'Novo jogo agendado! 🏐',
      message: `O jogo "${gameTitle}" foi publicado para ${formattedDate}. Garanta sua vaga!`,
      gameId,
    });
  } catch (err) {
    console.warn('[notificationService] notifyGamePublished error:', err);
  }
}

/**
 * Event Trigger Helper: Game Updated
 * Notifies all confirmed players that game details (time, location, etc.) were updated.
 */
export async function notifyGameUpdated(gameId: string, gameTitle: string): Promise<void> {
  try {
    const regsSnap = await getDocs(
      query(collection(db, 'game_registrations'), where('gameId', '==', gameId), where('status', '==', 'confirmed'))
    );
    const confirmedUids: string[] = [];

    regsSnap.forEach((d) => {
      const data = d.data();
      if (data.userId) confirmedUids.push(data.userId);
    });

    if (confirmedUids.length === 0) return;

    await sendNotificationToMultipleUsers({
      recipientIds: confirmedUids,
      type: 'game_updated',
      title: 'Jogo atualizado ℹ️',
      message: `Os detalhes da partida "${gameTitle}" foram atualizados pela organização.`,
      gameId,
    });
  } catch (err) {
    console.warn('[notificationService] notifyGameUpdated error:', err);
  }
}

/**
 * Event Trigger Helper: Game Cancelled
 * Notifies all confirmed players that the game has been cancelled.
 */
export async function notifyGameCancelled(gameId: string, gameTitle: string): Promise<void> {
  try {
    const regsSnap = await getDocs(
      query(collection(db, 'game_registrations'), where('gameId', '==', gameId), where('status', '==', 'confirmed'))
    );
    const confirmedUids: string[] = [];

    regsSnap.forEach((d) => {
      const data = d.data();
      if (data.userId) confirmedUids.push(data.userId);
    });

    if (confirmedUids.length === 0) return;

    await sendNotificationToMultipleUsers({
      recipientIds: confirmedUids,
      type: 'game_cancelled',
      title: 'Jogo cancelado ❌',
      message: `A partida "${gameTitle}" foi cancelada pelos organizadores.`,
      gameId,
    });
  } catch (err) {
    console.warn('[notificationService] notifyGameCancelled error:', err);
  }
}

/**
 * Event Trigger Helper: Spot Confirmed
 * Notifies a user when their spot in a game is confirmed.
 */
export async function notifySpotConfirmed(userId: string, gameId: string, gameTitle: string): Promise<void> {
  await sendNotification({
    recipientId: userId,
    type: 'spot_confirmed',
    title: 'Vaga confirmada! ✅',
    message: `Sua vaga para o jogo "${gameTitle}" foi confirmada com sucesso!`,
    gameId,
  });
}

/**
 * Event Trigger Helper: Lineup Selected / Team Escalation
 * Notifies a user when they are added to a match lineup.
 */
export async function notifyLineupSelected(userId: string, matchId: string, gameTitle: string): Promise<void> {
  await sendNotification({
    recipientId: userId,
    type: 'lineup_selected',
    title: 'Você foi escalado! 📋',
    message: `Sua presença foi selecionada na escalação oficial de "${gameTitle}".`,
    matchId,
  });
}

/**
 * Event Trigger Helper: Game/Match Completed
 * Notifies participants that the match has been completed and final scores recorded.
 */
export async function notifyGameCompleted(matchId: string, gameTitle: string, winnerText?: string): Promise<void> {
  try {
    const partsSnap = await getDocs(
      query(collection(db, 'match_participants'), where('matchId', '==', matchId))
    );
    const recipientIds: string[] = [];

    partsSnap.forEach((d) => {
      const data = d.data();
      if (data.profileId && !data.isGuest) {
        recipientIds.push(data.profileId);
      }
    });

    if (recipientIds.length === 0) return;

    const message = winnerText 
      ? `A partida "${gameTitle}" foi encerrada. ${winnerText}.` 
      : `A partida "${gameTitle}" foi encerrada. Confira o placar final!`;

    await sendNotificationToMultipleUsers({
      recipientIds,
      type: 'game_completed',
      title: 'Partida finalizada! 🏆',
      message,
      matchId,
    });
  } catch (err) {
    console.warn('[notificationService] notifyGameCompleted error:', err);
  }
}

/**
 * Event Trigger Helper: Attendance Recorded / Finalized
 * Notifies participants that their attendance was recorded.
 */
export async function notifyAttendanceRecorded(
  recipientIds: string[], 
  gameTitle: string
): Promise<void> {
  if (recipientIds.length === 0) return;

  await sendNotificationToMultipleUsers({
    recipientIds,
    type: 'attendance_recorded',
    title: 'Comparecimento registrado 📝',
    message: `Seu histórico de presença em "${gameTitle}" foi contabilizado pela organização.`,
  });
}
