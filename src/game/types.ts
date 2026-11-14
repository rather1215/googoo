export type StageId = 1 | 2 | 3;

export type GameScreen =
  | 'TITLE'
  | 'PLAYING'
  | 'PAUSED'
  | 'GAME_OVER'
  | 'STAGE_CLEAR'
  | 'GAME_CLEAR';

export type Direction = 'down' | 'up' | 'left' | 'right';

export type TileChar = '#' | '.' | '~';

export type MonsterKind = 'slime' | 'green_slime' | 'blue_slime' | 'bat' | 'wizard' | 'boss';

export type ChestRewardType = 'stars' | 'heart' | 'hint' | 'golden_key';

export interface DoorEntity {
  id: string;
  x: number;
  y: number;
  opened: boolean;
  dans: number[];
  label: string;
}

export interface MonsterEntity {
  id: string;
  kind: MonsterKind;
  name: string;
  x: number;
  y: number;
  maxHp: number;
  hp: number;
  defeated: boolean;
  dans: number[];
  rewardStars: number;
  isBoss?: boolean;
}

export interface ChestEntity {
  id: string;
  x: number;
  y: number;
  opened: boolean;
  rewardType: ChestRewardType;
  amount: number;
  label: string;
}

export interface StageDefinition {
  id: StageId;
  name: string;
  subtitle: string;
  difficultyLabel: string;
  dansLabel: string;
  dans: number[];
  theme: 'forest' | 'cave' | 'castle';
  width: number;
  height: number;
  grid: string[];
  spawn: { x: number; y: number };
  midCheckpoint: { x: number; y: number };
  bossCheckpoint?: { x: number; y: number };
  exit: { x: number; y: number };
  doors: DoorEntity[];
  monsters: MonsterEntity[];
  chests: ChestEntity[];
}

export interface Question {
  key: string; // e.g. "6x7"
  a: number;
  b: number;
  answer: number;
  choices: number[];
  hint1: string;
  hint2: string;
  visualItem: 'apple' | 'star' | 'block';
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  createdAt: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface StageStats {
  solvedCount: number;
  firstTryCorrect: number;
  totalProblemsAttempted: number;
  starsEarned: number;
}

export interface ActiveRunState {
  stageId: StageId;
  playerX: number;
  playerY: number;
  facing: Direction;
  hearts: number;
  maxHearts: number;
  stars: number;
  hintItems: number;
  goldenKeys: number;
  openedDoorIds: string[];
  defeatedMonsterIds: string[];
  openedChestIds: string[];
  checkpoint: { x: number; y: number };
  wrongQuestionKeys: string[];
  stats: StageStats;
}

export interface StageRecord {
  cleared: boolean;
  bestStars: number;
  bestAccuracy: number;
  solvedCount: number;
}

export interface SavedProgress {
  unlockedStages: StageId[];
  records: Record<StageId, StageRecord>;
  totalStars: number;
  totalSolved: number;
  activeRun: ActiveRunState | null;
}

export type ActiveInteraction =
  | { type: 'door'; door: DoorEntity }
  | { type: 'monster'; monster: MonsterEntity }
  | { type: 'chest'; chest: ChestEntity }
  | { type: 'exit' };
