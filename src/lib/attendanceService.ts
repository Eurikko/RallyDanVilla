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
  serverTimestamp,
  increment,
  runTransaction
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  MatchSession, 
  MatchParticipant, 
  MatchAttendanceRecord, 
  AttendanceStatus,
  MatchSet
} from '../types';
import { verifyAdminOrOwner } from './technicalLevelService';
import { getGameRegistrations } from './gameService';
import { notifyAttendanceRecorded } from './notificationService';

export interface ParticipantAttendanceItem {
  participantId: string;
  profileId: string | null;
  guestPlayerId: string | null;
  displayName: string;
  isGuest: boolean;
  teamNumber: 1 | 2 | null;
  wasConfirmedRSVP: boolean;
  attendanceStatus: AttendanceStatus;
}

export interface AttendanceSummaryMetrics {
  totalEscalated: number;
  presentCount: number;
  absentCount: number;
  pendingCount: number;
  registeredProfilesCount: number;
  guestPlayersCount: number;
}

export interface UserParticipationHistoryItem {
  attendanceId: string;
  matchId: string;
  gameId: string;
  gameTitle: string;
  gameDate: string;
  gameLocation: string;
  userTeamName: string;
  opponentTeamName: string;
  userSetsWon: number;
  opponentSetsWon: number;
  isWinner: boolean | null;
  setScoresFormatted: string;
  markedAt: string;
}

/**
 * Gets attendance state for a match, combining match participants, game RSVPs, and existing attendance records
 */
export async function getMatchAttendance(matchId: string): Promise<{
  match: MatchSession;
  participants: ParticipantAttendanceItem[];
  metrics: AttendanceSummaryMetrics;
}> {
  if (!matchId) throw new Error('Identificador de partida inválido.');

  // 1. Fetch Match Session
  const matchSnap = await getDoc(doc(db, 'match_sessions', matchId));
  if (!matchSnap.exists()) throw new Error('Partida não encontrada.');

  const matchData = matchSnap.data();
  const matchSession: MatchSession = {
    id: matchSnap.id,
    gameId: matchData.gameId,
    status: matchData.status,
    format: matchData.format,
    teamAName: matchData.teamAName || 'Time A',
    teamBName: matchData.teamBName || 'Time B',
    currentSetNumber: matchData.currentSetNumber || 1,
    teamASetsWon: matchData.teamASetsWon || 0,
    teamBSetsWon: matchData.teamBSetsWon || 0,
    winnerTeam: matchData.winnerTeam || null,
    createdBy: matchData.createdBy,
    startedAt: matchData.startedAt || null,
    finishedAt: matchData.finishedAt || null,
    attendanceStatus: matchData.attendanceStatus || 'pending',
    attendanceFinalizedBy: matchData.attendanceFinalizedBy || null,
    attendanceFinalizedAt: matchData.attendanceFinalizedAt || null,
    attendanceClientActionId: matchData.attendanceClientActionId || null,
    createdAt: matchData.createdAt,
    updatedAt: matchData.updatedAt,
  };

  // 2. Fetch Match Participants
  const partsQuery = query(collection(db, 'match_participants'), where('matchId', '==', matchId));
  const partsSnap = await getDocs(partsQuery);

  const participantsMap: Map<string, MatchParticipant> = new Map();
  partsSnap.forEach((d) => {
    const data = d.data();
    participantsMap.set(d.id, {
      id: d.id,
      matchId: data.matchId,
      profileId: data.profileId || null,
      guestPlayerId: data.guestPlayerId || null,
      displayName: data.displayName || 'Atleta',
      isGuest: !!data.isGuest,
      teamNumber: data.teamNumber || null,
      technicalLevelSnapshot: data.technicalLevelSnapshot || 3,
      isProvisionalLevel: !!data.isProvisionalLevel,
      isConfirmed: !!data.isConfirmed,
      addedBy: data.addedBy,
      createdAt: data.createdAt,
    });
  });

  // 3. Fetch Game RSVPs for confirmation context
  const rsvpQuery = query(collection(db, 'game_registrations'), where('gameId', '==', matchSession.gameId));
  const rsvpSnap = await getDocs(rsvpQuery);
  const confirmedUserIds = new Set<string>();
  rsvpSnap.forEach((d) => {
    const rData = d.data();
    if (rData.status === 'confirmed') {
      confirmedUserIds.add(rData.userId);
    }
  });

  // 4. Fetch Existing Attendance Records
  const attQuery = query(collection(db, 'match_attendance'), where('matchId', '==', matchId));
  const attSnap = await getDocs(attQuery);
  const existingAttMap: Map<string, AttendanceStatus> = new Map();
  attSnap.forEach((d) => {
    const aData = d.data();
    if (aData.matchParticipantId) {
      existingAttMap.set(aData.matchParticipantId, aData.attendanceStatus);
    }
  });

  // 5. Construct Participant Attendance Items list
  const participantItems: ParticipantAttendanceItem[] = [];
  const metrics: AttendanceSummaryMetrics = {
    totalEscalated: participantsMap.size,
    presentCount: 0,
    absentCount: 0,
    pendingCount: 0,
    registeredProfilesCount: 0,
    guestPlayersCount: 0,
  };

  participantsMap.forEach((part) => {
    if (part.isGuest) {
      metrics.guestPlayersCount++;
    } else {
      metrics.registeredProfilesCount++;
    }

    const wasConfirmedRSVP = part.profileId ? confirmedUserIds.has(part.profileId) : false;
    const attStatus = existingAttMap.get(part.id) || 'pending';

    if (attStatus === 'present') metrics.presentCount++;
    else if (attStatus === 'absent') metrics.absentCount++;
    else metrics.pendingCount++;

    participantItems.push({
      participantId: part.id,
      profileId: part.profileId,
      guestPlayerId: part.guestPlayerId,
      displayName: part.displayName,
      isGuest: part.isGuest,
      teamNumber: part.teamNumber,
      wasConfirmedRSVP,
      attendanceStatus: attStatus,
    });
  });

  return {
    match: matchSession,
    participants: participantItems,
    metrics,
  };
}

/**
 * Finalizes match attendance and atomically updates attendanceCount in profiles for present registered players
 */
export async function finalizeMatchAttendance(params: {
  requestorUid: string;
  matchId: string;
  clientActionId: string;
  attendanceItems: Array<{ participantId: string; status: 'present' | 'absent' }>;
}): Promise<{ success: boolean; finalizedAt: string }> {
  const { requestorUid, matchId, clientActionId, attendanceItems } = params;

  if (!requestorUid || !matchId || !clientActionId) {
    throw new Error('Parâmetros obrigatórios ausentes.');
  }

  // 1. Authorization Check (Owner or Admin)
  const authCheck = await verifyAdminOrOwner(requestorUid);
  if (!authCheck.isAllowed) {
    throw new Error('Você não possui permissão para realizar esta ação.');
  }

  // 2. Fetch Match Session
  const matchRef = doc(db, 'match_sessions', matchId);
  const matchSnap = await getDoc(matchRef);
  if (!matchSnap.exists()) {
    throw new Error('Partida não encontrada.');
  }

  const matchData = matchSnap.data();
  const matchStatus = matchData.status;

  if (matchStatus === 'cancelled' || matchStatus === 'cancelado') {
    throw new Error('Partidas canceladas não podem gerar participações.');
  }

  if (matchStatus !== 'finished' && matchStatus !== 'concluido') {
    throw new Error('Finalize a partida antes de registrar o comparecimento.');
  }

  if (matchData.attendanceStatus === 'finalized') {
    if (matchData.attendanceClientActionId === clientActionId) {
      return { success: true, finalizedAt: matchData.attendanceFinalizedAt || new Date().toISOString() };
    }
    throw new Error('O comparecimento desta partida já foi finalizado.');
  }

  // 3. Fetch all match participants to validate completeness
  const partsQuery = query(collection(db, 'match_participants'), where('matchId', '==', matchId));
  const partsSnap = await getDocs(partsQuery);
  const matchParticipantsMap = new Map<string, MatchParticipant>();

  partsSnap.forEach((d) => {
    const pData = d.data();
    matchParticipantsMap.set(d.id, {
      id: d.id,
      matchId: pData.matchId,
      profileId: pData.profileId || null,
      guestPlayerId: pData.guestPlayerId || null,
      displayName: pData.displayName || 'Atleta',
      isGuest: !!pData.isGuest,
      teamNumber: pData.teamNumber || null,
      technicalLevelSnapshot: pData.technicalLevelSnapshot || 3,
      isProvisionalLevel: !!pData.isProvisionalLevel,
      isConfirmed: !!pData.isConfirmed,
      addedBy: pData.addedBy,
    });
  });

  if (matchParticipantsMap.size === 0) {
    throw new Error('A partida não possui atletas escalados.');
  }

  // Verify that EVERY participant in the match has a status defined in attendanceItems
  const submittedMap = new Map<string, 'present' | 'absent'>();
  attendanceItems.forEach((item) => {
    if (item.status === 'present' || item.status === 'absent') {
      submittedMap.set(item.participantId, item.status);
    }
  });

  for (const [partId] of matchParticipantsMap) {
    if (!submittedMap.has(partId)) {
      throw new Error('Defina a situação de todos os participantes antes de finalizar.');
    }
  }

  const nowIso = new Date().toISOString();

  // 4. Write attendance records & update profiles atomically
  await runTransaction(db, async (transaction) => {
    // Re-verify match doc inside transaction
    const freshMatchSnap = await transaction.get(matchRef);
    if (!freshMatchSnap.exists()) throw new Error('Partida não encontrada.');
    const freshData = freshMatchSnap.data();

    if (freshData.attendanceStatus === 'finalized') {
      if (freshData.attendanceClientActionId === clientActionId) return;
      throw new Error('O comparecimento desta partida já foi finalizado.');
    }

    // Process each participant
    for (const [partId, status] of submittedMap) {
      const partObj = matchParticipantsMap.get(partId);
      if (!partObj) continue;

      const attDocId = `att_${matchId}_${partId}`;
      const attRef = doc(db, 'match_attendance', attDocId);

      transaction.set(attRef, {
        id: attDocId,
        matchId,
        matchParticipantId: partId,
        profileId: partObj.profileId || null,
        guestPlayerId: partObj.guestPlayerId || null,
        attendanceStatus: status,
        markedBy: requestorUid,
        markedAt: nowIso,
        finalizedAt: nowIso,
        createdAt: nowIso,
        updatedAt: nowIso,
      });

      // Increment attendanceCount in profile ONLY if present AND registered profile
      if (status === 'present' && partObj.profileId && !partObj.isGuest) {
        const profileRef = doc(db, 'profiles', partObj.profileId);
        transaction.update(profileRef, {
          attendanceCount: increment(1),
          updatedAt: nowIso,
        });
      }
    }

    // Update match session
    transaction.update(matchRef, {
      attendanceStatus: 'finalized',
      attendanceFinalizedBy: requestorUid,
      attendanceFinalizedAt: nowIso,
      attendanceClientActionId: clientActionId,
      updatedAt: nowIso,
    });
  });

  // Notify present/absent registered profile participants
  const participantUserIds: string[] = Array.from(matchParticipantsMap.values())
    .map((p) => p.profileId)
    .filter((id): id is string => !!id);

  if (participantUserIds.length > 0) {
    notifyAttendanceRecorded(participantUserIds, matchData.teamAName ? `${matchData.teamAName} x ${matchData.teamBName}` : 'Partida da Vila').catch((err) =>
      console.warn('[attendanceService] notifyAttendanceRecorded error:', err)
    );
  }

  return { success: true, finalizedAt: nowIso };
}

/**
 * Corrects attendance for a specific participant after match attendance was finalized (Owner only)
 */
export async function correctMatchAttendance(params: {
  requestorUid: string;
  matchId: string;
  participantId: string;
  newStatus: 'present' | 'absent';
  reason: string;
  clientActionId: string;
}): Promise<{ success: boolean }> {
  const { requestorUid, matchId, participantId, newStatus, reason, clientActionId } = params;

  // 1. Owner authorization check
  const authCheck = await verifyAdminOrOwner(requestorUid);
  if (!authCheck.isAllowed || authCheck.role !== 'owner') {
    throw new Error('Você não possui permissão para realizar esta ação.');
  }

  const cleanReason = reason.trim();
  if (!cleanReason) {
    throw new Error('Informe o motivo da correção.');
  }

  // 2. Fetch Match Session
  const matchRef = doc(db, 'match_sessions', matchId);
  const matchSnap = await getDoc(matchRef);
  if (!matchSnap.exists()) throw new Error('Partida não encontrada.');

  const matchData = matchSnap.data();
  if (matchData.attendanceStatus !== 'finalized' && matchData.attendanceStatus !== 'corrected') {
    throw new Error('O comparecimento ainda não foi finalizado nesta partida.');
  }

  // 3. Fetch Participant and Attendance record
  const attDocId = `att_${matchId}_${participantId}`;
  const attRef = doc(db, 'match_attendance', attDocId);

  await runTransaction(db, async (transaction) => {
    const attSnap = await transaction.get(attRef);
    if (!attSnap.exists()) {
      throw new Error('Registro de comparecimento não encontrado para este participante.');
    }

    const attData = attSnap.data();
    const previousStatus: AttendanceStatus = attData.attendanceStatus;

    if (previousStatus === newStatus) {
      return; // No status change needed
    }

    const profileId: string | null = attData.profileId || null;
    const nowIso = new Date().toISOString();

    // Adjust attendance count in profile if registered user
    if (profileId) {
      const profileRef = doc(db, 'profiles', profileId);
      const profileSnap = await transaction.get(profileRef);

      if (profileSnap.exists()) {
        const currentCount = profileSnap.data().attendanceCount || 0;

        if (previousStatus === 'absent' && newStatus === 'present') {
          transaction.update(profileRef, {
            attendanceCount: increment(1),
            updatedAt: nowIso,
          });
        } else if (previousStatus === 'present' && newStatus === 'absent') {
          const newCount = Math.max(0, currentCount - 1);
          transaction.update(profileRef, {
            attendanceCount: newCount,
            updatedAt: nowIso,
          });
        }
      }
    }

    // Update Attendance record
    transaction.update(attRef, {
      attendanceStatus: newStatus,
      updatedAt: nowIso,
    });

    // Create Audit log in attendance_adjustments
    const adjRef = doc(collection(db, 'attendance_adjustments'));
    transaction.set(adjRef, {
      id: adjRef.id,
      matchAttendanceId: attDocId,
      matchId,
      profileId,
      previousStatus,
      newStatus,
      reason: cleanReason,
      changedBy: requestorUid,
      clientActionId,
      createdAt: nowIso,
    });

    // Update match session attendance status to 'corrected'
    transaction.update(matchRef, {
      attendanceStatus: 'corrected',
      updatedAt: nowIso,
    });
  });

  return { success: true };
}

/**
 * Gets personal participation history for a registered profile
 */
export async function getUserAttendanceHistory(profileId: string): Promise<{
  totalParticipations: number;
  history: UserParticipationHistoryItem[];
}> {
  if (!profileId) return { totalParticipations: 0, history: [] };

  try {
    // Query finalized present records for user
    const attQuery = query(
      collection(db, 'match_attendance'),
      where('profileId', '==', profileId),
      where('attendanceStatus', '==', 'present')
    );

    const attSnap = await getDocs(attQuery);
    const historyItems: UserParticipationHistoryItem[] = [];

    for (const dSnap of attSnap.docs) {
      const attData = dSnap.data();
      const matchId = attData.matchId;

      // Fetch match session
      const matchSnap = await getDoc(doc(db, 'match_sessions', matchId));
      if (!matchSnap.exists()) continue;

      const mData = matchSnap.data();
      if (mData.status !== 'finished' && mData.status !== 'concluido') continue;

      // Fetch game title and details
      let gameTitle = 'Partida da Vila';
      let gameDate = mData.finishedAt || mData.createdAt || '';
      let gameLocation = 'Quadra da Vila';

      if (mData.gameId) {
        const gameSnap = await getDoc(doc(db, 'games', mData.gameId));
        if (gameSnap.exists()) {
          const gData = gameSnap.data();
          gameTitle = gData.title || gameTitle;
          gameDate = gData.scheduledAt || gameDate;
          gameLocation = gData.location || gameLocation;
        }
      }

      // Fetch participant info to know user's team
      const partRef = doc(db, 'match_participants', attData.matchParticipantId);
      const partSnap = await getDoc(partRef);
      let userTeamNum: 1 | 2 | null = null;
      if (partSnap.exists()) {
        userTeamNum = partSnap.data().teamNumber || null;
      }

      const teamAName = mData.teamAName || 'Time 1';
      const teamBName = mData.teamBName || 'Time 2';

      let userTeamName = userTeamNum === 1 ? teamAName : userTeamNum === 2 ? teamBName : 'Sem time';
      let opponentTeamName = userTeamNum === 1 ? teamBName : userTeamNum === 2 ? teamAName : '';

      let userSetsWon = userTeamNum === 1 ? mData.teamASetsWon || 0 : userTeamNum === 2 ? mData.teamBSetsWon || 0 : 0;
      let opponentSetsWon = userTeamNum === 1 ? mData.teamBSetsWon || 0 : userTeamNum === 2 ? mData.teamASetsWon || 0 : 0;

      let isWinner: boolean | null = null;
      if (mData.winnerTeam && userTeamNum) {
        isWinner = mData.winnerTeam === userTeamNum;
      }

      // Fetch set score breakdown
      const setsQuery = query(collection(db, 'match_sets'), where('matchId', '==', matchId));
      const setsSnap = await getDocs(setsQuery);
      const setsList: { setNumber: number; aScore: number; bScore: number }[] = [];

      setsSnap.forEach((sDoc) => {
        const sData = sDoc.data();
        setsList.push({
          setNumber: sData.setNumber,
          aScore: sData.teamAScore || 0,
          bScore: sData.teamBScore || 0,
        });
      });

      setsList.sort((a, b) => a.setNumber - b.setNumber);

      const setScoresFormatted = setsList
        .map((s) => (userTeamNum === 1 ? `${s.aScore}x${s.bScore}` : `${s.bScore}x${s.aScore}`))
        .join(' • ');

      historyItems.push({
        attendanceId: dSnap.id,
        matchId,
        gameId: mData.gameId || '',
        gameTitle,
        gameDate,
        gameLocation,
        userTeamName,
        opponentTeamName,
        userSetsWon,
        opponentSetsWon,
        isWinner,
        setScoresFormatted: setScoresFormatted || `${userSetsWon}x${opponentSetsWon}`,
        markedAt: attData.finalizedAt || attData.markedAt || '',
      });
    }

    // Sort by date descending
    historyItems.sort((a, b) => new Date(b.gameDate).getTime() - new Date(a.gameDate).getTime());

    return {
      totalParticipations: historyItems.length,
      history: historyItems,
    };
  } catch (err) {
    console.error('[attendanceService] getUserAttendanceHistory error:', err);
    return { totalParticipations: 0, history: [] };
  }
}
