import { ActiveRunState, SavedProgress, StageId } from './types';

const STORAGE_KEY = 'gugudan_maze_explorers_save_v1';

const DEFAULT_PROGRESS: SavedProgress = {
  unlockedStages: [1],
  records: {
    1: { cleared: false, bestStars: 0, bestAccuracy: 0, solvedCount: 0 },
    2: { cleared: false, bestStars: 0, bestAccuracy: 0, solvedCount: 0 },
    3: { cleared: false, bestStars: 0, bestAccuracy: 0, solvedCount: 0 },
  },
  totalStars: 0,
  totalSolved: 0,
  activeRun: null,
};

export function loadProgress(): SavedProgress {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<SavedProgress>;
    return {
      unlockedStages: Array.isArray(parsed.unlockedStages) && parsed.unlockedStages.length > 0
        ? (parsed.unlockedStages as StageId[])
        : [1],
      records: {
        ...DEFAULT_PROGRESS.records,
        ...(parsed.records || {}),
      },
      totalStars: typeof parsed.totalStars === 'number' ? parsed.totalStars : 0,
      totalSolved: typeof parsed.totalSolved === 'number' ? parsed.totalSolved : 0,
      activeRun: parsed.activeRun ?? null,
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function saveProgress(progress: SavedProgress): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage quota errors
  }
}

export function saveActiveRun(run: ActiveRunState | null): SavedProgress {
  const current = loadProgress();
  const next: SavedProgress = {
    ...current,
    activeRun: run,
  };
  saveProgress(next);
  return next;
}

export function recordStageClear(
  stageId: StageId,
  starsEarned: number,
  accuracy: number,
  solvedCount: number
): SavedProgress {
  const current = loadProgress();
  const prevRecord = current.records[stageId];
  const nextUnlocked = new Set<StageId>(current.unlockedStages);
  if (stageId === 1) nextUnlocked.add(2);
  if (stageId === 2) nextUnlocked.add(3);

  const updatedRecords = {
    ...current.records,
    [stageId]: {
      cleared: true,
      bestStars: Math.max(prevRecord.bestStars, starsEarned),
      bestAccuracy: Math.max(prevRecord.bestAccuracy, accuracy),
      solvedCount: Math.max(prevRecord.solvedCount, solvedCount),
    },
  };

  const totalStars = ([1, 2, 3] as StageId[]).reduce(
    (sum, id) => sum + updatedRecords[id].bestStars,
    0
  );

  const next: SavedProgress = {
    unlockedStages: Array.from(nextUnlocked).sort() as StageId[],
    records: updatedRecords,
    totalStars,
    totalSolved: current.totalSolved + solvedCount,
    activeRun: null,
  };

  saveProgress(next);
  return next;
}

export function clearSavedProgress(): SavedProgress {
  saveProgress(DEFAULT_PROGRESS);
  return DEFAULT_PROGRESS;
}
