import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  query, 
  where, 
  limit, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { GuestPlayer } from '../types';
import { verifyAdminOrOwner } from './technicalLevelService';
import { parseTechnicalLevel } from './technicalLevel';

/**
 * Normalizes guest display name for search and similarity checks
 */
export function normalizeGuestName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '');
}

/**
 * Checks if a guest with a similar normalized name already exists
 */
export async function checkSimilarGuestNames(name: string): Promise<GuestPlayer[]> {
  const norm = normalizeGuestName(name);
  if (!norm || norm.length < 2) return [];

  try {
    const guestsRef = collection(db, 'guest_players');
    const q = query(guestsRef, where('status', '==', 'active'), limit(50));
    const snap = await getDocs(q);

    const matches: GuestPlayer[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const existingNorm = data.displayNameNormalized || normalizeGuestName(data.displayName || '');
      
      // Exact or partial match on normalized name
      if (existingNorm === norm || existingNorm.includes(norm) || norm.includes(existingNorm)) {
        matches.push({
          id: docSnap.id,
          displayName: data.displayName,
          displayNameNormalized: existingNorm,
          nickname: data.nickname || null,
          technicalLevel: parseTechnicalLevel(data.technicalLevel),
          status: data.status || 'active',
          createdBy: data.createdBy,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      }
    });

    return matches;
  } catch (err) {
    console.error('[guestPlayerService] checkSimilarGuestNames error:', err);
    return [];
  }
}

/**
 * Gets active guest players, with optional search filter
 */
export async function getGuestPlayers(params: {
  requestorUid: string;
  searchTerm?: string;
  includeInactive?: boolean;
  maxResults?: number;
}): Promise<GuestPlayer[]> {
  const { requestorUid, searchTerm = '', includeInactive = false, maxResults = 30 } = params;

  // Authorization check
  const authCheck = await verifyAdminOrOwner(requestorUid);
  if (!authCheck.isAllowed) {
    throw new Error('Você não possui permissão para gerenciar jogadores convidados.');
  }

  try {
    const guestsRef = collection(db, 'guest_players');
    let q = query(guestsRef, limit(100));

    if (!includeInactive) {
      q = query(guestsRef, where('status', '==', 'active'), limit(100));
    }

    const snap = await getDocs(q);
    const results: GuestPlayer[] = [];
    const searchNorm = normalizeGuestName(searchTerm);

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const dispName = data.displayName || 'Convidado';
      const dispNorm = data.displayNameNormalized || normalizeGuestName(dispName);

      if (searchNorm && !dispNorm.includes(searchNorm)) {
        return;
      }

      results.push({
        id: docSnap.id,
        displayName: dispName,
        displayNameNormalized: dispNorm,
        nickname: data.nickname || null,
        technicalLevel: parseTechnicalLevel(data.technicalLevel),
        status: data.status || 'active',
        createdBy: data.createdBy,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });

    return results.slice(0, maxResults);
  } catch (err: any) {
    console.error('[guestPlayerService] getGuestPlayers error:', err);
    throw new Error('Não foi possível carregar a lista de jogadores convidados.');
  }
}

/**
 * Creates a new guest player
 */
export async function createGuestPlayer(params: {
  requestorUid: string;
  displayName: string;
  nickname?: string;
  technicalLevel?: number | null;
}): Promise<GuestPlayer> {
  const { requestorUid, displayName, nickname = '', technicalLevel = null } = params;

  // 1. Authorization Check
  const authCheck = await verifyAdminOrOwner(requestorUid);
  if (!authCheck.isAllowed) {
    throw new Error('Você não possui permissão para criar jogadores convidados.');
  }

  // 2. Name validation
  const cleanName = displayName.trim();
  if (!cleanName || cleanName.length < 2 || cleanName.length > 50) {
    throw new Error('Informe um nome válido para o jogador convidado (entre 2 e 50 caracteres).');
  }

  // 3. Technical Level validation
  const parsedLevel = parseTechnicalLevel(technicalLevel);

  // 4. Create document in Firestore
  const norm = normalizeGuestName(cleanName);
  const nowIso = new Date().toISOString();

  const newDoc = {
    displayName: cleanName,
    displayNameNormalized: norm,
    nickname: nickname.trim() || null,
    technicalLevel: parsedLevel,
    status: 'active' as const,
    createdBy: requestorUid,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const guestsRef = collection(db, 'guest_players');
  const docRef = await addDoc(guestsRef, newDoc);

  return {
    id: docRef.id,
    ...newDoc,
  };
}

/**
 * Updates an existing guest player's details
 */
export async function updateGuestPlayer(params: {
  requestorUid: string;
  guestId: string;
  displayName?: string;
  nickname?: string;
  technicalLevel?: number | null;
  status?: 'active' | 'inactive';
}): Promise<void> {
  const { requestorUid, guestId, displayName, nickname, technicalLevel, status } = params;

  const authCheck = await verifyAdminOrOwner(requestorUid);
  if (!authCheck.isAllowed) {
    throw new Error('Você não possui permissão para editar jogadores convidados.');
  }

  const guestRef = doc(db, 'guest_players', guestId);
  const guestSnap = await getDoc(guestRef);
  if (!guestSnap.exists()) {
    throw new Error('Jogador convidado não encontrado.');
  }

  const updates: Record<string, any> = {
    updatedAt: new Date().toISOString(),
  };

  if (displayName !== undefined) {
    const cleanName = displayName.trim();
    if (!cleanName || cleanName.length < 2 || cleanName.length > 50) {
      throw new Error('Informe um nome válido para o jogador convidado.');
    }
    updates.displayName = cleanName;
    updates.displayNameNormalized = normalizeGuestName(cleanName);
  }

  if (nickname !== undefined) {
    updates.nickname = nickname.trim() || null;
  }

  if (technicalLevel !== undefined) {
    updates.technicalLevel = parseTechnicalLevel(technicalLevel);
  }

  if (status !== undefined) {
    updates.status = status;
  }

  await setDoc(guestRef, updates, { merge: true });
}

/**
 * Deactivates a guest player (preserves match history)
 */
export async function deactivateGuestPlayer(requestorUid: string, guestId: string): Promise<void> {
  return updateGuestPlayer({
    requestorUid,
    guestId,
    status: 'inactive',
  });
}
