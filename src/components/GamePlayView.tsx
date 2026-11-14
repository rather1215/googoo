import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Clock,
  Gamepad2,
  Hand,
  Heart,
  KeyRound,
  Pause,
  Search,
  Sparkles,
  Star,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { formatClockTime, ScoreDelta, StudentSession } from '../game/leaderboard';
import { pickQuestion } from '../game/questions';
import { sound } from '../game/sound';
import { drawMazeScene } from '../game/sprites';
import { STAGES } from '../game/stages';
import { recordStageClear, saveActiveRun } from '../game/storage';
import {
  ActiveInteraction,
  ActiveRunState,
  ChestEntity,
  Direction,
  DoorEntity,
  FloatingText,
  MonsterEntity,
  Particle,
  Question,
  SavedProgress,
  StageId,
  StageStats,
} from '../game/types';
import { BattleModal } from './BattleModal';
import { DoorModal } from './DoorModal';
import { GameOverModal, PauseModal, StageClearModal } from './StageModals';

interface GamePlayViewProps {
  initialRun: ActiveRunState;
  studentSession: StudentSession;
  myLiveScore: number;
  onSyncScore: (delta: ScoreDelta) => void;
  onProgressUpdated: (next: SavedProgress) => void;
  onGoHome: () => void;
  onSwitchStage: (stageId: StageId) => void;
}

const TILE_SIZE = 48; // Exact 3x integer scale for 16x16 pixel sprites
const MOVE_DURATION_MS = 135;

export function GamePlayView({
  initialRun,
  studentSession,
  myLiveScore,
  onSyncScore,
  onProgressUpdated,
  onGoHome,
  onSwitchStage,
}: GamePlayViewProps) {
  const stage = STAGES[initialRun.stageId];

  const [playerPos, setPlayerPos] = useState({ x: initialRun.playerX, y: initialRun.playerY });
  const [facing, setFacing] = useState<Direction>(initialRun.facing);
  const [hearts, setHearts] = useState(initialRun.hearts);
  const [maxHearts] = useState(initialRun.maxHearts);
  const [stars, setStars] = useState(initialRun.stars);
  const [hintItems, setHintItems] = useState(initialRun.hintItems);
  const [goldenKeys, setGoldenKeys] = useState(initialRun.goldenKeys);
  const [checkpoint, setCheckpoint] = useState(initialRun.checkpoint);
  const [wrongPool, setWrongPool] = useState<string[]>(initialRun.wrongQuestionKeys);
  const [stats, setStats] = useState<StageStats>({
    ...initialRun.stats,
    elapsedSeconds: initialRun.stats.elapsedSeconds ?? 0,
  });
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(
    initialRun.stats.elapsedSeconds ?? 0
  );

  const [doors, setDoors] = useState<DoorEntity[]>(() =>
    stage.doors.map((d) => ({
      ...d,
      opened: initialRun.openedDoorIds.includes(d.id),
    }))
  );
  const [monsters, setMonsters] = useState<MonsterEntity[]>(() =>
    stage.monsters.map((m) => ({
      ...m,
      defeated: initialRun.defeatedMonsterIds.includes(m.id),
    }))
  );
  const [chests, setChests] = useState<ChestEntity[]>(() =>
    stage.chests.map((c) => ({
      ...c,
      opened: initialRun.openedChestIds.includes(c.id),
    }))
  );

  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(sound.isMuted());
  const [showTouchDpad, setShowTouchDpad] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768 || window.matchMedia?.('(pointer: coarse)').matches;
  });
  const [activeDoor, setActiveDoor] = useState<{ door: DoorEntity; question: Question } | null>(null);
  const [activeBattle, setActiveBattle] = useState<{ monster: MonsterEntity; question: Question } | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isStageCleared, setIsStageCleared] = useState(false);
  const [bannerToast, setBannerToast] = useState<string | null>(null);
  const [canvasBoxSize, setCanvasBoxSize] = useState<{ width: number; height: number } | null>(
    null
  );

  const lastQuestionKeyRef = useRef<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mainAreaRef = useRef<HTMLElement | null>(null);
  const pendingPlayTimeRef = useRef<number>(0);

  // Smooth visual movement state stored in refs for 60fps Canvas loop
  const moveAnimRef = useRef<{
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    startTime: number;
    moving: boolean;
  }>({
    fromX: initialRun.playerX,
    fromY: initialRun.playerY,
    toX: initialRun.playerX,
    toY: initialRun.playerY,
    startTime: 0,
    moving: false,
  });

  const heldDirectionRef = useRef<Direction | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const toastTimerRef = useRef<number | null>(null);

  const isOverlayOpen = Boolean(
    paused || activeDoor || activeBattle || isGameOver || isStageCleared
  );

  // Lock page scroll to top when entering gameplay view
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  // Dynamically expand maze canvas to fill maximum available viewport area cleanly
  useEffect(() => {
    const el = mainAreaRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      const padX = window.innerWidth >= 640 ? 28 : 16;
      const padY = window.innerWidth >= 640 ? 20 : 12;
      const availW = Math.max(240, rect.width - padX);
      const availH = Math.max(200, rect.height - padY);
      const aspect = stage.width / stage.height;

      let w = availW;
      let h = w / aspect;
      if (h > availH) {
        h = availH;
        w = h * aspect;
      }
      setCanvasBoxSize({
        width: Math.floor(w),
        height: Math.floor(h),
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, [stage.width, stage.height]);

  // Refocus game container without scrolling whenever overlays close
  const prevOverlayOpenRef = useRef(isOverlayOpen);
  useEffect(() => {
    if (prevOverlayOpenRef.current && !isOverlayOpen) {
      mainAreaRef.current?.focus({ preventScroll: true });
    }
    prevOverlayOpenRef.current = isOverlayOpen;
  }, [isOverlayOpen]);

  // Sync score & flush pending active playtime seconds to Firestore
  const syncWithPlayTime = useCallback(
    (delta: ScoreDelta) => {
      const timeDelta = pendingPlayTimeRef.current;
      pendingPlayTimeRef.current = 0;
      onSyncScore({
        ...delta,
        playTimeDelta: (delta.playTimeDelta ?? 0) + timeDelta,
      });
    },
    [onSyncScore]
  );

  const flushPendingPlayTime = useCallback(() => {
    const timeDelta = pendingPlayTimeRef.current;
    if (timeDelta <= 0) return;
    pendingPlayTimeRef.current = 0;
    onSyncScore({
      scoreDelta: 0,
      starsDelta: 0,
      solvedDelta: 0,
      playTimeDelta: timeDelta,
    });
  }, [onSyncScore]);

  // Flush unsynced playtime on unmount
  useEffect(() => {
    return () => {
      flushPendingPlayTime();
    };
  }, [flushPendingPlayTime]);

  // Active gameplay timer (counts 1s ticks while playing, paused during Pause/GameOver/Clear)
  useEffect(() => {
    if (paused || isGameOver || isStageCleared) return;
    const id = window.setInterval(() => {
      pendingPlayTimeRef.current += 1;
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [paused, isGameOver, isStageCleared]);

  const showToast = useCallback((msg: string) => {
    setBannerToast(msg);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setBannerToast(null);
    }, 2800);
  }, []);

  const spawnBurst = useCallback((gridX: number, gridY: number, colors: string[], count = 16) => {
    const cx = (gridX + 0.5) * TILE_SIZE;
    const cy = (gridY + 0.5) * TILE_SIZE;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 1.2 + Math.random() * 2.5;
      particlesRef.current.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.6,
        color: colors[i % colors.length],
        size: 4 + Math.floor(Math.random() * 4),
        life: 32 + Math.floor(Math.random() * 16),
        maxLife: 48,
      });
    }
  }, []);

  const addFloatingText = useCallback((gridX: number, gridY: number, text: string, color: string) => {
    floatingTextsRef.current.push({
      id: `${Date.now()}_${Math.random()}`,
      x: (gridX + 0.5) * TILE_SIZE,
      y: gridY * TILE_SIZE + 8,
      text,
      color,
      createdAt: performance.now(),
    });
  }, []);

  // Persist active run to localStorage whenever core progress changes
  useEffect(() => {
    if (isStageCleared) return;
    const runState: ActiveRunState = {
      stageId: stage.id,
      heroId: initialRun.heroId,
      playerX: playerPos.x,
      playerY: playerPos.y,
      facing,
      hearts,
      maxHearts,
      stars,
      hintItems,
      goldenKeys,
      openedDoorIds: doors.filter((d) => d.opened).map((d) => d.id),
      defeatedMonsterIds: monsters.filter((m) => m.defeated).map((m) => m.id),
      openedChestIds: chests.filter((c) => c.opened).map((c) => c.id),
      checkpoint,
      wrongQuestionKeys: wrongPool,
      stats: {
        ...stats,
        elapsedSeconds,
      },
    };
    const updated = saveActiveRun(runState);
    onProgressUpdated(updated);
  }, [
    stage.id,
    initialRun.heroId,
    playerPos.x,
    playerPos.y,
    facing,
    hearts,
    maxHearts,
    stars,
    hintItems,
    goldenKeys,
    doors,
    monsters,
    chests,
    checkpoint,
    wrongPool,
    stats,
    elapsedSeconds,
    isStageCleared,
    onProgressUpdated,
  ]);

  // Clear held direction when any modal opens
  useEffect(() => {
    if (isOverlayOpen) {
      heldDirectionRef.current = null;
    }
  }, [isOverlayOpen]);

  // Find nearby interactable object (prioritizing tile in front of facing direction, then any adjacent)
  const nearbyInteraction = useMemo((): ActiveInteraction | null => {
    const dirVec: Record<Direction, { dx: number; dy: number }> = {
      up: { dx: 0, dy: -1 },
      down: { dx: 0, dy: 1 },
      left: { dx: -1, dy: 0 },
      right: { dx: 1, dy: 0 },
    };

    const candidates: Array<{ x: number; y: number }> = [
      {
        x: playerPos.x + dirVec[facing].dx,
        y: playerPos.y + dirVec[facing].dy,
      },
      { x: playerPos.x, y: playerPos.y - 1 },
      { x: playerPos.x, y: playerPos.y + 1 },
      { x: playerPos.x - 1, y: playerPos.y },
      { x: playerPos.x + 1, y: playerPos.y },
    ];

    for (const pos of candidates) {
      const door = doors.find((d) => !d.opened && d.x === pos.x && d.y === pos.y);
      if (door) return { type: 'door', door };

      const monster = monsters.find((m) => !m.defeated && m.x === pos.x && m.y === pos.y);
      if (monster) return { type: 'monster', monster };

      const chest = chests.find((c) => !c.opened && c.x === pos.x && c.y === pos.y);
      if (chest) return { type: 'chest', chest };

      if (stage.exit.x === pos.x && stage.exit.y === pos.y) {
        return { type: 'exit' };
      }
    }

    return null;
  }, [playerPos.x, playerPos.y, facing, doors, monsters, chests, stage.exit.x, stage.exit.y]);

  const nearbyPromptInfo = useMemo(() => {
    if (!nearbyInteraction) return null;
    if (nearbyInteraction.type === 'door') {
      return {
        x: nearbyInteraction.door.x,
        y: nearbyInteraction.door.y,
        prompt: '문 열기!',
        buttonLabel: '문 열기 (스페이스)',
      };
    }
    if (nearbyInteraction.type === 'monster') {
      return {
        x: nearbyInteraction.monster.x,
        y: nearbyInteraction.monster.y,
        prompt: nearbyInteraction.monster.isBoss ? '보스 도전!' : '대결하기!',
        buttonLabel: `${nearbyInteraction.monster.name} 대결 (스페이스)`,
      };
    }
    if (nearbyInteraction.type === 'chest') {
      return {
        x: nearbyInteraction.chest.x,
        y: nearbyInteraction.chest.y,
        prompt: '상자 열기!',
        buttonLabel: '보물 상자 열기 (스페이스)',
      };
    }
    return {
      x: stage.exit.x,
      y: stage.exit.y,
      prompt: '출구!',
      buttonLabel: '출구로 탈출 (스페이스)',
    };
  }, [nearbyInteraction, stage.exit.x, stage.exit.y]);

  const completeStage = useCallback(() => {
    sound.playStageClear();
    const totalStarsForStage = stars;
    const accuracy =
      stats.totalProblemsAttempted > 0
        ? Math.round((stats.firstTryCorrect / stats.totalProblemsAttempted) * 100)
        : 100;
    setStats((prev) => ({ ...prev, starsEarned: totalStarsForStage, elapsedSeconds }));
    const nextProgress = recordStageClear(
      stage.id,
      totalStarsForStage,
      accuracy,
      stats.solvedCount,
      elapsedSeconds
    );
    onProgressUpdated(nextProgress);
    const clearedStageCount = ([1, 2, 3] as StageId[]).filter(
      (id) => nextProgress.records[id].cleared
    ).length;
    syncWithPlayTime({
      scoreDelta: stage.id * 100,
      starsDelta: 0,
      solvedDelta: 0,
      clearedStageCount,
      accuracy,
    });
    setIsStageCleared(true);
  }, [stars, stats, elapsedSeconds, stage.id, onProgressUpdated, syncWithPlayTime]);

  const triggerInteraction = useCallback(
    (target: ActiveInteraction | null) => {
      if (!target || isOverlayOpen) return;

      if (target.type === 'door') {
        sound.playSelect();
        const q = pickQuestion(target.door.dans, lastQuestionKeyRef.current, wrongPool);
        lastQuestionKeyRef.current = q.key;
        setActiveDoor({ door: target.door, question: q });
      } else if (target.type === 'monster') {
        sound.playSelect();
        const q = pickQuestion(target.monster.dans, lastQuestionKeyRef.current, wrongPool);
        lastQuestionKeyRef.current = q.key;
        setActiveBattle({ monster: target.monster, question: q });
      } else if (target.type === 'chest') {
        sound.playChestOpen();
        const chest = target.chest;
        setChests((prev) => prev.map((c) => (c.id === chest.id ? { ...c, opened: true } : c)));
        spawnBurst(chest.x, chest.y, ['#FBBF24', '#FEF08A', '#F59E0B', '#FFFFFF'], 20);

        if (chest.rewardType === 'stars') {
          setStars((s) => s + chest.amount);
          addFloatingText(chest.x, chest.y, `별 +${chest.amount}!`, '#FBBF24');
          showToast(`보물 상자 발견! ${chest.label}을(를) 얻었어요!`);
          syncWithPlayTime({
            scoreDelta: chest.amount * 20,
            starsDelta: chest.amount,
            solvedDelta: 0,
          });
        } else if (chest.rewardType === 'heart') {
          setHearts((h) => Math.min(maxHearts, h + chest.amount));
          addFloatingText(chest.x, chest.y, '하트 회복!', '#FB7185');
          showToast(`보물 상자 발견! ${chest.label}으로 하트를 회복했어요!`);
          syncWithPlayTime({ scoreDelta: 15, starsDelta: 0, solvedDelta: 0 });
        } else if (chest.rewardType === 'hint') {
          setHintItems((h) => h + chest.amount);
          addFloatingText(chest.x, chest.y, `힌트 +${chest.amount}!`, '#38BDF8');
          showToast(`보물 상자 발견! ${chest.label}을(를) 얻었어요!`);
          syncWithPlayTime({ scoreDelta: 15, starsDelta: 0, solvedDelta: 0 });
        } else if (chest.rewardType === 'golden_key') {
          setGoldenKeys((k) => k + chest.amount);
          addFloatingText(chest.x, chest.y, '황금 열쇠!', '#FDE047');
          showToast(`보물 상자 발견! ${chest.label}로 잠긴 문을 바로 열 수 있어요!`);
          syncWithPlayTime({ scoreDelta: 25, starsDelta: 0, solvedDelta: 0 });
        }
      } else if (target.type === 'exit') {
        completeStage();
      }
    },
    [
      isOverlayOpen,
      wrongPool,
      spawnBurst,
      addFloatingText,
      showToast,
      maxHearts,
      completeStage,
      syncWithPlayTime,
    ]
  );

  // Try moving 1 grid step
  const attemptStep = useCallback(
    (dir: Direction) => {
      if (isOverlayOpen || moveAnimRef.current.moving) return;

      setFacing(dir);

      const deltas: Record<Direction, { dx: number; dy: number }> = {
        up: { dx: 0, dy: -1 },
        down: { dx: 0, dy: 1 },
        left: { dx: -1, dy: 0 },
        right: { dx: 1, dy: 0 },
      };
      const nx = playerPos.x + deltas[dir].dx;
      const ny = playerPos.y + deltas[dir].dy;

      // Bounds & wall check
      if (nx < 0 || nx >= stage.width || ny < 0 || ny >= stage.height) {
        sound.playBump();
        return;
      }
      const tile = stage.grid[ny][nx];
      if (tile === '#' || tile === '~') {
        sound.playBump();
        return;
      }

      // Blocked by closed door or active monster or closed chest
      const blockedDoor = doors.find((d) => !d.opened && d.x === nx && d.y === ny);
      if (blockedDoor) {
        sound.playBump();
        return;
      }

      const blockedMonster = monsters.find((m) => !m.defeated && m.x === nx && m.y === ny);
      if (blockedMonster) {
        sound.playBump();
        return;
      }

      const blockedChest = chests.find((c) => !c.opened && c.x === nx && c.y === ny);
      if (blockedChest) {
        sound.playBump();
        return;
      }

      // Valid move!
      sound.playStep();
      moveAnimRef.current = {
        fromX: playerPos.x,
        fromY: playerPos.y,
        toX: nx,
        toY: ny,
        startTime: performance.now(),
        moving: true,
      };
      setPlayerPos({ x: nx, y: ny });

      // Update dynamic checkpoints as the player progresses deeper
      if (nx === stage.midCheckpoint.x && ny === stage.midCheckpoint.y) {
        setCheckpoint(stage.midCheckpoint);
      }
      if (stage.bossCheckpoint && nx === stage.bossCheckpoint.x && ny === stage.bossCheckpoint.y) {
        setCheckpoint(stage.bossCheckpoint);
      }

      // If stepped onto Exit Portal -> complete stage after brief glide
      if (nx === stage.exit.x && ny === stage.exit.y) {
        window.setTimeout(() => {
          completeStage();
        }, MOVE_DURATION_MS + 40);
      }
    },
    [
      isOverlayOpen,
      playerPos.x,
      playerPos.y,
      stage,
      doors,
      monsters,
      chests,
      completeStage,
    ]
  );

  // Keyboard controls (Arrows + WASD + Space + Escape)
  useEffect(() => {
    const keyToDir = (key: string): Direction | null => {
      switch (key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          return 'up';
        case 'ArrowDown':
        case 's':
        case 'S':
          return 'down';
        case 'ArrowLeft':
        case 'a':
        case 'A':
          return 'left';
        case 'ArrowRight':
        case 'd':
        case 'D':
          return 'right';
        default:
          return null;
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isOverlayOpen) {
        if (e.key === 'Escape' && paused) {
          setPaused(false);
        }
        return;
      }

      const dir = keyToDir(e.key);
      if (dir) {
        e.preventDefault();
        heldDirectionRef.current = dir;
        attemptStep(dir);
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        triggerInteraction(nearbyInteraction);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setPaused(true);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const dir = keyToDir(e.key);
      if (dir && heldDirectionRef.current === dir) {
        heldDirectionRef.current = null;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [attemptStep, isOverlayOpen, nearbyInteraction, paused, triggerInteraction]);

  // Continuous movement ticker while direction is held
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (heldDirectionRef.current && !isOverlayOpen && !moveAnimRef.current.moving) {
        attemptStep(heldDirectionRef.current);
      }
    }, 30);
    return () => window.clearInterval(interval);
  }, [attemptStep, isOverlayOpen]);

  // Main 60fps Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;

    const tick = (now: number) => {
      const anim = moveAnimRef.current;
      let visualX = playerPos.x;
      let visualY = playerPos.y;

      if (anim.moving) {
        const t = Math.min(1, (now - anim.startTime) / MOVE_DURATION_MS);
        visualX = anim.fromX + (anim.toX - anim.fromX) * t;
        visualY = anim.fromY + (anim.toY - anim.fromY) * t;
        if (t >= 1) {
          anim.moving = false;
          visualX = anim.toX;
          visualY = anim.toY;
        }
      }

      // Update particles
      particlesRef.current = particlesRef.current
        .map((p) => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.08,
          life: p.life - 1,
        }))
        .filter((p) => p.life > 0);

      // Prune old floating texts
      floatingTextsRef.current = floatingTextsRef.current.filter(
        (ft) => now - ft.createdAt < 1250
      );

      drawMazeScene({
        ctx,
        stage,
        tileSize: TILE_SIZE,
        heroId: initialRun.heroId,
        playerVisualX: visualX,
        playerVisualY: visualY,
        facing,
        isMoving: anim.moving,
        doors,
        monsters,
        chests,
        nearbyTarget: nearbyPromptInfo
          ? { x: nearbyPromptInfo.x, y: nearbyPromptInfo.y, prompt: nearbyPromptInfo.prompt }
          : null,
        particles: particlesRef.current,
        floatingTexts: floatingTextsRef.current,
        time: now,
      });

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [
    stage,
    initialRun.heroId,
    playerPos.x,
    playerPos.y,
    facing,
    doors,
    monsters,
    chests,
    nearbyPromptInfo,
  ]);

  // Allow clicking/tapping adjacent object directly on canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isOverlayOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const gx = Math.floor(((e.clientX - rect.left) * scaleX) / TILE_SIZE);
    const gy = Math.floor(((e.clientY - rect.top) * scaleY) / TILE_SIZE);

    const dist = Math.abs(gx - playerPos.x) + Math.abs(gy - playerPos.y);
    if (dist === 1) {
      const door = doors.find((d) => !d.opened && d.x === gx && d.y === gy);
      if (door) return triggerInteraction({ type: 'door', door });
      const monster = monsters.find((m) => !m.defeated && m.x === gx && m.y === gy);
      if (monster) return triggerInteraction({ type: 'monster', monster });
      const chest = chests.find((c) => !c.opened && c.x === gx && c.y === gy);
      if (chest) return triggerInteraction({ type: 'chest', chest });
      if (stage.exit.x === gx && stage.exit.y === gy) return triggerInteraction({ type: 'exit' });
    }
  };

  const recordQuestionAttempt = useCallback(
    (questionKey: string, isCorrect: boolean, isFirstTry: boolean) => {
      if (isCorrect) {
        setStats((prev) => ({
          ...prev,
          solvedCount: prev.solvedCount + 1,
          totalProblemsAttempted: isFirstTry ? prev.totalProblemsAttempted + 1 : prev.totalProblemsAttempted,
          firstTryCorrect: isFirstTry ? prev.firstTryCorrect + 1 : prev.firstTryCorrect,
        }));
      } else {
        setWrongPool((prev) => (prev.includes(questionKey) ? prev : [...prev, questionKey]));
        if (isFirstTry) {
          setStats((prev) => ({
            ...prev,
            totalProblemsAttempted: prev.totalProblemsAttempted + 1,
          }));
        }
      }
    },
    []
  );

  const openedDoorsCount = doors.filter((d) => d.opened).length;
  const defeatedMonstersCount = monsters.filter((m) => m.defeated).length;

  const dpadPress = (dir: Direction) => {
    heldDirectionRef.current = dir;
    attemptStep(dir);
  };
  const dpadRelease = () => {
    heldDirectionRef.current = null;
  };

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-[#121A24] text-slate-100 select-none">
      {/* Compact Top HUD Bar */}
      <header className="shrink-0 border-b-2 border-[#2A3749] bg-[#182230] px-3 py-2 sm:px-5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2.5">
          {/* Stage Identity */}
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl border-2 border-[#261C15] bg-amber-400 px-2.5 py-1 font-display text-xs text-slate-950 whitespace-nowrap shrink-0 sm:text-sm">
              스테이지 {stage.id}
            </div>
            <div className="min-w-0">
              <h1 className="font-display truncate text-base text-white sm:text-lg">
                {stage.name}
              </h1>
              <p className="text-[11px] font-medium text-slate-300 whitespace-nowrap sm:text-xs">
                {stage.dansLabel} · 문 {openedDoorsCount}/{doors.length} · 적 {defeatedMonstersCount}/{monsters.length}
              </p>
            </div>
          </div>

          {/* Hearts, Stars, Playtime, Items, Audio & Pause */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Hearts */}
            <div
              className="flex items-center gap-1 rounded-xl border-2 border-[#261C15] bg-[#222F42] px-2.5 py-1 tabular-nums"
              aria-label={`하트 ${hearts}개`}
            >
              {Array.from({ length: maxHearts }).map((_, i) => (
                <Heart
                  key={i}
                  className={`h-4 w-4 transition-transform sm:h-5 sm:w-5 ${
                    i < hearts
                      ? 'fill-rose-500 text-rose-400'
                      : 'fill-slate-700 text-slate-600'
                  }`}
                />
              ))}
              <span className="ml-1 text-xs font-bold text-slate-200">
                {hearts}/{maxHearts}
              </span>
            </div>

            {/* Stars */}
            <div className="flex items-center gap-1 rounded-xl border-2 border-[#261C15] bg-[#222F42] px-2.5 py-1 font-display text-sm text-amber-300 tabular-nums sm:text-base">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400 sm:h-5 sm:w-5" />
              <span>{stars}</span>
            </div>

            {/* Playtime Clock */}
            <div
              className="flex items-center gap-1 rounded-xl border-2 border-[#261C15] bg-[#222F42] px-2.5 py-1 text-xs font-bold text-sky-200 tabular-nums sm:text-sm"
              aria-label="플레이 시간"
            >
              <Clock className="h-4 w-4 text-sky-300" />
              <span>{formatClockTime(elapsedSeconds)}</span>
            </div>

            {/* Student Live Score */}
            <div className="hidden items-center gap-1.5 rounded-xl border-2 border-[#261C15] bg-emerald-900/80 px-2.5 py-1 text-xs font-bold text-emerald-100 tabular-nums md:flex">
              <span>{studentSession.nickname}</span>
              <span aria-hidden="true">·</span>
              <span>{myLiveScore.toLocaleString()}점</span>
            </div>

            {/* Collected Inventory Items */}
            {hintItems > 0 && (
              <div className="flex items-center gap-1 rounded-xl border-2 border-sky-700 bg-sky-950/70 px-2 py-1 text-xs font-bold text-sky-200 tabular-nums">
                <Search className="h-3.5 w-3.5 text-sky-300" />
                <span>힌트 {hintItems}</span>
              </div>
            )}
            {goldenKeys > 0 && (
              <div className="flex items-center gap-1 rounded-xl border-2 border-amber-600 bg-amber-950/70 px-2 py-1 text-xs font-bold text-amber-200 tabular-nums">
                <KeyRound className="h-3.5 w-3.5 text-amber-300" />
                <span>열쇠 {goldenKeys}</span>
              </div>
            )}

            {/* Sound Mute */}
            <button
              type="button"
              onClick={() => {
                const next = !muted;
                sound.setMuted(next);
                setMuted(next);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#261C15] bg-[#222F42] text-slate-200 hover:bg-[#2C3B52] focus-visible:outline-2 focus-visible:outline-amber-400"
              aria-label={muted ? '소리 켜기' : '소리 끄기'}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>

            {/* Pause Button */}
            <button
              type="button"
              onClick={() => {
                flushPendingPlayTime();
                setPaused(true);
              }}
              className="pixel-btn inline-flex h-9 items-center gap-1.5 rounded-xl border-2 border-[#261C15] bg-[#F5EFE0] px-3 font-display text-sm text-slate-900 whitespace-nowrap shrink-0"
            >
              <Pause className="h-4 w-4" />
              <span>일시정지</span>
            </button>
          </div>
        </div>
      </header>

      {/* Center Maze Canvas Area — Fills all remaining viewport space */}
      <main
        ref={mainAreaRef}
        tabIndex={-1}
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-1.5 outline-none sm:p-3"
      >
        {/* Absolute floating toast so it NEVER causes vertical layout jumps */}
        {bannerToast && (
          <div className="pixel-box pointer-events-none absolute top-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-xl border-2 border-[#261C15] bg-amber-300 px-4 py-2 font-display text-sm text-slate-950 shadow-lg whitespace-nowrap sm:text-base">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span>{bannerToast}</span>
          </div>
        )}

        <div className="pixel-box overflow-hidden rounded-2xl border-4 border-[#261C15] bg-[#0D131B] p-1 sm:p-1.5">
          <canvas
            ref={canvasRef}
            width={stage.width * TILE_SIZE}
            height={stage.height * TILE_SIZE}
            onClick={handleCanvasClick}
            style={
              canvasBoxSize
                ? {
                    width: `${canvasBoxSize.width}px`,
                    height: `${canvasBoxSize.height}px`,
                  }
                : undefined
            }
            className="pixel-canvas block cursor-pointer rounded-xl"
          />
        </div>
      </main>

      {/* Compact Bottom Controls Bar */}
      <footer className="shrink-0 border-t-2 border-[#2A3749] bg-[#182230] px-3 py-2 sm:px-5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          {/* Left: Optional D-pad + Keyboard hints */}
          <div className="flex items-center gap-3">
            {showTouchDpad && (
              <div className="grid grid-cols-3 gap-1" role="group" aria-label="방향 이동 버튼">
                <div />
                <button
                  type="button"
                  onPointerDown={() => dpadPress('up')}
                  onPointerUp={dpadRelease}
                  onPointerLeave={dpadRelease}
                  className="pixel-btn flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[#261C15] bg-[#2B3B52] text-white active:bg-amber-400 active:text-slate-950"
                  aria-label="위로 이동"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <div />
                <button
                  type="button"
                  onPointerDown={() => dpadPress('left')}
                  onPointerUp={dpadRelease}
                  onPointerLeave={dpadRelease}
                  className="pixel-btn flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[#261C15] bg-[#2B3B52] text-white active:bg-amber-400 active:text-slate-950"
                  aria-label="왼쪽으로 이동"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onPointerDown={() => dpadPress('down')}
                  onPointerUp={dpadRelease}
                  onPointerLeave={dpadRelease}
                  className="pixel-btn flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[#261C15] bg-[#2B3B52] text-white active:bg-amber-400 active:text-slate-950"
                  aria-label="아래로 이동"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onPointerDown={() => dpadPress('right')}
                  onPointerUp={dpadRelease}
                  onPointerLeave={dpadRelease}
                  className="pixel-btn flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[#261C15] bg-[#2B3B52] text-white active:bg-amber-400 active:text-slate-950"
                  aria-label="오른쪽으로 이동"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowTouchDpad((v) => !v)}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border-2 border-[#261C15] bg-[#222F42] px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-[#2C3B52] whitespace-nowrap shrink-0"
            >
              <Gamepad2 className="h-4 w-4 text-amber-300" />
              <span>{showTouchDpad ? '화면 방향키 접기' : '화면 방향키 켜기'}</span>
            </button>

            <div className="hidden items-center gap-3 text-xs text-slate-300 md:flex">
              <span className="font-bold text-slate-100">이동: 방향키 또는 WASD</span>
              <span aria-hidden="true" className="text-slate-500">·</span>
              <span>상호작용: 스페이스바 또는 대상 클릭</span>
            </div>
          </div>

          {/* Primary Interact Action Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={!nearbyInteraction}
              onClick={() => triggerInteraction(nearbyInteraction)}
              className={`pixel-btn inline-flex min-h-[44px] items-center gap-2 rounded-xl border-3 border-[#261C15] px-5 py-2 font-display text-base whitespace-nowrap shrink-0 sm:text-lg ${
                nearbyInteraction
                  ? 'bg-amber-400 text-slate-950'
                  : 'cursor-not-allowed bg-slate-700 text-slate-400 opacity-65'
              }`}
            >
              <Hand className="h-5 w-5" />
              <span>
                {nearbyPromptInfo ? nearbyPromptInfo.buttonLabel : '가까이 가면 열려요'}
              </span>
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {activeDoor && (
        <DoorModal
          door={activeDoor.door}
          question={activeDoor.question}
          theme={stage.theme}
          hintItems={hintItems}
          goldenKeys={goldenKeys}
          onUseHintItem={() => setHintItems((h) => Math.max(0, h - 1))}
          onWrongAttempt={(key, isFirstTry) => {
            recordQuestionAttempt(key, false, isFirstTry);
          }}
          onSuccess={(firstTry, usedGoldenKey) => {
            if (usedGoldenKey) {
              setGoldenKeys((k) => Math.max(0, k - 1));
              syncWithPlayTime({ scoreDelta: 10, starsDelta: 0, solvedDelta: 0 });
            } else {
              recordQuestionAttempt(activeDoor.question.key, true, firstTry);
              syncWithPlayTime({
                scoreDelta: firstTry ? 15 : 10,
                starsDelta: 0,
                solvedDelta: 1,
              });
            }
            const door = activeDoor.door;
            setDoors((prev) =>
              prev.map((d) => (d.id === door.id ? { ...d, opened: true } : d))
            );
            spawnBurst(door.x, door.y, ['#FBBF24', '#34D399', '#FFFFFF'], 18);
            addFloatingText(door.x, door.y, '문이 열렸어요!', '#A7F3D0');
            if (stage.id === 3 && door.id === 's3_d4' && stage.bossCheckpoint) {
              setCheckpoint(stage.bossCheckpoint);
            }
            setActiveDoor(null);
          }}
          onClose={() => setActiveDoor(null)}
        />
      )}

      {activeBattle && (
        <BattleModal
          monster={activeBattle.monster}
          heroId={initialRun.heroId}
          initialQuestion={activeBattle.question}
          playerHearts={hearts}
          maxHearts={maxHearts}
          hintItems={hintItems}
          wrongPool={wrongPool}
          onUseHintItem={() => setHintItems((h) => Math.max(0, h - 1))}
          onRecordAttempt={(qKey, isCorrect, isFirstTry) => {
            recordQuestionAttempt(qKey, isCorrect, isFirstTry);
            if (isCorrect) {
              syncWithPlayTime({
                scoreDelta: isFirstTry ? 15 : 10,
                starsDelta: 0,
                solvedDelta: 1,
              });
            }
          }}
          onPlayerHurt={() => {
            const next = Math.max(0, hearts - 1);
            setHearts(next);
            return next;
          }}
          onVictory={(rewardStars) => {
            const m = activeBattle.monster;
            setMonsters((prev) =>
              prev.map((mon) => (mon.id === m.id ? { ...mon, hp: 0, defeated: true } : mon))
            );
            setStars((s) => s + rewardStars);
            syncWithPlayTime({
              scoreDelta: rewardStars * 20,
              starsDelta: rewardStars,
              solvedDelta: 0,
            });
            spawnBurst(m.x, m.y, ['#FBBF24', '#F472B6', '#FFFFFF'], 24);
            addFloatingText(m.x, m.y, `승리! 별 +${rewardStars}`, '#FDE047');
            if (m.id === 's3_m5') {
              setCheckpoint({ x: m.x, y: m.y });
            } else if (m.id === 's1_m2' || m.id === 's2_m2') {
              setCheckpoint(stage.midCheckpoint);
            }
            setActiveBattle(null);
            if (m.isBoss) {
              showToast('구구단 마법사를 물리쳤어요! 뒤쪽 출구로 나가세요!');
            }
          }}
          onGameOver={() => {
            flushPendingPlayTime();
            setActiveBattle(null);
            setIsGameOver(true);
          }}
        />
      )}

      {paused && (
        <PauseModal
          stageName={`스테이지 ${stage.id} · ${stage.name}`}
          onResume={() => setPaused(false)}
          onRestartStage={() => {
            flushPendingPlayTime();
            setPaused(false);
            onSwitchStage(stage.id);
          }}
          onGoHome={() => {
            flushPendingPlayTime();
            setPaused(false);
            onGoHome();
          }}
        />
      )}

      {isGameOver && (
        <GameOverModal
          onRespawnCheckpoint={() => {
            setHearts(maxHearts);
            setPlayerPos(checkpoint);
            moveAnimRef.current = {
              fromX: checkpoint.x,
              fromY: checkpoint.y,
              toX: checkpoint.x,
              toY: checkpoint.y,
              startTime: 0,
              moving: false,
            };
            setIsGameOver(false);
            showToast('하트 3개가 모두 회복되었어요! 다시 힘차게 도전해요!');
          }}
          onGoHome={() => {
            flushPendingPlayTime();
            setIsGameOver(false);
            onGoHome();
          }}
        />
      )}

      {isStageCleared && (
        <StageClearModal
          stageId={stage.id}
          stageName={stage.name}
          stats={{ ...stats, elapsedSeconds }}
          isFinalGameClear={stage.id === 3}
          onReplay={() => onSwitchStage(stage.id)}
          onNextStage={() => onSwitchStage((stage.id + 1) as StageId)}
          onGoHome={onGoHome}
        />
      )}
    </div>
  );
}
