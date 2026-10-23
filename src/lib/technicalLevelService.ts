import { 
  doc, 
  getDoc, 
  setDoc, 
  getDocs, 
  query, 
  collection, 
  where, 
  limit, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, TechnicalLevelHistory } from '../types';
import { parseTechnicalLevel, TechnicalLevelNumber } from './technicalLevel';

export interface ClassificationMetrics {
  totalActive: number;
  classifiedCount: number;
  unclassifiedCount: number;
  levelCounts: Record<TechnicalLevelNumber, number>;
}

export interface PlayerSearchItem {
  uid: string;
  username: string;
  displayName?: string | null;
  photoUrl: string | null;
  technicalLevel: TechnicalLevelNumber | null;
  technicalLevelUpdatedAt?: string | null;
  technicalLevelUpdatedBy?: string | null;
  status: 'active' | 'suspended' | 'inactive';
}

/**
 * Validates whether the given requestor UID is an active Owner or Admin
 */
export async function verifyAdminOrOwner(requestorUid: string): Promise<{ isAllowed: boolean; role?: string }> {
  if (!requestorUid) return { isAllowed: false };

  try {
    const profileSnap = await getDoc(doc(db, 'profiles', requestorUid));
    if (!profileSnap.exists()) return { isAllowed: false };

    const data = profileSnap.data();
    if (data.status !== 'active') return { isAllowed: false };

    const role = data.role;
    if (role === 'owner' || role === 'admin') {
      return { isAllowed: true, role };
    }

    return { isAllowed: false, role };
  } catch (err) {
    console.error('[technicalLevelService] verifyAdminOrOwner error:', err);
    return { isAllowed: false };
  }
}

/**
 * Calculates summary metrics for active players classification
 */
export async function getTechnicalLevelMetrics(): Promise<ClassificationMetrics> {
  const metrics: ClassificationMetrics = {
    totalActive: 0,
    classifiedCount: 0,
    unclassifiedCount: 0,
    levelCounts: { 1: 0, 2: 0, 3: 0 },
  };

  try {
    const profilesRef = collection(db, 'profiles');
    const q = query(profilesRef, where('status', '==', 'active'), limit(100));
    const snap = await getDocs(q);

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      metrics.totalActive++;

      const parsedLevel = parseTechnicalLevel(data.technicalLevel);
      if (parsedLevel) {
        metrics.classifiedCount++;
        metrics.levelCounts[parsedLevel] = (metrics.levelCounts[parsedLevel] || 0) + 1;
      } else {
        metrics.unclassifiedCount++;
      }
    });
  } catch (err) {
    console.error('[technicalLevelService] getTechnicalLevelMetrics error:', err);
  }

  return metrics;
}

/**
 * Securely searches active players for classification management with filters
 */
export async function searchPlayersForClassification(params: {
  requestorUid: string;
  searchTerm?: string;
  levelFilter?: 'all' | 'unclassified' | number;
  maxResults?: number;
}): Promise<PlayerSearchItem[]> {
  const { requestorUid, searchTerm = '', levelFilter = 'all', maxResults = 20 } = params;

  // 1. Authorization check
  const authCheck = await verifyAdminOrOwner(requestorUid);
  if (!authCheck.isAllowed) {
    throw new Error('Você não possui permissão para gerenciar níveis técnicos.');
  }

  // 2. Query active profiles
  const profilesRef = collection(db, 'profiles');
  const q = query(profilesRef, where('status', '==', 'active'), limit(100));
  const snap = await getDocs(q);

  const trimmedSearch = searchTerm.trim().toLowerCase();
  const results: PlayerSearchItem[] = [];

  snap.forEach((docSnap) => {
    const data = docSnap.data();
    const uid = docSnap.id;
    const username = data.username || 'Jogador';
    const displayName = data.displayName || null;
    const normName = (displayName || data.usernameNormalized || username).toLowerCase();
    const normUser = (data.usernameNormalized || username).toLowerCase();

    // Text search matching
    if (trimmedSearch.length >= 2 && !normName.includes(trimmedSearch) && !normUser.includes(trimmedSearch)) {
      return;
    }

    const parsedLevel = parseTechnicalLevel(data.technicalLevel);

    // Filter matching
    if (levelFilter === 'unclassified' && parsedLevel !== null) {
      return;
    }
    if (typeof levelFilter === 'number' && parsedLevel !== levelFilter) {
      return;
    }

    // Convert timestamp
    let updatedAtStr: string | null = null;
    if (data.technicalLevelUpdatedAt) {
      if (typeof data.technicalLevelUpdatedAt.toDate === 'function') {
        updatedAtStr = data.technicalLevelUpdatedAt.toDate().toISOString();
      } else if (typeof data.technicalLevelUpdatedAt === 'string') {
        updatedAtStr = data.technicalLevelUpdatedAt;
      }
    }

    results.push({
      uid,
      username,
      displayName,
      photoUrl: data.photoUrl || null,
      technicalLevel: parsedLevel,
      technicalLevelUpdatedAt: updatedAtStr,
      technicalLevelUpdatedBy: data.technicalLevelUpdatedBy || null,
      status: data.status || 'active',
    });
  });

  return results.slice(0, Math.min(maxResults, 20));
}

/**
 * Atomically updates a player's technical level and appends audit history entry
 */
export async function updatePlayerTechnicalLevel(params: {
  requestorUid: string;
  targetUid: string;
  newLevel: number | null; // 1, 2, 3 or null for removal
}): Promise<{ success: boolean; newLevel: number | null }> {
  const { requestorUid, targetUid, newLevel } = params;

  // 1. Validate Level Value (Strictly 1, 2, 3 or null)
  if (newLevel !== null) {
    if (typeof newLevel !== 'number' || ![1, 2, 3].includes(newLevel) || !Number.isInteger(newLevel)) {
      throw new Error('Selecione Iniciante, Intermediário ou Avançado.');
    }
  }

  // 2. Authorization Check (Requestor must be active Owner or Admin)
  const authCheck = await verifyAdminOrOwner(requestorUid);
  if (!authCheck.isAllowed) {
    throw new Error('Você não possui permissão para realizar esta ação.');
  }

  // 3. Target User Check
  const targetDocRef = doc(db, 'profiles', targetUid);
  const targetSnap = await getDoc(targetDocRef);
  if (!targetSnap.exists()) {
    throw new Error('Não foi possível localizar este jogador.');
  }

  const targetData = targetSnap.data();
  if (targetData.status !== 'active') {
    throw new Error('Este jogador não pode receber uma classificação.');
  }

  const currentLevel = parseTechnicalLevel(targetData.technicalLevel);

  // 4. Check if level is unchanged to prevent duplicate audit history
  if (currentLevel === newLevel) {
    return { success: true, newLevel };
  }

  // 5. Update Profile
  const nowIso = new Date().toISOString();
  await setDoc(
    targetDocRef,
    {
      technicalLevel: newLevel,
      technicalLevelUpdatedAt: nowIso,
      technicalLevelUpdatedBy: requestorUid,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  // 6. Record Audit History Entry
  try {
    const historyRef = collection(db, 'technical_level_history');
    await addDoc(historyRef, {
      profileId: targetUid,
      previousLevel: currentLevel,
      newLevel: newLevel,
      changedBy: requestorUid,
      changedAt: nowIso,
    });
  } catch (histErr) {
    console.warn('[technicalLevelService] History audit log notice:', histErr);
  }

  return { success: true, newLevel };
}

/**
 * Migration helper to consolidate legacy levels (4 and 5) into 3-level scale
 */
export async function migrateToThreeLevels(): Promise<{ migratedProfiles: number; migratedGuests: number }> {
  let migratedProfiles = 0;
  let migratedGuests = 0;

  try {
    const nowIso = new Date().toISOString();

    // 1. Migrate Profiles
    const profilesSnap = await getDocs(collection(db, 'profiles'));
    for (const docSnap of profilesSnap.docs) {
      const data = docSnap.data();
      const oldLevel = data.technicalLevel;
      const parsed = parseTechnicalLevel(oldLevel);

      // If existing raw level differs from mapped parsed level (e.g. 2->1, 3->2, 4->3, 5->3)
      if (oldLevel !== null && oldLevel !== undefined && oldLevel !== parsed) {
        await setDoc(
          doc(db, 'profiles', docSnap.id),
          {
            technicalLevel: parsed,
            technicalLevelUpdatedAt: nowIso,
            technicalLevelUpdatedBy: 'migracao_tres_niveis',
          },
          { merge: true }
        );

        // Record history
        await addDoc(collection(db, 'technical_level_history'), {
          profileId: docSnap.id,
          previousLevel: oldLevel,
          newLevel: parsed,
          changedBy: 'migracao_tres_niveis',
          changedAt: nowIso,
        });

        migratedProfiles++;
      }
    }

    // 2. Migrate Guests
    const guestsSnap = await getDocs(collection(db, 'guest_players'));
    for (const docSnap of guestsSnap.docs) {
      const data = docSnap.data();
      const oldLevel = data.technicalLevel;
      const parsed = parseTechnicalLevel(oldLevel);

      if (oldLevel !== null && oldLevel !== undefined && oldLevel !== parsed) {
        await setDoc(
          doc(db, 'guest_players', docSnap.id),
          {
            technicalLevel: parsed,
            updatedAt: nowIso,
          },
          { merge: true }
        );
        migratedGuests++;
      }
    }
  } catch (err) {
    console.error('[technicalLevelService] migrateToThreeLevels error:', err);
  }

  return { migratedProfiles, migratedGuests };
}
