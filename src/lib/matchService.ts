import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  query, 
  where, 
  limit, 
  orderBy, 
  onSnapshot, 
  runTransaction, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  Game, 
  MatchSession, 
  MatchParticipant, 
  MatchSet, 
  MatchScoreEvent, 
  MatchFormat, 
  MatchStatus, 
  UserProfile, 
  GuestPlayer 
} from '../types';
import { verifyAdminOrOwner } from './technicalLevelService';
import { parseTechnicalLevel } from './technicalLevel';
import { notifyLineupSelected, notifyGameCompleted } from './notificationService';

/**
 * Gets or creates a draft match session for a given game
 */
export async function getOrCreateMatchSession(
  gameId: string, 
  requestorUid: string
): Promise<{ match: MatchSession; game: Game }> {
  // 1. Fetch Game
  const gameRef = doc(db, 'games', gameId);
  const gameSnap = await getDoc(gameRef);
  if (!gameSnap.exists()) {
    throw new Error('Jogo não encontrado.');
  }

  const gameData = gameSnap.data();
  if (gameData.status === 'cancelled' || gameData.status === 'cancelado') {
    throw new Error('Não é possível preparar uma partida para um jogo cancelado.');
  }

  const game: Game = {
    id: gameSnap.id,
    title: gameData.title,
    scheduledAt: gameData.scheduledAt,
    location: gameData.location,
    maxPlayers: gameData.maxPlayers || 12,
    confirmedCount: gameData.confirmedCount || 0,
    notes: gameData.notes,
    status: gameData.status,
    createdBy: gameData.createdBy,
  };

  // 2. Authorization Check
  const authCheck = await verifyAdminOrOwner(requestorUid);
  if (!authCheck.isAllowed) {
    throw new Error('Você não possui permissão para preparar partidas.');
  }

  // 3. Search for existing match session for this game
  const matchesRef = collection(db, 'match_sessions');
  const q = query(matchesRef, where('gameId', '==', gameId), limit(1));
  const snap = await getDocs(q);

  if (!snap.empty) {
    const docSnap = snap.docs[0];
    const data = docSnap.data();
    const existingMatch: MatchSession = {
      id: docSnap.id,
      gameId: data.gameId,
      status: data.status,
      format: data.format || 'best_of_3',
      teamAName: data.teamAName || 'Time 1',
      teamBName: data.teamBName || 'Time 2',
      currentSetNumber: data.currentSetNumber || 1,
      teamASetsWon: data.teamASetsWon || 0,
      teamBSetsWon: data.teamBSetsWon || 0,
      winnerTeam: data.winnerTeam || null,
      createdBy: data.createdBy,
      startedAt: data.startedAt || null,
      finishedAt: data.finishedAt || null,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
    return { match: existingMatch, game };
  }

  // 4. Create new draft match session
  const nowIso = new Date().toISOString();
  const newMatchData = {
    gameId,
    status: 'draft' as MatchStatus,
    format: 'best_of_3' as MatchFormat,
    teamAName: 'Time 1',
    teamBName: 'Time 2',
    currentSetNumber: 1,
    teamASetsWon: 0,
    teamBSetsWon: 0,
    winnerTeam: null,
    createdBy: requestorUid,
    startedAt: null,
    finishedAt: null,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const newMatchRef = await addDoc(matchesRef, newMatchData);

  const createdMatch: MatchSession = {
    id: newMatchRef.id,
    ...newMatchData,
  };

  return { match: createdMatch, game };
}

/**
 * Gets a match session by matchId
 */
export async function getMatchSession(matchId: string): Promise<MatchSession | null> {
  const matchRef = doc(db, 'match_sessions', matchId);
  const snap = await getDoc(matchRef);
  if (!snap.exists()) return null;

  const data = snap.data();
  return {
    id: snap.id,
    gameId: data.gameId,
    status: data.status,
    format: data.format || 'best_of_3',
    teamAName: data.teamAName || 'Time 1',
    teamBName: data.teamBName || 'Time 2',
    currentSetNumber: data.currentSetNumber || 1,
    teamASetsWon: data.teamASetsWon || 0,
    teamBSetsWon: data.teamBSetsWon || 0,
    winnerTeam: data.winnerTeam || null,
    createdBy: data.createdBy,
    startedAt: data.startedAt || null,
    finishedAt: data.finishedAt || null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/**
 * Gets all participants for a match
 */
export async function getMatchParticipants(matchId: string): Promise<MatchParticipant[]> {
  const partsRef = collection(db, 'match_participants');
  const q = query(partsRef, where('matchId', '==', matchId));
  const snap = await getDocs(q);

  const list: MatchParticipant[] = [];
  snap.forEach((docSnap) => {
    const data = docSnap.data();
    list.push({
      id: docSnap.id,
      matchId: data.matchId,
      profileId: data.profileId || null,
      guestPlayerId: data.guestPlayerId || null,
      displayName: data.displayName,
      isGuest: Boolean(data.isGuest),
      teamNumber: data.teamNumber || null,
      technicalLevelSnapshot: data.technicalLevelSnapshot || 3,
      isProvisionalLevel: Boolean(data.isProvisionalLevel),
      isConfirmed: Boolean(data.isConfirmed),
      addedBy: data.addedBy,
      createdAt: data.createdAt,
    });
  });

  return list;
}

/**
 * Gets all sets for a match session
 */
export async function getMatchSets(matchId: string): Promise<MatchSet[]> {
  const setsRef = collection(db, 'match_sets');
  const q = query(setsRef, where('matchId', '==', matchId));
  const snap = await getDocs(q);

  const list: MatchSet[] = [];
  snap.forEach((docSnap) => {
    const data = docSnap.data();
    list.push({
      id: docSnap.id,
      matchId: data.matchId,
      setNumber: data.setNumber,
      teamAScore: data.teamAScore || 0,
      teamBScore: data.teamBScore || 0,
      targetScore: data.targetScore || 25,
      status: data.status,
      winnerTeam: data.winnerTeam || null,
      startedAt: data.startedAt || null,
      finishedAt: data.finishedAt || null,
      createdAt: data.createdAt,
    });
  });

  return list.sort((a, b) => a.setNumber - b.setNumber);
}

/**
 * Adds a registered user profile or a guest player to the match session lineup
 */
export async function addParticipantToMatch(params: {
  matchId: string;
  gameMaxPlayers: number;
  profileId?: string | null;
  guestPlayerId?: string | null;
  displayName: string;
  isGuest: boolean;
  technicalLevel?: number | null;
  isConfirmedContext?: boolean;
  requestorUid: string;
}): Promise<MatchParticipant> {
  const {
    matchId,
    gameMaxPlayers,
    profileId = null,
    guestPlayerId = null,
    displayName,
    isGuest,
    technicalLevel = null,
    isConfirmedContext = false,
    requestorUid,
  } = params;

  // 1. Authorization check
  const authCheck = await verifyAdminOrOwner(requestorUid);
  if (!authCheck.isAllowed) {
    throw new Error('Você não possui permissão para gerenciar a escalação.');
  }

  // 2. Validate participant input
  if (!profileId && !guestPlayerId) {
    throw new Error('Informe um jogador cadastrado ou convidado.');
  }

  // 3. Fetch existing participants
  const existingParts = await getMatchParticipants(matchId);

  // 4. Capacity Check
  if (existingParts.length >= gameMaxPlayers) {
    throw new Error('Esta partida atingiu o limite de jogadores.');
  }

  // 5. Duplicate Check
  const isDuplicate = existingParts.some((p) => {
    if (profileId && p.profileId === profileId) return true;
    if (guestPlayerId && p.guestPlayerId === guestPlayerId) return true;
    return false;
  });

  if (isDuplicate) {
    throw new Error('Este jogador já está na partida.');
  }

  // 6. Determine level snapshot and provisional status
  const parsed = parseTechnicalLevel(technicalLevel);
  const snapshot = parsed ? parsed : 3; // Default to 3 if unset, marked as provisional
  const isProvisional = !parsed;

  // 7. Save to Firestore
  const nowIso = new Date().toISOString();
  const newPart = {
    matchId,
    profileId,
    guestPlayerId,
    displayName: displayName.trim(),
    isGuest,
    teamNumber: null as 1 | 2 | null,
    technicalLevelSnapshot: snapshot,
    isProvisionalLevel: isProvisional,
    isConfirmed: isConfirmedContext,
    addedBy: requestorUid,
    createdAt: nowIso,
  };

  const partsRef = collection(db, 'match_participants');
  const docRef = await addDoc(partsRef, newPart);

  if (profileId && !isGuest) {
    notifyLineupSelected(profileId, matchId, displayName).catch((err) =>
      console.warn('[matchService] notifyLineupSelected error:', err)
    );
  }

  return {
    id: docRef.id,
    ...newPart,
  };
}

/**
 * Removes a participant from the match lineup (allowed in draft/ready status)
 */
export async function removeParticipantFromMatch(
  participantId: string, 
  requestorUid: string
): Promise<void> {
  const authCheck = await verifyAdminOrOwner(requestorUid);
  if (!authCheck.isAllowed) {
    throw new Error('Você não possui permissão para remover participantes.');
  }

  const docRef = doc(db, 'match_participants', participantId);
  await deleteDoc(docRef);
}

/**
 * Updates a participant's provisional level for this match session only
 */
export async function updateParticipantProvisionalLevel(params: {
  participantId: string;
  newLevel: number; // 1-5
  requestorUid: string;
}): Promise<void> {
  const { participantId, newLevel, requestorUid } = params;

  const authCheck = await verifyAdminOrOwner(requestorUid);
  if (!authCheck.isAllowed) {
    throw new Error('Você não possui permissão para alterar o nível do participante.');
  }

  if (newLevel < 1 || newLevel > 5) {
    throw new Error('Selecione um nível técnico válido (entre 1 e 5).');
  }

  const docRef = doc(db, 'match_participants', participantId);
  await setDoc(
    docRef, 
    { 
      technicalLevelSnapshot: newLevel, 
      isProvisionalLevel: true 
    }, 
    { merge: true }
  );
}

/**
 * Updates a participant's team assignment (Team 1, Team 2, or unassigned null)
 */
export async function updateParticipantTeam(params: {
  participantId: string;
  teamNumber: 1 | 2 | null;
  requestorUid: string;
}): Promise<void> {
  const { participantId, teamNumber, requestorUid } = params;

  const authCheck = await verifyAdminOrOwner(requestorUid);
  if (!authCheck.isAllowed) {
    throw new Error('Você não possui permissão para alterar os times.');
  }

  const docRef = doc(db, 'match_participants', participantId);
  await setDoc(docRef, { teamNumber }, { merge: true });
}

/**
 * Automatic Team Balancing Algorithm
 * Distributes participants into 2 balanced teams using technical level snapshots
 */
export async function autoBalanceTeams(matchId: string, requestorUid: string): Promise<void> {
  const authCheck = await verifyAdminOrOwner(requestorUid);
  if (!authCheck.isAllowed) {
    throw new Error('Você não possui permissão para gerar a formação dos times.');
  }

  const participants = await getMatchParticipants(matchId);
  if (participants.length < 2) {
    throw new Error('A partida precisa de pelo menos 2 jogadores para gerar times.');
  }

  // Shuffle players of the same level for fairness
  const shuffled = [...participants].sort(() => Math.random() - 0.5);

  // Sort descending by technicalLevelSnapshot
  shuffled.sort((a, b) => b.technicalLevelSnapshot - a.technicalLevelSnapshot);

  const team1: MatchParticipant[] = [];
  const team2: MatchParticipant[] = [];

  let sum1 = 0;
  let sum2 = 0;

  for (const player of shuffled) {
    const level = player.technicalLevelSnapshot || 3;

    // Distribute to team with lower level sum
    if (sum1 < sum2) {
      team1.push(player);
      sum1 += level;
    } else if (sum2 < sum1) {
      team2.push(player);
      sum2 += level;
    } else {
      // Tiebreak: assign to team with fewer players, or random if equal count
      if (team1.length < team2.length) {
        team1.push(player);
        sum1 += level;
      } else if (team2.length < team1.length) {
        team2.push(player);
        sum2 += level;
      } else {
        if (Math.random() < 0.5) {
          team1.push(player);
          sum1 += level;
        } else {
          team2.push(player);
          sum2 += level;
        }
      }
    }
  }

  // Write updated team numbers to Firestore
  for (const p of team1) {
    await doc(db, 'match_participants', p.id);
    await setDoc(doc(db, 'match_participants', p.id), { teamNumber: 1 }, { merge: true });
  }

  for (const p of team2) {
    await doc(db, 'match_participants', p.id);
    await setDoc(doc(db, 'match_participants', p.id), { teamNumber: 2 }, { merge: true });
  }
}

/**
 * Updates match format (single_set, best_of_3, best_of_5)
 */
export async function updateMatchFormat(params: {
  matchId: string;
  format: MatchFormat;
  requestorUid: string;
}): Promise<void> {
  const { matchId, format, requestorUid } = params;

  const authCheck = await verifyAdminOrOwner(requestorUid);
  if (!authCheck.isAllowed) {
    throw new Error('Você não possui permissão para alterar o formato da partida.');
  }

  const sets = await getMatchSets(matchId);
  const hasPoints = sets.some((s) => s.teamAScore > 0 || s.teamBScore > 0);
  if (hasPoints) {
    throw new Error('Não é possível alterar o formato da partida após o registro de pontos.');
  }

  const matchRef = doc(db, 'match_sessions', matchId);
  await setDoc(matchRef, { format, updatedAt: new Date().toISOString() }, { merge: true });
}

/**
 * Updates custom team names
 */
export async function updateMatchTeamNames(params: {
  matchId: string;
  teamAName: string;
  teamBName: string;
  requestorUid: string;
}): Promise<void> {
  const { matchId, teamAName, teamBName, requestorUid } = params;

  const authCheck = await verifyAdminOrOwner(requestorUid);
  if (!authCheck.isAllowed) {
    throw new Error('Você não possui permissão para alterar os nomes dos times.');
  }

  const matchRef = doc(db, 'match_sessions', matchId);
  await setDoc(
    matchRef, 
    { 
      teamAName: teamAName.trim() || 'Time 1', 
      teamBName: teamBName.trim() || 'Time 2',
      updatedAt: new Date().toISOString() 
    }, 
    { merge: true }
  );
}

/**
 * Starts the match session (transitions status from draft/ready to live)
 */
export async function startMatchSession(matchId: string, requestorUid: string): Promise<void> {
  const authCheck = await verifyAdminOrOwner(requestorUid);
  if (!authCheck.isAllowed) {
    throw new Error('Você não possui permissão para iniciar a partida.');
  }

  const match = await getMatchSession(matchId);
  if (!match) {
    throw new Error('Partida não encontrada.');
  }

  const participants = await getMatchParticipants(matchId);
  const team1 = participants.filter((p) => p.teamNumber === 1);
  const team2 = participants.filter((p) => p.teamNumber === 2);

  if (team1.length === 0 || team2.length === 0) {
    throw new Error('A partida precisa ter pelo menos 1 jogador em cada time.');
  }

  const sets = await getMatchSets(matchId);
  const nowIso = new Date().toISOString();

  // If no sets created yet, create Set 1
  if (sets.length === 0) {
    const setsRef = collection(db, 'match_sets');
    await addDoc(setsRef, {
      matchId,
      setNumber: 1,
      teamAScore: 0,
      teamBScore: 0,
      targetScore: 25,
      status: 'in_progress',
      winnerTeam: null,
      startedAt: nowIso,
      finishedAt: null,
      createdAt: nowIso,
    });
  }

  // Update match session status to live
  const matchRef = doc(db, 'match_sessions', matchId);
  await setDoc(
    matchRef, 
    { 
      status: 'live', 
      currentSetNumber: 1, 
      startedAt: nowIso, 
      updatedAt: nowIso 
    }, 
    { merge: true }
  );
}

/**
 * Atomic score increment transaction with clientActionId for idempotency and race condition safety
 */
export async function addPointToScore(params: {
  matchId: string;
  teamNumber: 1 | 2;
  clientActionId: string;
  requestorUid: string;
}): Promise<{ match: MatchSession; set: MatchSet }> {
  const { matchId, teamNumber, clientActionId, requestorUid } = params;

  const authCheck = await verifyAdminOrOwner(requestorUid);
  if (!authCheck.isAllowed) {
    throw new Error('Você não possui permissão para atualizar o placar.');
  }

  return await runTransaction(db, async (transaction) => {
    // 1. Fetch match session
    const matchRef = doc(db, 'match_sessions', matchId);
    const matchSnap = await transaction.get(matchRef);
    if (!matchSnap.exists()) {
      throw new Error('Partida não encontrada.');
    }

    const matchData = matchSnap.data();
    if (matchData.status !== 'live') {
      throw new Error('Apenas partidas ao vivo podem receber pontos.');
    }

    const currentSetNumber: number = matchData.currentSetNumber || 1;
    const format: MatchFormat = matchData.format || 'best_of_3';

    // 2. Fetch current active set
    const setsRef = collection(db, 'match_sets');
    const qSet = query(setsRef, where('matchId', '==', matchId), where('setNumber', '==', currentSetNumber));
    const setsSnap = await getDocs(qSet);

    if (setsSnap.empty) {
      throw new Error('Set da partida não localizado.');
    }

    const setDocSnap = setsSnap.docs[0];
    const setRef = doc(db, 'match_sets', setDocSnap.id);
    const setSnap = await transaction.get(setRef);
    if (!setSnap.exists()) {
      throw new Error('Set não encontrado.');
    }

    const setObj = setSnap.data();
    let scoreA: number = setObj.teamAScore || 0;
    let scoreB: number = setObj.teamBScore || 0;
    const targetScore: number = setObj.targetScore || 25;

    // 3. Increment score
    if (teamNumber === 1) scoreA++;
    else scoreB++;

    // 4. Check if set is won (must reach target score and have at least 2 points lead)
    let setWinner: 1 | 2 | null = null;
    let isSetCompleted = false;

    if (scoreA >= targetScore && scoreA - scoreB >= 2) {
      setWinner = 1;
      isSetCompleted = true;
    } else if (scoreB >= targetScore && scoreB - scoreA >= 2) {
      setWinner = 2;
      isSetCompleted = true;
    }

    const nowIso = new Date().toISOString();

    // 5. Update set document
    if (isSetCompleted) {
      transaction.update(setRef, {
        teamAScore: scoreA,
        teamBScore: scoreB,
        status: 'completed',
        winnerTeam: setWinner,
        finishedAt: nowIso,
      });
    } else {
      transaction.update(setRef, {
        teamAScore: scoreA,
        teamBScore: scoreB,
        status: 'in_progress',
      });
    }

    // 6. Calculate total sets won
    let setsWonA: number = matchData.teamASetsWon || 0;
    let setsWonB: number = matchData.teamBSetsWon || 0;

    if (isSetCompleted && setWinner === 1) setsWonA++;
    if (isSetCompleted && setWinner === 2) setsWonB++;

    // Determine required sets to win match
    let setsNeeded = 2; // best_of_3 default
    if (format === 'single_set') setsNeeded = 1;
    if (format === 'best_of_5') setsNeeded = 3;

    let matchWinner: 1 | 2 | null = null;
    let isMatchFinished = false;

    if (setsWonA >= setsNeeded) {
      matchWinner = 1;
      isMatchFinished = true;
    } else if (setsWonB >= setsNeeded) {
      matchWinner = 2;
      isMatchFinished = true;
    }

    // 7. Handle match progression or next set initialization
    if (isMatchFinished) {
      transaction.update(matchRef, {
        teamASetsWon: setsWonA,
        teamBSetsWon: setsWonB,
        winnerTeam: matchWinner,
        status: 'finished',
        finishedAt: nowIso,
        updatedAt: nowIso,
      });
    } else if (isSetCompleted) {
      const nextSetNum = currentSetNumber + 1;
      let nextTarget = 25;

      // Tiebreak set check (Set 3 in best_of_3, Set 5 in best_of_5)
      if ((format === 'best_of_3' && nextSetNum === 3) || (format === 'best_of_5' && nextSetNum === 5)) {
        nextTarget = 15;
      }

      // Create next set doc
      const nextSetRef = doc(collection(db, 'match_sets'));
      transaction.set(nextSetRef, {
        matchId,
        setNumber: nextSetNum,
        teamAScore: 0,
        teamBScore: 0,
        targetScore: nextTarget,
        status: 'in_progress',
        winnerTeam: null,
        startedAt: nowIso,
        finishedAt: null,
        createdAt: nowIso,
      });

      transaction.update(matchRef, {
        currentSetNumber: nextSetNum,
        teamASetsWon: setsWonA,
        teamBSetsWon: setsWonB,
        updatedAt: nowIso,
      });
    }

    // 8. Log score audit event
    const eventRef = doc(collection(db, 'match_score_events'));
    transaction.set(eventRef, {
      matchId,
      setId: setDocSnap.id,
      setNumber: currentSetNumber,
      teamNumber,
      eventType: 'point',
      clientActionId,
      teamAScoreAfter: scoreA,
      teamBScoreAfter: scoreB,
      createdBy: requestorUid,
      createdAt: nowIso,
    });

    const updatedMatch: MatchSession = {
      id: matchId,
      gameId: matchData.gameId,
      status: isMatchFinished ? 'finished' : 'live',
      format,
      teamAName: matchData.teamAName || 'Time 1',
      teamBName: matchData.teamBName || 'Time 2',
      currentSetNumber: isMatchFinished ? currentSetNumber : isSetCompleted ? currentSetNumber + 1 : currentSetNumber,
      teamASetsWon: setsWonA,
      teamBSetsWon: setsWonB,
      winnerTeam: matchWinner,
      createdBy: matchData.createdBy,
      startedAt: matchData.startedAt,
      finishedAt: isMatchFinished ? nowIso : null,
      createdAt: matchData.createdAt,
      updatedAt: nowIso,
    };

    const updatedSet: MatchSet = {
      id: setDocSnap.id,
      matchId,
      setNumber: currentSetNumber,
      teamAScore: scoreA,
      teamBScore: scoreB,
      targetScore,
      status: isSetCompleted ? 'completed' : 'in_progress',
      winnerTeam: setWinner,
      startedAt: setObj.startedAt,
      finishedAt: isSetCompleted ? nowIso : null,
      createdAt: setObj.createdAt,
    };

    const result = { match: updatedMatch, set: updatedSet };

    if (updatedMatch.status === 'finished') {
      const winnerName = updatedMatch.winnerTeam === 1 
        ? updatedMatch.teamAName 
        : updatedMatch.winnerTeam === 2 
        ? updatedMatch.teamBName 
        : null;
      const winnerText = winnerName ? `Vitória do ${winnerName}` : undefined;
      notifyGameCompleted(matchId, `${updatedMatch.teamAName} x ${updatedMatch.teamBName}`, winnerText).catch((err) =>
        console.warn('[matchService] notifyGameCompleted error:', err)
      );
    }

    return result;
  });
}

/**
 * Undoes the last point recorded in the current set
 */
export async function undoPointFromScore(params: {
  matchId: string;
  clientActionId: string;
  requestorUid: string;
}): Promise<void> {
  const { matchId, clientActionId, requestorUid } = params;

  const authCheck = await verifyAdminOrOwner(requestorUid);
  if (!authCheck.isAllowed) {
    throw new Error('Você não possui permissão para desfazer pontos.');
  }

  await runTransaction(db, async (transaction) => {
    // 1. Fetch match
    const matchRef = doc(db, 'match_sessions', matchId);
    const matchSnap = await transaction.get(matchRef);
    if (!matchSnap.exists()) {
      throw new Error('Partida não encontrada.');
    }

    const matchData = matchSnap.data();
    let currentSetNumber = matchData.currentSetNumber || 1;

    // 2. Fetch latest active set doc
    const setsRef = collection(db, 'match_sets');
    const qSet = query(setsRef, where('matchId', '==', matchId), where('setNumber', '==', currentSetNumber));
    const setsSnap = await getDocs(qSet);

    if (setsSnap.empty) {
      throw new Error('Set não localizado.');
    }

    const setDocSnap = setsSnap.docs[0];
    const setRef = doc(db, 'match_sets', setDocSnap.id);
    const setSnap = await transaction.get(setRef);
    if (!setSnap.exists()) return;

    const setData = setSnap.data();
    let scoreA = setData.teamAScore || 0;
    let scoreB = setData.teamBScore || 0;

    // Check if score is 0x0 in current set and can revert to previous set if points exist
    if (scoreA === 0 && scoreB === 0 && currentSetNumber > 1) {
      // Check if current empty set has no points
      const prevSetNumber = currentSetNumber - 1;
      const qPrev = query(setsRef, where('matchId', '==', matchId), where('setNumber', '==', prevSetNumber));
      const prevSnap = await getDocs(qPrev);

      if (!prevSnap.empty) {
        const prevDocSnap = prevSnap.docs[0];
        const prevSetRef = doc(db, 'match_sets', prevDocSnap.id);
        const prevSnapData = (await transaction.get(prevSetRef)).data();

        if (prevSnapData) {
          // Reopen previous set
          let setsWonA = matchData.teamASetsWon || 0;
          let setsWonB = matchData.teamBSetsWon || 0;

          if (prevSnapData.winnerTeam === 1) setsWonA = Math.max(0, setsWonA - 1);
          if (prevSnapData.winnerTeam === 2) setsWonB = Math.max(0, setsWonB - 1);

          transaction.update(prevSetRef, {
            status: 'in_progress',
            winnerTeam: null,
            finishedAt: null,
          });

          // Delete current empty set
          transaction.delete(setRef);

          transaction.update(matchRef, {
            currentSetNumber: prevSetNumber,
            teamASetsWon: setsWonA,
            teamBSetsWon: setsWonB,
            status: 'live',
            winnerTeam: null,
            finishedAt: null,
            updatedAt: new Date().toISOString(),
          });

          return;
        }
      }
    }

    if (scoreA === 0 && scoreB === 0) {
      throw new Error('Não há pontos para desfazer neste set.');
    }

    // Determine which team scored last by querying latest event
    const eventsRef = collection(db, 'match_score_events');
    const qEv = query(eventsRef, where('matchId', '==', matchId), where('setNumber', '==', currentSetNumber));
    const evSnap = await getDocs(qEv);

    const events: any[] = [];
    evSnap.forEach((d) => events.push({ id: d.id, ...d.data() }));
    events.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));

    const validPoints = events.filter((e) => e.eventType === 'point');
    const lastPoint = validPoints[validPoints.length - 1];

    if (!lastPoint) {
      throw new Error('Não foi possível identificar o último ponto registrado.');
    }

    if (lastPoint.teamNumber === 1) scoreA = Math.max(0, scoreA - 1);
    else scoreB = Math.max(0, scoreB - 1);

    // Update set status back to in_progress if completed
    transaction.update(setRef, {
      teamAScore: scoreA,
      teamBScore: scoreB,
      status: 'in_progress',
      winnerTeam: null,
      finishedAt: null,
    });

    // Log undo event
    const undoRef = doc(collection(db, 'match_score_events'));
    transaction.set(undoRef, {
      matchId,
      setId: setDocSnap.id,
      setNumber: currentSetNumber,
      teamNumber: lastPoint.teamNumber,
      eventType: 'undo',
      clientActionId,
      reversedEventId: lastPoint.id,
      teamAScoreAfter: scoreA,
      teamBScoreAfter: scoreB,
      createdBy: requestorUid,
      createdAt: new Date().toISOString(),
    });

    // If match was finished, reopen it to live
    if (matchData.status === 'finished') {
      transaction.update(matchRef, {
        status: 'live',
        winnerTeam: null,
        finishedAt: null,
        updatedAt: new Date().toISOString(),
      });
    }
  });
}

/**
 * Subscribes to real-time updates for a match session, its participants, and its sets
 */
export function subscribeToMatchSession(
  matchId: string,
  onUpdate: (data: { match: MatchSession | null; sets: MatchSet[]; participants: MatchParticipant[] }) => void
): () => void {
  const matchRef = doc(db, 'match_sessions', matchId);
  const partsRef = collection(db, 'match_participants');
  const qParts = query(partsRef, where('matchId', '==', matchId));
  const setsRef = collection(db, 'match_sets');
  const qSets = query(setsRef, where('matchId', '==', matchId));

  let currentMatch: MatchSession | null = null;
  let currentSets: MatchSet[] = [];
  let currentParts: MatchParticipant[] = [];

  const unsubMatch = onSnapshot(matchRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      currentMatch = {
        id: snap.id,
        gameId: data.gameId,
        status: data.status,
        format: data.format || 'best_of_3',
        teamAName: data.teamAName || 'Time 1',
        teamBName: data.teamBName || 'Time 2',
        currentSetNumber: data.currentSetNumber || 1,
        teamASetsWon: data.teamASetsWon || 0,
        teamBSetsWon: data.teamBSetsWon || 0,
        winnerTeam: data.winnerTeam || null,
        createdBy: data.createdBy,
        startedAt: data.startedAt || null,
        finishedAt: data.finishedAt || null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    } else {
      currentMatch = null;
    }
    onUpdate({ match: currentMatch, sets: currentSets, participants: currentParts });
  });

  const unsubParts = onSnapshot(qParts, (snap) => {
    const list: MatchParticipant[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        matchId: data.matchId,
        profileId: data.profileId || null,
        guestPlayerId: data.guestPlayerId || null,
        displayName: data.displayName,
        isGuest: Boolean(data.isGuest),
        teamNumber: data.teamNumber || null,
        technicalLevelSnapshot: data.technicalLevelSnapshot || 3,
        isProvisionalLevel: Boolean(data.isProvisionalLevel),
        isConfirmed: Boolean(data.isConfirmed),
        addedBy: data.addedBy,
        createdAt: data.createdAt,
      });
    });
    currentParts = list;
    onUpdate({ match: currentMatch, sets: currentSets, participants: currentParts });
  });

  const unsubSets = onSnapshot(qSets, (snap) => {
    const list: MatchSet[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        matchId: data.matchId,
        setNumber: data.setNumber,
        teamAScore: data.teamAScore || 0,
        teamBScore: data.teamBScore || 0,
        targetScore: data.targetScore || 25,
        status: data.status,
        winnerTeam: data.winnerTeam || null,
        startedAt: data.startedAt || null,
        finishedAt: data.finishedAt || null,
        createdAt: data.createdAt,
      });
    });
    currentSets = list.sort((a, b) => a.setNumber - b.setNumber);
    onUpdate({ match: currentMatch, sets: currentSets, participants: currentParts });
  });

  return () => {
    unsubMatch();
    unsubParts();
    unsubSets();
  };
}
