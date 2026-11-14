import { useCallback, useState } from 'react';
import { GamePlayView } from './components/GamePlayView';
import { HowToPlayModal } from './components/HowToPlayModal';
import { TitleScreen } from './components/TitleScreen';
import { STAGES } from './game/stages';
import { clearSavedProgress, loadProgress, saveActiveRun } from './game/storage';
import { ActiveRunState, SavedProgress, StageId } from './game/types';

function createFreshRun(stageId: StageId): ActiveRunState {
  const stage = STAGES[stageId];
  return {
    stageId,
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
    },
  };
}

export default function App() {
  const [progress, setProgress] = useState<SavedProgress>(() => loadProgress());
  const [activeRun, setActiveRun] = useState<ActiveRunState | null>(null);
  const [runVersion, setRunVersion] = useState(0);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const startStage = useCallback((stageId: StageId) => {
    const fresh = createFreshRun(stageId);
    const updated = saveActiveRun(fresh);
    setProgress(updated);
    setActiveRun(fresh);
    setRunVersion((v) => v + 1);
  }, []);

  const resumeSavedRun = useCallback(() => {
    const latest = loadProgress();
    if (latest.activeRun) {
      setProgress(latest);
      setActiveRun(latest.activeRun);
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
      {activeRun ? (
        <GamePlayView
          key={`${activeRun.stageId}_${runVersion}`}
          initialRun={activeRun}
          onProgressUpdated={setProgress}
          onGoHome={goHome}
          onSwitchStage={startStage}
        />
      ) : (
        <TitleScreen
          progress={progress}
          onStartStage={startStage}
          onResumeRun={resumeSavedRun}
          onOpenHowToPlay={() => setShowHowToPlay(true)}
          onResetProgress={resetAllProgress}
        />
      )}

      {showHowToPlay && (
        <HowToPlayModal onClose={() => setShowHowToPlay(false)} />
      )}
    </>
  );
}
