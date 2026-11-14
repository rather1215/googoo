import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

export const CLASS_PASSCODE = '2026';
const SESSION_STORAGE_KEY = 'gugudan_student_session_v1';

export interface StudentSession {
  studentId: string;
  nickname: string;
  classCode: '2026';
}

export interface LeaderboardEntry {
  studentId: string;
  nickname: string;
  score: number;
  stars: number;
  solvedCount: number;
  clearedStages: number;
  bestAccuracy: number;
  playTimeSeconds: number;
  isPublic: boolean;
  classCode: string;
}

export interface ScoreDelta {
  scoreDelta: number;
  starsDelta: number;
  solvedDelta: number;
  playTimeDelta?: number;
  clearedStageCount?: number;
  accuracy?: number;
}

export function formatPlayTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (hours > 0) {
    return `${hours}시간 ${mins}분 ${secs}초`;
  }
  if (mins > 0) {
    return `${mins}분 ${secs}초`;
  }
  return `${secs}초`;
}

export function formatClockTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Deterministic ASCII document ID valid under ^[a-zA-Z0-9_-]+$ and <= 128 chars
export function toStudentId(nickname: string): string {
  const normalized = nickname.trim().normalize('NFC').toLowerCase();
  const bytes = new TextEncoder().encode(normalized);
  let hex = '';
  for (const b of bytes) {
    hex += b.toString(16).padStart(2, '0');
  }
  return `stu_${hex}`.slice(0, 128);
}

export function loadStudentSession(): StudentSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StudentSession>;
    if (
      typeof parsed.studentId === 'string' &&
      typeof parsed.nickname === 'string' &&
      parsed.classCode === CLASS_PASSCODE &&
      parsed.nickname.trim().length >= 1
    ) {
      return {
        studentId: parsed.studentId,
        nickname: parsed.nickname,
        classCode: CLASS_PASSCODE,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function clearStudentSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // ignore
  }
}

function saveStudentSession(session: StudentSession): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
}

export async function loginStudent(
  nicknameInput: string,
  passwordInput: string
): Promise<StudentSession> {
  const nickname = nicknameInput.trim().normalize('NFC');
  const password = passwordInput.trim();

  if (nickname.length < 1 || nickname.length > 20) {
    throw new Error('별명은 1글자 이상 20글자 이하로 입력해 주세요.');
  }

  if (password !== CLASS_PASSCODE) {
    throw new Error('비밀번호가 맞지 않아요! 학급 비밀번호 2026을 입력해 주세요.');
  }

  const studentId = toStudentId(nickname);
  const docPath = `leaderboard/${studentId}`;
  const docRef = doc(db, 'leaderboard', studentId);

  let existingSnap;
  try {
    existingSnap = await getDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
  }

  if (!existingSnap.exists()) {
    try {
      await setDoc(docRef, {
        studentId,
        nickname,
        score: 0,
        stars: 0,
        solvedCount: 0,
        clearedStages: 0,
        bestAccuracy: 0,
        playTimeSeconds: 0,
        isPublic: true,
        classCode: CLASS_PASSCODE,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, docPath);
    }
  }

  const session: StudentSession = {
    studentId,
    nickname: existingSnap.exists()
      ? String(existingSnap.data().nickname || nickname)
      : nickname,
    classCode: CLASS_PASSCODE,
  };
  saveStudentSession(session);
  return session;
}

export async function syncStudentScoreDelta(
  session: StudentSession,
  delta: ScoreDelta
): Promise<void> {
  const docPath = `leaderboard/${session.studentId}`;
  const docRef = doc(db, 'leaderboard', session.studentId);

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(docRef);
      const safeScoreDelta = Math.max(0, Math.round(delta.scoreDelta));
      const safeStarsDelta = Math.max(0, Math.round(delta.starsDelta));
      const safeSolvedDelta = Math.max(0, Math.round(delta.solvedDelta));
      const safeTimeDelta = Math.max(0, Math.round(delta.playTimeDelta ?? 0));
      const nextCleared = Math.min(3, Math.max(0, Math.round(delta.clearedStageCount ?? 0)));
      const nextAcc = Math.min(100, Math.max(0, Math.round(delta.accuracy ?? 0)));

      if (!snap.exists()) {
        tx.set(docRef, {
          studentId: session.studentId,
          nickname: session.nickname.slice(0, 20),
          score: Math.min(1000000, safeScoreDelta),
          stars: Math.min(10000, safeStarsDelta),
          solvedCount: Math.min(50000, safeSolvedDelta),
          clearedStages: nextCleared,
          bestAccuracy: nextAcc,
          playTimeSeconds: Math.min(8640000, safeTimeDelta),
          isPublic: true,
          classCode: CLASS_PASSCODE,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return;
      }

      const data = snap.data();
      const prevScore = typeof data.score === 'number' ? data.score : 0;
      const prevStars = typeof data.stars === 'number' ? data.stars : 0;
      const prevSolved = typeof data.solvedCount === 'number' ? data.solvedCount : 0;
      const prevCleared = typeof data.clearedStages === 'number' ? data.clearedStages : 0;
      const prevAcc = typeof data.bestAccuracy === 'number' ? data.bestAccuracy : 0;
      const prevPlayTime = typeof data.playTimeSeconds === 'number' ? data.playTimeSeconds : 0;

      tx.update(docRef, {
        score: Math.min(1000000, prevScore + safeScoreDelta),
        stars: Math.min(10000, prevStars + safeStarsDelta),
        solvedCount: Math.min(50000, prevSolved + safeSolvedDelta),
        clearedStages: Math.max(prevCleared, nextCleared),
        bestAccuracy: Math.max(prevAcc, nextAcc),
        playTimeSeconds: Math.min(8640000, prevPlayTime + safeTimeDelta),
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

function comparePlayTimeForRank(aSec: number, bSec: number): number {
  if (aSec === bSec) return 0;
  // Players who have recorded playtime (>0) rank ahead of unplayed (0) on a tie
  if (aSec === 0) return 1;
  if (bSec === 0) return -1;
  // Shorter total playtime ranks higher
  return aSec - bSec;
}

export function subscribeLeaderboard(
  onUpdate: (entries: LeaderboardEntry[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'leaderboard';
  const q = query(
    collection(db, path),
    where('isPublic', '==', true),
    limit(100)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: LeaderboardEntry[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          studentId: String(data.studentId ?? d.id),
          nickname: String(data.nickname ?? '탐험가'),
          score: typeof data.score === 'number' ? data.score : 0,
          stars: typeof data.stars === 'number' ? data.stars : 0,
          solvedCount: typeof data.solvedCount === 'number' ? data.solvedCount : 0,
          clearedStages: typeof data.clearedStages === 'number' ? data.clearedStages : 0,
          bestAccuracy: typeof data.bestAccuracy === 'number' ? data.bestAccuracy : 0,
          playTimeSeconds: typeof data.playTimeSeconds === 'number' ? data.playTimeSeconds : 0,
          isPublic: Boolean(data.isPublic),
          classCode: String(data.classCode ?? '2026'),
        };
      });

      items.sort(
        (a, b) =>
          b.score - a.score ||
          b.stars - a.stars ||
          comparePlayTimeForRank(a.playTimeSeconds, b.playTimeSeconds) ||
          b.solvedCount - a.solvedCount ||
          a.nickname.localeCompare(b.nickname, 'ko')
      );

      onUpdate(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}
