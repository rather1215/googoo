import { useCallback, useEffect, useMemo, useState } from 'react';
import { GamePlayView } from './components/GamePlayView';
import { HowToPlayModal } from './components/HowToPlayModal';
import { LoginScreen } from './components/LoginScreen';
import { StageSelectScreen } from './components/StageSelectScreen';
import {
  clearStudentSession,
  LeaderboardEntry,
  loadStudentSession,
  loginStudent,
  ScoreDelta,
  StudentSession,
  subscribeLeaderboard,
  syncStudentScoreDelta,
} from './game/leaderboard';
import { STAGES } from './game/stages';
import {
  clearSavedProgress,
  loadProgress,
  saveActiveRun,
  saveSelectedHero,
} from './game/storage';
import { ActiveRunState, HeroId, SavedProgress, StageId } from './game/types';

function createFreshRun(stageId: StageId, heroId: HeroId): ActiveRunState {
  const stage = STAGES[stageId];
  return {
    stageId,
    heroId,
    playerX: stage.spawn.x,
    playerY: stage.spawn.y,
    facing: 'down',
    hearts: 3,
    maxHearts: 3,
    stars: 0,
    hintItems: 0,
    goldenKeys: 0,
    openedDoorIds: [],
    defeatedMonsterIds: [],
    openedChestIds: [],
    checkpoint: { ...stage.spawn },
    wrongQuestionKeys: [],
    stats: {
      solvedCount: 0,
      firstTryCorrect: 0,
      totalProblemsAttempted: 0,
      starsEarned: 0,
      elapsedSeconds: 0,
    },
  };
}

export default function App() {
  const [progress, setProgress] = useState<SavedProgress>(() => loadProgress());
  const [studentSession, setStudentSession] = useState<StudentSession | null>(() =>
    loadStudentSession()
  );
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);

  const [activeRun, setActiveRun] = useState<ActiveRunState | null>(null);
  const [runVersion, setRunVersion] = useState(0);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  // Real-time Firestore leaderboard subscription on boot (visible on first screen)
  useEffect(() => {
    const unsubscribe = subscribeLeaderboard(
      (entries) => {
        setLeaderboard(entries);
        setLeaderboardLoading(false);
        setLeaderboardError(null);
      },
      (err) => {
        setLeaderboardLoading(false);
        setLeaderboardError(err.message);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = useCallback(async (nickname: string, password: string) => {
    const session = await loginStudent(nickname, password);
    setStudentSession(session);
  }, []);

  const handleLogout = useCallback(() => {
    clearStudentSession();
    setStudentSession(null);
    setActiveRun(null);
  }, []);

  const handleSelectHero = useCallback((heroId: HeroId) => {
    const updated = saveSelectedHero(heroId);
    setProgress(updated);
  }, []);

  const handleSyncScore = useCallback(
    (delta: ScoreDelta) => {
      if (!studentSession) return;
      void syncStudentScoreDelta(studentSession, delta).catch((err) => {
        console.error('Score sync error:', err);
      });
    },
    [studentSession]
  );

  const myLiveScore = useMemo(() => {
    if (!studentSession) return 0;
    const found = leaderboard.find((e) => e.studentId === studentSession.studentId);
    return found?.score ?? 0;
  }, [leaderboard, studentSession]);

  const startStage = useCallback(
    (stageId: StageId) => {
      const latest = loadProgress();
      const fresh = createFreshRun(stageId, latest.selectedHero ?? progress.selectedHero);
      const updated = saveActiveRun(fresh);
      setProgress(updated);
      setActiveRun(fresh);
      setRunVersion((v) => v + 1);
    },
    [progress.selectedHero]
  );

  const resumeSavedRun = useCallback(() => {
    const latest = loadProgress();
    if (latest.activeRun) {
      const saved = latest.activeRun;
      const stage = STAGES[saved.stageId];
      const inBounds =
        saved.playerX >= 0 &&
        saved.playerX < stage.width &&
        saved.playerY >= 0 &&
        saved.playerY < stage.height &&
        stage.grid[saved.playerY]?.[saved.playerX] === '.';

      const nextRun: ActiveRunState = inBounds
        ? {
            ...saved,
            heroId: saved.heroId ?? latest.selectedHero,
            stats: {
              ...saved.stats,
              elapsedSeconds: saved.stats?.elapsedSeconds ?? 0,
            },
          }
        : createFreshRun(saved.stageId, latest.selectedHero);

      setProgress(latest);
      setActiveRun(nextRun);
      setRunVersion((v) => v + 1);
    }
  }, []);

  const goHome = useCallback(() => {
    setActiveRun(null);
    setProgress(loadProgress());
  }, []);

  const resetAllProgress = useCallback(() => {
    const reset = clearSavedProgress();
    setProgress(reset);
    setActiveRun(null);
  }, []);

  return (
    <>
      {!studentSession ? (
        <LoginScreen
          leaderboard={leaderboard}
          leaderboardLoading={leaderboardLoading}
          leaderboardError={leaderboardError}
          onLogin={handleLogin}
        />
      ) : activeRun ? (
        <GamePlayView
          key={`${activeRun.stageId}_${runVersion}`}
          initialRun={activeRun}
          studentSession={studentSession}
          myLiveScore={myLiveScore}
          onSyncScore={handleSyncScore}
          onProgressUpdated={setProgress}
          onGoHome={goHome}
          onSwitchStage={startStage}
        />
      ) : (
        <StageSelectScreen
          progress={progress}
          studentSession={studentSession}
          leaderboard={leaderboard}
          leaderboardLoading={leaderboardLoading}
          leaderboardError={leaderboardError}
          onSelectHero={handleSelectHero}
          onStartStage={startStage}
          onResumeRun={resumeSavedRun}
          onOpenHowToPlay={() => setShowHowToPlay(true)}
          onLogout={handleLogout}
          onResetProgress={resetAllProgress}
        />
      )}

      {showHowToPlay && (
        <HowToPlayModal onClose={() => setShowHowToPlay(false)} />
      )}
    </>
  );
}
